
$f = "f:\WanderViet_1\WanderViet_1\apps\user-web\payment.html"
$bytes = [System.IO.File]::ReadAllBytes($f)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

# Fix <title>
$bad1 = "C" + [char]0xE1 + [char]0xBB + [char]0x95 + "ng thanh to" + [char]0xC3 + [char]0xA1 + "n " + [char]0xE2 + [char]0x80 + [char]0x93 + " WanderVi" + [char]0xE1 + [char]0xBB + [char]0x87 + "t"
$good1 = "C" + [char]0x1ED5 + "ng thanh to" + [char]0xE1 + "n " + [char]0x2013 + " WanderVi" + [char]0x1EC7 + "t"
$content = $content.Replace($bad1, $good1)

# Fix line 373 - "Đang chuyển về trang chuyến đi của bạn..."
$bad2 = [char]0xC3 + [char]0x84 + "ang chuy" + [char]0xE1 + [char]0xBB + [char]0x83 + "n v" + [char]0xE1 + [char]0xBB + " trang chuy" + [char]0xE1 + [char]0xBA + [char]0xBF + "n " + [char]0xC3 + [char]0x84 + "'i c" + [char]0xE1 + [char]0xBB + [char]0xA7 + "a b" + [char]0xE1 + [char]0xBA + [char]0xA1 + "n..."
$good2 = [char]0x0110 + "ang chuy" + [char]0x1EC3 + "n v" + [char]0x1EC1 + " trang chuy" + [char]0x1EBF + "n " + [char]0x0111 + "i c" + [char]0x1EE7 + "a b" + [char]0x1EA1 + "n..."
$content = $content.Replace($bad2, $good2)

# Fix line 382 - "Đơn hàng:"  
$bad3 = [char]0xC3 + [char]0x84 + [char]0xC3 + [char]0x86 + [char]0xC2 + [char]0xA1 + "n h" + [char]0xC3 + " ng:"
$good3 = [char]0x0110 + [char]0x01A1 + "n h" + [char]0xE0 + "ng:"
$content = $content.Replace($bad3, $good3)

# Fix ACB bullet  ●
$bad4 = "ACB<span>" + [char]0xE2 + [char]0x80 + [char]0x94 + " </span>"
$good4 = "ACB<span>&#9679;</span>"
$content = $content.Replace($bad4, $good4)

# Fix submit button - "XÁC NHẬN THANH TOÁN"
$bad5 = "X" + [char]0xC3 + [char]0x83 + "C NH" + [char]0xE1 + [char]0xBA + [char]0xAC + "N THANH TO" + [char]0xC3 + [char]0x83 + "N"
$good5 = "X" + [char]0xC1 + "C NH" + [char]0x1EAC + "N THANH TO" + [char]0xC1 + "N"
$content = $content.Replace($bad5, $good5)

# Fix cancel button - "Hủy bỏ giao dịch"
$bad6 = "H" + [char]0xE1 + [char]0xBB + [char]0xA7 + "y b" + [char]0xE1 + [char]0xBB + " giao d" + [char]0xE1 + [char]0xBB + [char]0x9B + "ch"
$good6 = "H" + [char]0x1EE7 + "y b" + [char]0x1ECF + " giao d" + [char]0x1ECB + "ch"
$content = $content.Replace($bad6, $good6)

[System.IO.File]::WriteAllText($f, $content, (New-Object System.Text.UTF8Encoding $false))
Write-Host "Replacements done"
