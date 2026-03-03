/**
 * electron/3utools-bridge.cjs
 *
 * Native DLL bridge to the 3uTools device management libraries bundled in
 * `itunes-files/` → packaged as `resources/itunes-tools/`.
 *
 * Uses koffi (Foreign Function Interface) to call:
 *   - idm_info.dll   → hardware/software device info
 *   - libplist2.dll  → Apple plist parsing (device manifest data)
 *
 * IMPORTANT: Every require/load is wrapped in try/catch so a DLL load failure
 * NEVER crashes the Electron main process (black screen prevention).
 *
 * Exports the same shape as itunes-bridge.cjs so callers are interchangeable.
 */

'use strict'

const path = require('path')
const fs = require('fs')
const { execFile } = require('child_process')
const { promisify } = require('util')
const execP = promisify(execFile)

// ── Resolve tools directory ───────────────────────────────────────────────────
const ELECTRON_DIR = __dirname

function resolveToolsDir() {
    // Dev: project root / itunes-files
    const devDir = path.join(ELECTRON_DIR, '..', 'itunes-files')
    const prodDir = process.resourcesPath
        ? path.join(process.resourcesPath, 'itunes-tools')
        : null

    if (prodDir && fs.existsSync(path.join(prodDir, 'idm_info.dll'))) return prodDir
    if (fs.existsSync(path.join(devDir, 'idm_info.dll'))) return devDir
    return devDir  // fallback best-effort
}

const TOOLS_DIR = resolveToolsDir()

// Also look for the itunesFlashDll sub-folder (original structure)
function resolveFlashDllDir() {
    const sub = path.join(ELECTRON_DIR, '..', 'itunes-files', 'itunesFlashDll')
    if (fs.existsSync(sub)) return sub
    return TOOLS_DIR
}
const FLASH_DLL_DIR = resolveFlashDllDir()

// ── koffi FFI loader ──────────────────────────────────────────────────────────
let koffi = null
try {
    koffi = require('koffi')
} catch (e) {
    console.warn('[3uToolsBridge] koffi not available — DLL calls disabled:', e.message)
}

// ── idm_info.dll interface ────────────────────────────────────────────────────
// idm_info.dll contains 3uTools' internal device info logic. The exported
// function names are not fixed — they vary by version and are not publicly
// documented. We try a safe probe and skip silently if not found.
// iOS detection is instead handled by itunes-bridge.cjs (MobileDevice.dll).
let idmInfo = null
const IDM_INFO_PATH = path.join(TOOLS_DIR, 'idm_info.dll')

if (koffi && fs.existsSync(IDM_INFO_PATH)) {
    // We only load the DLL — no function bindings without confirmed export names.
    // Future: enumerate exports with a tool like dumpbin to find real names.
    console.log('[3uToolsBridge] idm_info.dll present but function names unconfirmed — skipping bindings')
}

// ── libidevicerestore.dll ─────────────────────────────────────────────────────
// Same situation — export names are not confirmed. Skip silently.
let idmRestore = null
const RESTORE_DLL_PATH = path.join(TOOLS_DIR, 'libidevicerestore.dll')

if (koffi && fs.existsSync(RESTORE_DLL_PATH)) {
    console.log('[3uToolsBridge] libidevicerestore.dll present — skipping (export names unconfirmed)')
}

// ── Native DLL helper ─────────────────────────────────────────────────────────
function callDll(fn, ...args) {
    if (!fn) return null
    try {
        const bufLen = 4096
        const buf = Buffer.alloc(bufLen)
        const rc = fn(buf, bufLen, ...args)
        if (rc === 0) {
            const str = buf.toString('utf8').replace(/\0.*$/, '').trim()
            if (str) return JSON.parse(str)
        }
    } catch (e) {
        console.warn('[3uToolsBridge] DLL call error:', e.message)
    }
    return null
}

// ── ADB helpers ───────────────────────────────────────────────────────────────
// Flat drivers/ folder — user drops adb.exe (+ AdbWinApi.dll) here.
const _DRIVERS_DIR = (() => {
    const dev = path.join(ELECTRON_DIR, '..', 'drivers')
    const prod = process.resourcesPath ? path.join(process.resourcesPath, 'drivers') : null
    return (prod && fs.existsSync(prod)) ? prod : dev
})()

