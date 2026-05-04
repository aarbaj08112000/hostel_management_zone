Get-ChildItem -Path . -Recurse -Stream "Zone.Identifier" -ErrorAction SilentlyContinue | Remove-Item
Get-ChildItem -Path . -Recurse -Filter "*Zone.Identifier" -ErrorAction SilentlyContinue | Remove-Item
