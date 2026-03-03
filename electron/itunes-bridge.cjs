/**
 * itunes-bridge.cjs — iOS device bridge via MobileDevice.dll + CLI tools
 *
 * Binary lookup order (all tools):
 *  1. <project>/drivers/<binary>.exe   ← drop your binaries here
 *  2. itunes-files/itunesFlashDll/      ← existing DLL folder
 *  3. System PATH
 *
 * Drop any of these into drivers/ to enable that feature:
 *   idevice_id.exe      → iOS device listing
 *   ideviceinfo.exe     → iOS diagnostics
 *   idevicebackup2.exe  → iOS backup / restore
 *   MobileDevice.dll    → native plug/unplug events (optional override)
 *   CoreFoundation.dll  → required with MobileDevice.dll
 */

'use strict'

const path = require('path')
const fs = require('fs')
const { execFile } = require('child_process')
const { promisify } = require('util')
const execP = promisify(execFile)

// ── Canonical paths ───────────────────────────────────────────────────────────
const ELECTRON_DIR = __dirname

// Flat drivers/ folder — user drops binaries here
const DRIVERS_DIR = (() => {
    const dev = path.join(ELECTRON_DIR, '..', 'drivers')
    const prod = process.resourcesPath ? path.join(process.resourcesPath, 'drivers') : null
    return (prod && fs.existsSync(prod)) ? prod : dev
})()

// DLL folder — MobileDevice.dll lives in itunes-files/itunesFlashDll/
const DLL_CANDIDATES = [
    process.resourcesPath && path.join(process.resourcesPath, 'itunes-tools', 'itunesFlashDll'),
    process.resourcesPath && path.join(process.resourcesPath, 'itunes-tools'),
    path.join(ELECTRON_DIR, '..', 'itunes-files', 'itunesFlashDll'),
    path.join(ELECTRON_DIR, '..', 'itunes-files'),
]
const DLL_DIR = DLL_CANDIDATES.find(p => { try { return p && fs.existsSync(p) } catch { return false } })
    || path.join(ELECTRON_DIR, '..', 'itunes-files', 'itunesFlashDll')

/** Resolve a CLI binary: checks drivers/, android/, ios/, then PATH */
function bin(name) {
    const ext = process.platform === 'win32' ? '.exe' : ''
    const base = name.replace(/\.exe$/i, '')
    const candidates = [
        path.join(DRIVERS_DIR, base + ext),
        path.join(DRIVERS_DIR, 'ios', base + ext),
        path.join(DRIVERS_DIR, 'android', base + ext),
    ]
    return candidates.find(p => fs.existsSync(p)) ?? name
}

const IDEVICE_ID_BIN = bin('idevice_id')
const IDEVICEINFO_BIN = bin('ideviceinfo')
const IDEVICEDIAGNOSTICS_BIN = bin('idevicediagnostics')
const IDEVICECRASHREPORT_BIN = bin('idevicecrashreport')
const IDEVICESYSLOG_BIN = bin('idevicesyslog')

console.log('[iTunesBridge] drivers dir :', DRIVERS_DIR)
console.log('[iTunesBridge] DLL dir     :', DLL_DIR)
console.log('[iTunesBridge] idevice_id  :', IDEVICE_ID_BIN)
console.log('[iTunesBridge] ideviceinfo :', IDEVICEINFO_BIN)
console.log('[iTunesBridge] idevicediag :', IDEVICEDIAGNOSTICS_BIN)
console.log('[iTunesBridge] idevicecrash:', IDEVICECRASHREPORT_BIN)
console.log('[iTunesBridge] idevicesyslog:', IDEVICESYSLOG_BIN)
console.log('[iTunesBridge] MobileDevice.dll:', fs.existsSync(path.join(DLL_DIR, 'MobileDevice.dll')))

// ── DLL device cache (populated by koffi notification callbacks) ──────────────
const _deviceCache = new Map()
let _dllReady = false

// ── koffi + MobileDevice.dll ─────────────────────────────────────────────────
let koffi = null
try { koffi = require('koffi') } catch (e) {
    console.warn('[iTunesBridge] koffi unavailable:', e.message)
}

const MOBILE_DEVICE_DLL = path.join(DLL_DIR, 'MobileDevice.dll')
const CORE_FOUNDATION_DLL = path.join(DLL_DIR, 'CoreFoundation.dll')

// Also allow the user to override DLLs by placing them in drivers/
function resolveDll(name) {
    const inDrivers = path.join(DRIVERS_DIR, name)
    return fs.existsSync(inDrivers) ? inDrivers : path.join(DLL_DIR, name)
}