function _binPath(name) {
    const ext = process.platform === 'win32' ? '.exe' : ''
    const base = name.replace(/\.exe$/i, '')
    const candidates = [
        path.join(_DRIVERS_DIR, base + ext),
        path.join(_DRIVERS_DIR, 'android', base + ext),
        path.join(_DRIVERS_DIR, 'ios', base + ext),
    ]
    return candidates.find(p => fs.existsSync(p)) ?? name
}

const ADB_BIN = _binPath('adb')
console.log('[3uToolsBridge] drivers dir:', _DRIVERS_DIR)
console.log('[3uToolsBridge] adb binary :', ADB_BIN)


// Start ADB server once on load so it's ready when we first query devices.
// This is especially important when adb.exe lives in a path with spaces
// (e.g. C:\Program Files\NovaOps\resources\drivers) because the ADB server
// spawns a child of itself and needs ANDROID_ADB_SERVER_PORT + its own dir
// on PATH to locate itself correctly.
const _adbEnv = { ...process.env, ANDROID_ADB_SERVER_PORT: '5037' }
const _adbDir = require('path').dirname(ADB_BIN)
if (_adbDir && _adbDir !== '.') {
    _adbEnv.PATH = _adbDir + (process.env.PATH ? ';' + process.env.PATH : '')
}
try {
    execP(ADB_BIN, ['start-server'], { timeout: 8000, windowsHide: true, env: _adbEnv })
        .then(() => console.log('[3uToolsBridge] ADB server started'))
        .catch(e => console.warn('[3uToolsBridge] ADB start-server:', e.message))
} catch { }

async function adbDevices() {
    const devices = []
    try {
        const { stdout } = await execP(ADB_BIN, ['devices', '-l'], { timeout: 8000, windowsHide: true, env: _adbEnv })
        const lines = stdout.split('\n').slice(1).filter(l => l.includes('\t') && !l.includes('offline'))
        for (const line of lines) {
            const parts = line.trim().split(/\s+/)
            const serial = parts[0]
            const modelPart = parts.find(p => p.startsWith('model:'))
            const productPart = parts.find(p => p.startsWith('product:'))
            let name = modelPart
                ? modelPart.replace('model:', '').replace(/_/g, ' ')
                : (productPart ? productPart.replace('product:', '') : 'Android Device')
            // Get more info from getprop
            try {
                const { stdout: brand } = await execP(ADB_BIN, ['-s', serial, 'shell', 'getprop', 'ro.product.brand'], { timeout: 3000, windowsHide: true, env: _adbEnv })
                const { stdout: model } = await execP(ADB_BIN, ['-s', serial, 'shell', 'getprop', 'ro.product.model'], { timeout: 3000, windowsHide: true, env: _adbEnv })
                name = `${brand.trim()} ${model.trim()}`.trim() || name
            } catch { }
            devices.push({ id: serial, type: 'android', name: name.trim(), serial, platform: 'android' })
        }
    } catch (e) {
        console.log('[3uToolsBridge] ADB not found or no devices:', e.message)
    }
    return devices
}

