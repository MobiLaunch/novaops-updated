# itunes-files/

This folder holds the iTunes / MobileDevice DLLs used for iOS device communication.

> ⚠️ This folder was previously named `itunes files` (with a space).
> It has been renamed to `itunes-files` (hyphen) to fix the node-gyp build error:
> "Attempting to build a module with a space in the path"

## Expected structure

```
itunes-files/
  itunesFlashDll/
    MobileDevice.dll       ← required for iOS plug/unplug events (koffi)
    CoreFoundation.dll     ← required alongside MobileDevice.dll
    iTunesFlash.exe        ← optional iTunes flash utility
    idm_info.dll           ← optional 3uTools device info bridge
    libplist2.dll          ← optional Apple plist parsing
```

## Where to get the DLLs

Copy them from an existing iTunes installation:
- `C:\Program Files\iTunes\`
- `C:\Program Files\Common Files\Apple\Apple Application Support\`

These DLLs are **not** included in the repo for licensing reasons.
The app runs without them — iOS detection will fall back to CLI tools (`idevice_id.exe` etc.) placed in `drivers/`.

electron-builder packages this folder to `resources/itunes-tools/` in the final .exe.
