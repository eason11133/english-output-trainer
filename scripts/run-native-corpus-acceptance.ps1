param([string]$Serial='')
$ErrorActionPreference='Stop'
$package='com.easonsystems.englishoutputtrainer';$db='eot-corpus-20260827.sqlite';$expectedHash='3b24f4c5c51ae7085adf2729534755fdb724c3ad4c093531c3ea43eccee18447';$expectedBytes=354385920;$marker='EOT_NATIVE_CORPUS_ACCEPTANCE'
$adb=(Get-Command adb -ErrorAction Stop).Source;$adbArgs=@();if($Serial){$adbArgs=@('-s',$Serial)}
function A([Parameter(ValueFromRemainingArguments=$true)][string[]]$Arguments){& $adb @adbArgs @Arguments;if($LASTEXITCODE -ne 0){throw "adb failed: $Arguments"}}
function Read-Marker([int]$timeoutSeconds=240){$deadline=(Get-Date).AddSeconds($timeoutSeconds);do{$text=(& $adb @adbArgs logcat -d -v brief 2>&1|Out-String);$line=($text-split"`r?`n"|Where-Object{$_-like"*$marker*"}|Select-Object -Last 1);if($line){return $line};Start-Sleep -Seconds 2}while((Get-Date)-lt$deadline);throw"Timed out waiting for $marker"}
$device=(A get-state|Out-String).Trim();if($device -ne 'device'){throw'Android device is not authorized/online'}
$installed=(& $adb @adbArgs shell pm path $package 2>&1|Out-String);if($installed -notmatch 'package:'){throw"Install an EOT SDK 57 development build first: npx expo run:android --device"}
$logDir=Join-Path $PSScriptRoot '..\artifacts\native-acceptance';New-Item -ItemType Directory -Force -Path $logDir|Out-Null;$stamp=Get-Date -Format'yyyyMMdd-HHmmss';$logPath=Join-Path $logDir "android-$stamp.log"
$expo=Start-Process -FilePath'npx.cmd'-ArgumentList @('expo','start','--dev-client','--lan','--clear') -WorkingDirectory(Join-Path $PSScriptRoot '..') -WindowStyle Hidden -PassThru
try{
  Start-Sleep -Seconds 15;A logcat -c;A shell pm clear $package;A shell am start -W -a android.intent.action.VIEW -d 'englishoutputtrainer://__dev__/native-corpus-acceptance';$first=Read-Marker
  $bytes=((& $adb @adbArgs shell run-as $package stat -c '%s' "databases/$db" 2>&1|Out-String).Trim());$hashLine=((& $adb @adbArgs shell run-as $package sha256sum "databases/$db" 2>&1|Out-String).Trim());$hash=($hashLine-split'\s+')[0].ToLowerInvariant()
  A logcat -c;A shell am force-stop $package;A shell am start -W -a android.intent.action.VIEW -d 'englishoutputtrainer://__dev__/native-corpus-acceptance';$second=Read-Marker
  $firstPass=$first -match '"status":"PASS"' -and $first -match '"reused":false';$secondPass=$second -match '"status":"PASS"' -and $second -match '"reused":true';$filePass=([int64]$bytes -eq $expectedBytes) -and ($hash -eq $expectedHash);$status=if($firstPass -and $secondPass -and $filePass){'PASS'}else{'FAIL'}
  $lines=@("NATIVE_CORPUS_ANDROID_ACCEPTANCE=$status","DEVICE_SERIAL=$((& $adb @adbArgs get-serialno|Out-String).Trim())","COPIED_BYTES=$bytes EXPECTED=$expectedBytes","SHA256=$hash EXPECTED=$expectedHash","FIRST_RUN=$first","SECOND_RUN=$second");$lines|Set-Content -Encoding UTF8 $logPath;$lines|ForEach-Object{Write-Output $_};Write-Output"DURABLE_LOG=$((Resolve-Path $logPath).Path)";if($status-ne'PASS'){exit 1}
}finally{if($expo -and -not $expo.HasExited){Stop-Process -Id $expo.Id -Force}}
