
$path = "f:\WanderViet_1\WanderViet_1\apps\user-web\place-detail.html"
$code = [System.IO.File]::ReadAllText("f:\WanderViet_1\WanderViet_1\scratch\map_logic.js")
$content = Get-Content $path
$n1 = 3204
$n2 = 3440

$newContent = $content[0..($n1 - 2)] + $code + $content[$n2..($content.Count - 1)]
[System.IO.File]::WriteAllLines($path, $newContent, [System.Text.Encoding]::UTF8)
Write-Output "Successfully upgraded to Ultimate Pro Edition."
