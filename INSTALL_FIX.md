# Install Fix Notes

## If you still get a node-gyp / @parcel/watcher error

The `overrides` + `optionalDependencies` in `package.json` tell npm to use
prebuilt binaries for `@parcel/watcher` instead of compiling from source.

**Delete your existing `node_modules` and `package-lock.json` before reinstalling:**

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### If it still fails (Python distutils missing)

You're on Python 3.12+ which removed `distutils`. Fix with either:

**Option A — Install setuptools (recommended):**
```powershell
pip install setuptools
npm install
```

**Option B — Use Node 18 LTS** (ships with a bundled gyp that doesn't need distutils):
Use [nvm-windows](https://github.com/coreybutler/nvm-windows) to switch Node versions:
```powershell
nvm install 18
nvm use 18
npm install
```