async function adbScanDevice(serial) {
    const run = async (cmd) => {
        try { const { stdout } = await execP(ADB_BIN, ['-s', serial, 'shell', ...cmd], { timeout: 8000, windowsHide: true, env: _adbEnv }); return stdout.trim() }
        catch { return '' }
    }

    // Execute queries concurrently
    const [
        brand, model, deviceName, androidVer, sdkVer,
        dfData, meminfoSys, cpuModel, temp0,
        dumpsysBattery, dumpsysCpu, dumpsysSensors
    ] = await Promise.all([
        run(['getprop', 'ro.product.brand']),
        run(['getprop', 'ro.product.model']),
        run(['getprop', 'ro.product.name']),
        run(['getprop', 'ro.build.version.release']),
        run(['getprop', 'ro.build.version.sdk']),
        run(['df', '/data']),
        run(['cat', '/proc/meminfo']),
        run(['getprop', 'ro.board.platform']),
        run(['cat', '/sys/class/thermal/thermal_zone0/temp']),
        run(['dumpsys', 'battery']),
        run(['dumpsys', 'cpuinfo']),
        run(['dumpsys', 'sensorservice', '|', 'grep', '-i', '"active"'])
    ])

    // --- Parsing Logic ---

    // Storage
    let totalStorageStr = '', freeStorageStr = ''
    const dfMatch = dfData.match(/\S+\s+(\S+)\s+\S+\s+\S+\s+(\S+)/m)
    if (dfMatch) {
        totalStorageStr = dfMatch[1]
        freeStorageStr = dfMatch[2]
        // Fix for modern Android `df` output format differences
        if (totalStorageStr.includes('%')) {
            const match3 = dfData.match(/\S+\s+(\S+)\s+\S+\s+(\S+)/m)
            if (match3) { totalStorageStr = match3[1]; freeStorageStr = match3[2] }
        }
    }
    const toBytes = (kbStr) => kbStr ? parseInt(kbStr) * 1024 : null
    const toGB = (kbStr) => { const n = parseInt(kbStr); return n ? `${(n / 1048576).toFixed(1)} GB` : null }

    // Memory
    const ramTotalStr = meminfoSys.match(/MemTotal:\s+(\d+)/)?.[1]
    const ramFreeStr = meminfoSys.match(/MemAvailable:\s+(\d+)/)?.[1] || meminfoSys.match(/MemFree:\s+(\d+)/)?.[1]

    // Battery (Dumpsys)
    // Map health codes: 1=Unknown, 2=Good, 3=Overheat, 4=Dead, 5=OverVolt, 6=Failure, 7=Cold
    const healthMap = { '1': 'Unknown', '2': 'Good', '3': 'Overheat', '4': 'Dead', '5': 'Over Voltage', '6': 'Failure', '7': 'Cold' }
    const battLevelStr = dumpsysBattery.match(/level:\s+(\d+)/)?.[1]
    const battStatus = dumpsysBattery.match(/status:\s+(\d+)/)?.[1]
    const battHealthCode = dumpsysBattery.match(/health:\s+(\d+)/)?.[1] || '1'
    const battCycles = dumpsysBattery.match(/charge counter:\s+(\d+)/)?.[1] // sometimes used as cycle count or mAh in µAh depending on OEM

    const battPercent = battLevelStr ? parseInt(battLevelStr) : null
    const isCharging = battStatus === '2' || battStatus === '5'
    const battHealth = healthMap[battHealthCode] || 'Unknown'

    // CPU Info (Dumpsys)
    // Extract aggregate system load or running threads
    const cpuLoadMatch = dumpsysCpu.match(/Load:\s+(.+)/)
    const cpuLoad = cpuLoadMatch ? cpuLoadMatch[1] : 'Idle'

    // Sensore Service
    const activeSensors = dumpsysSensors ? dumpsysSensors.split('\n').map(l => l.trim()).filter(Boolean).length : 0

    // Thermal
    const tempC = temp0 ? (parseInt(temp0) / 1000).toFixed(1) : null

    return {
        os: { platform: 'Android', version: androidVer || 'Unknown', build: `API ${sdkVer}` },
        battery: {
            percent: battPercent,
            charging: isCharging,
            health: battHealth,
            cycles: battCycles ? (parseInt(battCycles) > 50000 ? `${parseInt(battCycles) / 1000} mAh` : battCycles) : 'N/A'
        },
        storage: {
            capacity: toGB(totalStorageStr),
            free: toGB(freeStorageStr),
            capacityBytes: toBytes(totalStorageStr),
            freeBytes: toBytes(freeStorageStr)
        },
        memory: {
            totalKb: parseInt(ramTotalStr) || null,
            freeKb: parseInt(ramFreeStr) || null
        },
        hardware: {
            model: model || deviceName || 'Android Device',
            friendlyModel: `${brand} ${model}`.trim(),
            serial,
            brand: brand || '',
            cpu: cpuModel || 'Unknown'
        },
        temperature: tempC,
        diagnostics: {
            cpuLoad,
            activeSensors,
            dumpsysSnapshot: true
        }
    }
}

