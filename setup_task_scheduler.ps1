Unregister-ScheduledTask -TaskName "PRAXIS Agent Loop" -Confirm:$false -ErrorAction SilentlyContinue

$action = New-ScheduledTaskAction -Execute "C:\projetos\praxis\start.bat"

$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Hours 8) `
    -MultipleInstances IgnoreNew

$principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType Interactive `
    -RunLevel Highest

Register-ScheduledTask `
    -TaskName "PRAXIS Agent Loop" `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description "PRAXIS Dispatcher v5" `
    -Force

Get-ScheduledTask -TaskName "PRAXIS Agent Loop" | Format-List TaskName, State, Description
Write-Host "Pronto!" -ForegroundColor Green
