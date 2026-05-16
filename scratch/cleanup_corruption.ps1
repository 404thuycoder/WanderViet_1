
$path = "f:\WanderViet_1\WanderViet_1\apps\user-web\place-detail.html"
$content = Get-Content $path
$n1 = 2679
$n2 = 2784

# Restore the end of the load function
$restoreCode = @(
    "            } catch (err) {",
    "                console.error('Load error:', err);",
    "            }",
    "        }"
)

$newContent = $content[0..($n1 - 2)] + $restoreCode + $content[($n2 - 1)..($content.Count - 1)]
[System.IO.File]::WriteAllLines($path, $newContent, [System.Text.Encoding]::UTF8)
Write-Output "Successfully cleaned up corruption."