// ── iOS detection via idm_info.dll or iTunes bridge ───────────────────────────
async function detectIOSDevices() {
    // 1. Try native DLL (fastest, most reliable)
    if (idmInfo?.GetDeviceCount && idmInfo?.GetDeviceInfo) {
        try {
            const count = idmInfo.GetDeviceCount()
            if (count > 0) {
                const info = callDll(idmInfo.GetDeviceInfo)
                if (info) {
                    return [{
                        id: info.udid || info.serial || 'unknown',
                        type: 'ios',
                        name: info.deviceName || info.model || 'iOS Device',
                        serial: info.serial || info.udid || '',
                        platform: 'ios',
                        via: 'idm_info',
                    }]
                }
            }
        } catch (e) { console.warn('[3uToolsBridge] idm_info device detect failed:', e.message) }
    }

    // 2. Fall back to idevice_id CLI — check drivers/ first, then itunes-files, then PATH
    const ideviceIdBin = [
        path.join(_DRIVERS_DIR, 'idevice_id.exe'),
        path.join(FLASH_DLL_DIR, 'idevice_id.exe'),
        path.join(TOOLS_DIR, 'idevice_id.exe'),
        'idevice_id',
    ].find(p => { try { return p === 'idevice_id' || fs.existsSync(p) } catch { return false } }) || 'idevice_id'
    console.log('[3uToolsBridge] idevice_id bin:', ideviceIdBin)

    try {
        const { stdout } = await execP(ideviceIdBin, ['-l'], { timeout: 5000, windowsHide: true })
        const udids = stdout.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
        const results = []
        for (const udid of udids) {
            let name = 'iOS Device'
            const ideviceinfoBin = [
                path.join(_DRIVERS_DIR, 'ideviceinfo.exe'),
                path.join(FLASH_DLL_DIR, 'ideviceinfo.exe'),
                path.join(TOOLS_DIR, 'ideviceinfo.exe'),
                'ideviceinfo',
            ].find(p => { try { return p === 'ideviceinfo' || fs.existsSync(p) } catch { return false } }) || 'ideviceinfo'
            try {
                const { stdout: n } = await execP(ideviceinfoBin, ['-u', udid, '-k', 'DeviceName'], { timeout: 3000, windowsHide: true })
                name = n.trim() || name
            } catch { }
            results.push({ id: udid, type: 'ios', name, serial: udid, platform: 'ios', via: 'idevice_id' })
        }
        return results
    } catch { }

    return []
}

async function iosInfoViaDll(deviceId) {
    // Try DLL native read first
    if (idmInfo?.GetDeviceInfo && idmInfo?.GetBatteryInfo && idmInfo?.GetStorageInfo) {
        try {
            const [devInfo, battInfo, storInfo] = [
                callDll(idmInfo.GetDeviceInfo),
                callDll(idmInfo.GetBatteryInfo),
                callDll(idmInfo.GetStorageInfo),
            ]
            if (devInfo) {
                function toGB(b) { return b ? `${(parseInt(b) / 1e9).toFixed(1)} GB` : null }
                return {
                    os: { platform: 'iOS', version: devInfo.productVersion || 'Unknown', build: devInfo.buildVersion || 'Unknown' },
                    battery: { percent: battInfo?.percent ?? null, charging: !!battInfo?.charging, health: battInfo?.health || 'Unknown', cycles: battInfo?.cycles || 'N/A' },
                    storage: { capacity: toGB(storInfo?.total), free: toGB(storInfo?.free), capacityBytes: storInfo?.total || null, freeBytes: storInfo?.free || null },
                    hardware: { model: devInfo.productType || 'Unknown', friendlyModel: devInfo.deviceName || 'iOS Device', serial: devInfo.serial || deviceId, imei: devInfo.imei || 'N/A', udid: deviceId, cpuArch: devInfo.cpuArch || 'Unknown' },
                }
            }
        } catch (e) { console.warn('[3uToolsBridge] idm_info scan failed:', e.message) }
    }
    return null
}

