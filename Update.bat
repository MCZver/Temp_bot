@echo off
color 6
echo ...UPDATE...
curl.exe -F "image=@Temp_bot.ino.generic.bin" 192.168.50.18/update