if (koffi && fs.existsSync(resolveDll('MobileDevice.dll')) && fs.existsSync(resolveDll('CoreFoundation.dll'))) {
    try {
        const mdLib = koffi.load(resolveDll('MobileDevice.dll'))
        const cfLib = koffi.load(resolveDll('CoreFoundation.dll'))

        const CFStringRef = koffi.pointer('ib_CFStringRef', koffi.opaque())
        const AMDeviceRef = koffi.pointer('ib_AMDeviceRef', koffi.opaque())
        const InfoStruct = koffi.struct('ib_AMDeviceInfo', { dev: AMDeviceRef, msg: 'uint32' })
        const CBProto = koffi.proto('void ib_AMDeviceNotifCB(ib_AMDeviceInfo *info, void *ctx)')

        const Subscribe = mdLib.func('AMDeviceNotificationSubscribe', 'int',
            [koffi.pointer(CBProto), 'uint32', 'uint32', 'void*', koffi.pointer('void*')])
        const CopyDeviceId = mdLib.func('AMDeviceCopyDeviceIdentifier', CFStringRef, [AMDeviceRef])
        const CFStringGetPtr = cfLib.func('CFStringGetCStringPtr', 'const char*', [CFStringRef, 'uint32'])
        const kCFUTF8 = 0x08000100

        const readCFStr = cfStr => { try { return CFStringGetPtr(cfStr, kCFUTF8) || null } catch { return null } }

        const notifCb = koffi.register((infoPtr) => {
            try {
                const info = koffi.decode(infoPtr, InfoStruct)
                if (info.msg === 1 || info.msg === 3) {
                    const udid = readCFStr(CopyDeviceId(info.dev)) || `device-${Date.now()}`
                    _deviceCache.set(udid, { id: udid, type: 'ios', platform: 'ios', name: 'iOS Device', serial: udid, via: 'MobileDevice.dll' })
                    console.log('[iTunesBridge] Device connected:', udid)
                } else if (info.msg === 2) {
                    for (const [k, d] of _deviceCache) { if (d.via === 'MobileDevice.dll') { _deviceCache.delete(k); break } }
                }
            } catch (e) { console.warn('[iTunesBridge] Callback error:', e.message) }
        }, koffi.pointer(CBProto))

        const rc = Subscribe(notifCb, 0, 0, null, Buffer.alloc(8))
        if (rc === 0) { _dllReady = true; console.log('[iTunesBridge] AMDeviceNotificationSubscribe active') }
        else console.warn('[iTunesBridge] Subscribe rc:', rc)
    } catch (e) { console.warn('[iTunesBridge] DLL setup error:', e.message) }
} else {
    console.warn('[iTunesBridge] MobileDevice.dll not found — using CLI only')
}

// ── CLI helpers ───────────────────────────────────────────────────────────────
async function cliListUdids() {
    try {
        const { stdout } = await execP(IDEVICE_ID_BIN, ['-l'], { timeout: 6000, windowsHide: true })
        return stdout.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
    } catch { return [] }
}

async function cliDeviceName(udid) {
    try {
        const { stdout } = await execP(IDEVICEINFO_BIN, ['-u', udid, '-k', 'DeviceName'], { timeout: 5000, windowsHide: true })
        return stdout.trim() || null
    } catch { return null }
}

async function ideviceinfoFull(udid) {
    try {
        const { stdout } = await execP(IDEVICEINFO_BIN, ['-u', udid], { timeout: 8000, windowsHide: true })
        const map = {}
        for (const line of stdout.split(/\r?\n/)) {
            const idx = line.indexOf(': ')
            if (idx > 0) map[line.slice(0, idx).trim()] = line.slice(idx + 2).trim()
        }
        return map
    } catch { return {} }
}

// ── Public API ────────────────────────────────────────────────────────────────
async function getConnectedIOSDevices() {
    const results = new Map()

    // 1. DLL event cache (fastest — captures plug events while app is running)
    for (const [id, dev] of _deviceCache) results.set(id, dev)

    // 2. CLI probe — finds devices already connected before startup
    for (const udid of await cliListUdids()) {
        if (!results.has(udid)) {
            const name = await cliDeviceName(udid) || 'iOS Device'
            results.set(udid, { id: udid, type: 'ios', platform: 'ios', name, serial: udid, via: 'idevice_id' })
        } else if (results.get(udid).name === 'iOS Device') {
            const name = await cliDeviceName(udid)
            if (name) results.get(udid).name = name
        }
    }

    return [...results.values()]
}

