# drivers/

Drop tool binaries directly into this folder. They are automatically resolved at runtime — no subfolders needed.

## Windows binaries to place here

| File | Purpose |
|------|---------|
| `adb.exe` | Android Debug Bridge — Android device detection |
| `idevice_id.exe` | iOS device listing |
| `ideviceinfo.exe` | iOS device diagnostics |
| `idevicebackup2.exe` | iOS backup / restore |
| `idevicediagnostics.exe` | iOS diagnostic tests |
| `idevicecrashreport.exe` | iOS crash report extraction |
| `idevicesyslog.exe` | iOS syslog streaming |

This folder is intentionally empty in the repo (.gitkeep only).
electron-builder copies it to `resources/drivers/` in the packaged app.