// ── Public API (same shape as itunes-bridge.cjs) ─────────────────────────────

async function getConnectedDevices() {
    const [android, ios] = await Promise.all([adbDevices(), detectIOSDevices()])
    return [...android, ...ios]
}

async function getConnectedIOSDevices() {
    return detectIOSDevices()
}

async function scanDevice(deviceId, deviceType) {
    if (deviceType === 'android') return adbScanDevice(deviceId)
    // iOS — delegate to itunes-bridge for deep diagnostics (battery domains, FMIP, parts)
    try {
        const itunesBridge = require('./itunes-bridge.cjs')
        return itunesBridge.scanDevice(deviceId)
    } catch { throw new Error('No iOS diagnostic tool available') }
}

function translateScan(raw) {
    const batt = raw?.battery
    const store = raw?.storage
    const mem = raw?.memory
    const os = raw?.os
    const hw = raw?.hardware

    const battStr = batt?.percent != null ? `${batt.percent}%${batt.charging ? ' ⚡' : ''}` : 'Unknown'
    const storeStr = store?.capacity && store?.free ? `${store.free} free / ${store.capacity}` : (store?.capacity || 'Unknown')
    const ramStr = mem?.totalKb && mem?.freeKb
        ? `${(mem.freeKb / 1048576).toFixed(1)} GB free / ${(mem.totalKb / 1048576).toFixed(1)} GB`
        : (os?.platform === 'iOS' ? 'Managed by iOS' : 'Unknown')
    const osStr = os?.platform === 'iOS'
        ? `iOS ${os.version}${os.build ? ' (' + os.build + ')' : ''}`
        : os?.platform === 'Android' ? `Android ${os.version || ''}`.trim() : 'Unknown'

    const issues = []
    if (batt?.percent != null && batt.percent < 20) issues.push('Battery critically low')
    if (store?.capacityBytes && store?.freeBytes) {
        if (1 - store.freeBytes / store.capacityBytes > 0.9) issues.push('Storage nearly full (>90% used)')
    }
    const tempNum = typeof raw?.temperature === 'string' ? parseFloat(raw.temperature) : raw?.temperature
    if (tempNum && tempNum > 45) issues.push(`High temperature: ${tempNum}°C`)

    return {
        battery: batt?.percent ?? null,
        storage: storeStr,
        ram: ramStr,
        os: osStr,
        temperature: raw?.temperature ? `${raw.temperature}°C` : 'Normal',
        overall: issues.length === 0 ? 'Healthy' : 'Issues Detected',
        score: Math.max(50, Math.min(100, 85 - issues.length * 15)),
        issues,
        model: hw?.friendlyModel || hw?.model || 'Device',
        serial: hw?.serial || '',
        imei: hw?.imei || '',
        diagnostics: raw?.diagnostics || null, // newly passed from Android adbScanDevice
    }
}

/**
 * Restore a device from an IPSW file using libidevicerestore.dll.
 * Falls back to spawning idevicerestore CLI if DLL call fails.
 */
async function restoreIpsw(udid, ipswFile) {
    if (idmRestore?.RestoreDevice) {
        try {
            const udidBuf = Buffer.from(udid + '\0')
            const ipswBuf = Buffer.from(ipswFile + '\0')
            const rc = idmRestore.RestoreDevice(ipswBuf, udidBuf, 1)  // flags=1 = erase
            return { ok: rc === 0, code: rc }
        } catch (e) { console.warn('[3uToolsBridge] libidevicerestore DLL failed:', e.message) }
    }
    // CLI fallback
    try {
        await execP('idevicerestore', ['-e', '-d', ipswFile], { timeout: 1800000 })
        return { ok: true }
    } catch (err) {
        return { ok: false, error: err?.message }
    }
}

module.exports = {
    isAvailable: true,
    toolsDir: TOOLS_DIR,
    hasDllSupport: !!idmInfo,
    getConnectedDevices,
    getConnectedIOSDevices,
    scanDevice,
    translateScan,
    restoreIpsw,
    adbDevices,
    adbScanDevice,
}
