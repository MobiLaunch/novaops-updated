# Search only the plugin directories (adjust if you also have app/plugins)
Get-ChildItem -Recurse -Path .\plugins -File |
  Select-String -Pattern '\$\b' -SimpleMatch |
  ForEach-Object {
    "{0}:{1} -> {2}" -f $_.Path, $_.LineNumber, $_.Line.Trim()
  }

# If you use app/plugins, run the same against that folder:
Get-ChildItem -Recurse -Path .\app\plugins -File |
  Select-String -Pattern '\$\b' -SimpleMatch |
  ForEach-Object {
    "{0}:{1} -> {2}" -f $_.Path, $_.LineNumber, $_.Line.Trim()
  }
