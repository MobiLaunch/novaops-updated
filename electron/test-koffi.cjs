const koffi = require('koffi')
const path = require('path')

try {
    const dllPath = path.resolve('itunes-files', 'itunesFlashDll', 'MobileDevice.dll')
    const lib = koffi.load(dllPath)

    // Opaque pointers
    const CFStringRef = koffi.pointer('CFStringRef', koffi.opaque())
    const AMDeviceRef = koffi.pointer('AMDeviceRef', koffi.opaque())

    // Struct definitions
    const AMDeviceNotificationCallbackInfo = koffi.struct('AMDeviceNotificationCallbackInfo', {
        dev: AMDeviceRef,
        msg: 'uint32'
    })

    // Callback signature
    const AMDeviceNotificationCallback = koffi.proto('void AMDeviceNotificationCallback(AMDeviceNotificationCallbackInfo *info, void *user_info)')

    // Functions
    const AMDeviceNotificationSubscribe = lib.func('AMDeviceNotificationSubscribe', 'int', [
        koffi.pointer(AMDeviceNotificationCallback),
        'uint32', 'uint32', 'void*', koffi.pointer('void*')
    ])
    const AMDeviceCopyDeviceIdentifier = lib.func('AMDeviceCopyDeviceIdentifier', CFStringRef, [AMDeviceRef])

    // CoreFoundation strings
    const cfDllPath = path.resolve('itunes-files', 'itunesFlashDll', 'CoreFoundation.dll')
    const cfLib = koffi.load(cfDllPath)
    const CFStringGetCStringPtr = cfLib.func('CFStringGetCStringPtr', 'const char*', [CFStringRef, 'uint32'])

    // kCFStringEncodingUTF8 = 0x08000100
    const kCFStringEncodingUTF8 = 0x08000100

    function readCFString(cfStr) {
        if (!cfStr) return null;
        const ptr = CFStringGetCStringPtr(cfStr, kCFStringEncodingUTF8);
        if (!ptr) return null;
        return ptr;
    }

    let foundUdid = null;

    const cb = koffi.register((infoPtr, userInfo) => {
        // We cannot pass structs by value directly as pointers without decoding the struct.
        // koffi passes the struct pointer. Let's decode it:
        const info = koffi.decode(infoPtr, AMDeviceNotificationCallbackInfo);
        if (info.msg === 1 || info.msg === 2 || info.msg === 3) {
            console.log('Device Notification Msg:', info.msg);
            if (info.msg === 1 || info.msg === 3) {
                const cfUdid = AMDeviceCopyDeviceIdentifier(info.dev);
                const udidStr = readCFString(cfUdid);
                console.log('UDID:', udidStr);
                foundUdid = udidStr;
            }
        }
    }, koffi.pointer(AMDeviceNotificationCallback))

    const subOut = Buffer.alloc(8)
    const res = AMDeviceNotificationSubscribe(cb, 0, 0, null, subOut)
    console.log('Subscribe result:', res)

    setTimeout(() => {
        console.log('Finished listening. UDID was:', foundUdid)
        process.exit(0)
    }, 2000)

} catch (e) {
    console.error(e)
}