async function scanDevice(deviceId) {
    // 1. Basic info
    const info = await ideviceinfoFull(deviceId)
    if (!Object.keys(info).length) return {
        os: { platform: 'iOS', version: 'Unknown', build: 'Unknown' },
        battery: { percent: null, charging: false, health: 'Unknown', cycles: 'N/A', tempC: null, maxCapacity: null, designCapacity: null },
        storage: { capacity: null, free: null, capacityBytes: null, freeBytes: null },
        hardware: { model: 'iOS Device', serial: deviceId, imei: 'N/A', udid: deviceId, cpuArch: 'Unknown' },
    }

    // 2. Deep Battery Domain
    let battData = {}
    try {
        const { stdout } = await execP(IDEVICEINFO_BIN, ['-u', deviceId, '-q', 'com.apple.mobile.battery'], { timeout: 4000, windowsHide: true })
        for (const line of stdout.split(/\r?\n/)) {
            const idx = line.indexOf(': ')
            if (idx > 0) battData[line.slice(0, idx).trim()] = line.slice(idx + 2).trim()
        }
    } catch { }

    // 3. Deep Storage Domain
    let diskData = {}
    try {
        const { stdout } = await execP(IDEVICEINFO_BIN, ['-u', deviceId, '-q', 'com.apple.disk_usage'], { timeout: 4000, windowsHide: true })
        for (const line of stdout.split(/\r?\n/)) {
            const idx = line.indexOf(': ')
            if (idx > 0) diskData[line.slice(0, idx).trim()] = line.slice(idx + 2).trim()
        }
    } catch { }

    // 4. FMIP Domain (iCloud Lock)
    let fmipData = {}
    try {
        const { stdout } = await execP(IDEVICEINFO_BIN, ['-u', deviceId, '-q', 'com.apple.fmip'], { timeout: 4000, windowsHide: true })
        for (const line of stdout.split(/\r?\n/)) {
            const idx = line.indexOf(': ')
            if (idx > 0) fmipData[line.slice(0, idx).trim()] = line.slice(idx + 2).trim()
        }
    } catch { }

    const toGB = b => b ? `${(b / 1e9).toFixed(1)} GB` : null

    // Deep Battery math
    const cycles = parseInt(battData['CycleCount'], 10)
    const designCap = parseInt(battData['DesignCapacity'], 10)
    const maxCap = parseInt(battData['RawMaxCapacity'] || battData['AppleRawMaxCapacity'], 10)
    let trueHealth = null
    if (designCap && maxCap) {
        trueHealth = Math.round((maxCap / designCap) * 100)
    }
    const tempK = parseInt(battData['Temperature'], 10) // usually in deci-Kelvin or raw value
    let tempC = null
    if (tempK && tempK > 1000) tempC = (tempK / 100) - Math.abs(273.15) // Convert deci-Kelvin

    // Storage math (Data partition is what user cares about)
    // If deep domain fails, fallback to basic info keys
    const totalB = parseInt(diskData['TotalDataCapacity'] || info['TotalDiskCapacity'] || '0', 10) || null
    const freeB = parseInt(diskData['TotalDataAvailable'] || info['AvailableDeviceCapacity'] || '0', 10) || null

    return {
        os: { platform: 'iOS', version: info['ProductVersion'] || 'Unknown', build: info['BuildVersion'] || 'Unknown' },
        battery: {
            percent: parseInt(battData['BatteryCurrentCapacity'] || info['BatteryCurrentCapacity'] || '0', 10) || null,
            charging: (battData['BatteryIsCharging'] || info['BatteryIsCharging']) === 'true' || (battData['BatteryIsCharging'] === '1'),
            health: trueHealth ? `${trueHealth}%` : (info['BatteryHealth'] || 'Unknown'),
            cycles: isNaN(cycles) ? 'N/A' : cycles,
            tempC: tempC,
            maxCapacity: maxCap || null,
            designCapacity: designCap || null
        },
        storage: { capacity: toGB(totalB), free: toGB(freeB), capacityBytes: totalB, freeBytes: freeB },
        hardware: {
            model: info['ProductType'] || 'Unknown', friendlyModel: info['DeviceName'] || 'iOS Device',
            partNumber: info['ModelNumber'] || 'Unknown', hardwareModel: info['HardwareModel'] || 'Unknown',
            serial: info['SerialNumber'] || deviceId, imei: info['InternationalMobileEquipmentIdentity'] || 'N/A',
            udid: deviceId, cpuArch: info['CPUArchitecture'] || 'Unknown',
            activationState: info['ActivationState'] || 'Unknown',
            fmip: fmipData['IsFindMyiPhoneEnabled'] === 'true' || fmipData['IsFindMyiPhoneEnabled'] === '1',
            region: info['RegionInfo'] || 'Unknown'
        },
    }
}

