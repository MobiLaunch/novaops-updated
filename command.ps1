# Run from the project root (C:\Users\FrontDesk\Downloads\novaops-updated-main)
Get-ChildItem -Recurse -Path .\src -File |
  Select-String -Pattern '\b\$\b' -SimpleMatch |
  ForEach-Object {
    "{0}:{1} -> {2}" -f $_.Path, $_.LineNumber, $_.Line.Trim()
  }
