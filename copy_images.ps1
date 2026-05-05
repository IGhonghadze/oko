$src = "C:\Users\Пользователь\.gemini\antigravity\brain\323637b9-f6eb-4100-92dc-cbc7652decde"
$dst = "c:\Users\Пользователь\OneDrive\Desktop\Оконный завод\Коды\Oko\img"
New-Item -Path $dst -ItemType Directory -Force | Out-Null
@{
    "building_facade"  = "building_facade_1774684766163.png"
    "pvh_window"       = "pvh_window_1774684781989.png"
    "shower_glass"     = "shower_glass_1774684796101.png"
    "glass_railing"    = "glass_railing_1774684818518.png"
    "roller_shutter"   = "roller_shutter_1774684832851.png"
    "panoramic_glazing"= "panoramic_glazing_1774684850280.png"
    "pergola_terrace"  = "pergola_terrace_1774684876125.png"
    "entrance_doors"   = "entrance_doors_1774684893804.png"
    "aluminum_facade"  = "aluminum_facade_1774684910989.png"
}.GetEnumerator() | ForEach-Object {
    Copy-Item "$src\$($_.Value)" "$dst\$($_.Key).png" -Force
    Write-Host "Copied $($_.Key).png"
}
Write-Host "All done!"
