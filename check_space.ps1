Get-PSDrive C | Select-Object Free, Used
$userDirs = @(
    "C:\Users\shoae\Downloads",
    "C:\Users\shoae\AppData\Local\Temp",
    "C:\Users\shoae\AppData\Local\Docker",
    "C:\Users\shoae\.cache"
)

foreach ($dir in $userDirs) {
    if (Test-Path $dir) {
        $m = Get-ChildItem -Path $dir -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum
        $sizeGb = [math]::Round($m.Sum / 1GB, 2)
        Write-Host "$dir : $sizeGb GB ($($m.Count) files)"
    }
}