function translateScan(raw) {
    const { battery: batt, storage: store, os, hardware: hw } = raw ?? {}
    const storeStr = store?.capacity && store?.free ? `${store.free} free / ${store.capacity}` : (store?.capacity || 'Unknown')
    const osStr = os?.version && os.version !== 'Unknown' ? `iOS ${os.version}${os.build && os.build !== 'Unknown' ? ` (${os.build})` : ''}` : 'Unknown'
    const issues = []

    if (batt?.percent != null && batt.percent < 20) issues.push(`Battery low (${batt.percent}%)`)
    if (batt?.health && typeof batt.health === 'string' && batt.health.includes('%')) {
        const h = parseInt(batt.health)
        if (h < 85 && h > 0) issues.push(`Battery degraded (${h}% health)`)
        if (h <= 79 && h > 0) issues.push(`Service Battery Required`)
    }
    if (batt?.cycles && typeof batt.cycles === 'number' && batt.cycles > 800) issues.push(`High battery cycles (${batt.cycles})`)
    if (batt?.tempC && batt.tempC > 45) issues.push(`High temperature: ${batt.tempC.toFixed(1)}°C`)
    if (store?.capacityBytes && store?.freeBytes && 1 - store.freeBytes / store.capacityBytes > 0.9) issues.push('Storage nearly full (>90%)')

    if (hw?.activationState === 'Unactivated') issues.push('Device is not activated')
    if (hw?.fmip) issues.push('iCloud Activation Lock (FMI) is ON')

    return {
        battery: batt?.percent ?? null,
        storage: storeStr,
        ram: 'N/A (iOS managed)',
        os: osStr,
        temperature: batt?.tempC != null ? `${batt.tempC.toFixed(1)}°C` : 'Normal',
        overall: issues.length ? 'Issues Detected' : 'Healthy',
        score: Math.max(0, Math.min(100, 100 - issues.length * 15)),
        issues,
        model: hw?.friendlyModel || hw?.model || 'iOS Device',
        modelNumber: hw?.partNumber || 'N/A',
        internalModel: hw?.hardwareModel || 'N/A',
        serial: hw?.serial || '',
        imei: hw?.imei || '',
        fmip: hw?.fmip ? 'ON' : 'OFF',
        activation: hw?.activationState || 'Unknown'
    }
}

async function runDiagnosticTest(deviceId, type) {
    try {
        const { stdout } = await execP(IDEVICEDIAGNOSTICS_BIN, ['-u', deviceId, 'diagnostics', type], { timeout: 15000, windowsHide: true })
        return { success: true, data: stdout }
    } catch (e) {
        return { success: false, error: e.message }
    }
}

async function powerOperation(deviceId, operation) {
    try {
        // operation can be: restart, shutdown, sleep
        await execP(IDEVICEDIAGNOSTICS_BIN, ['-u', deviceId, operation], { timeout: 5000, windowsHide: true })
        return { success: true }
    } catch (e) {
        return { success: false, error: e.message }
    }
}

async function extractCrashReports(deviceId, destDir) {
    try {
        // idevicecrashreport -u <uuid> -e <destDir> (extract and clear)
        // using just extract for now
        const { stdout } = await execP(IDEVICECRASHREPORT_BIN, ['-u', deviceId, destDir], { timeout: 60000, windowsHide: true })
        return { success: true, log: stdout }
    } catch (e) {
        return { success: false, error: e.message }
    }
}

function startSyslog(deviceId, onData, onError, onClose) {
    const { spawn } = require('child_process')
    const proc = spawn(IDEVICESYSLOG_BIN, ['-u', deviceId], { windowsHide: true })

    proc.stdout.on('data', (d) => onData?.(d.toString()))
    proc.stderr.on('data', (d) => onError?.(d.toString()))
    proc.on('close', (code) => onClose?.(code))

    return {
        stop: () => {
            try { proc.kill() } catch { }
        }
    }
}

module.exports = {
    isAvailable: true,
    dllReady: _dllReady,
    deviceCache: _deviceCache,
    getConnectedIOSDevices,
    scanDevice,
    translateScan,
    runDiagnosticTest,
    powerOperation,
    extractCrashReports,
    startSyslog
}
