# MacroDev - Lanzador con icono en bandeja del sistema

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

# Arrancar el servidor Node en segundo plano
$nodeProcess = Start-Process -FilePath "node" `
    -ArgumentList "`"$DIR\server.js`"" `
    -WorkingDirectory $DIR `
    -WindowStyle Hidden `
    -PassThru

Start-Sleep -Milliseconds 1500

# Abrir el HTA de bienvenida
Start-Process -FilePath "$DIR\macrodev.hta"

# Crear icono en la bandeja
$trayIcon = New-Object System.Windows.Forms.NotifyIcon
$trayIcon.Icon    = [System.Drawing.SystemIcons]::Application
$trayIcon.Text    = "MacroDev - Activo en :4000"
$trayIcon.Visible = $true

# Globo de notificacion inicial
$trayIcon.ShowBalloonTip(
    3000,
    "MacroDev",
    "Servidor activo. Doble clic para abrir el panel.",
    [System.Windows.Forms.ToolTipIcon]::Info
)

# Menu contextual
$menu = New-Object System.Windows.Forms.ContextMenu

$itemAbrir = New-Object System.Windows.Forms.MenuItem
$itemAbrir.Text = "Abrir MacroDev"
$itemAbrir.add_Click({
    Start-Process -FilePath "$DIR\macrodev.hta"
})

$itemPanel = New-Object System.Windows.Forms.MenuItem
$itemPanel.Text = "Ir al Panel (navegador)"
$itemPanel.add_Click({
    Start-Process "http://localhost:4000/panel"
})

$itemSep = New-Object System.Windows.Forms.MenuItem
$itemSep.Text = "-"

$itemCerrar = New-Object System.Windows.Forms.MenuItem
$itemCerrar.Text = "Cerrar MacroDev"
$itemCerrar.add_Click({
    try { $nodeProcess.Kill() } catch {}
    cmd /c "FOR /F `"tokens=5`" %P IN ('netstat -a -n -o ^| findstr :4000') DO taskkill /F /PID %P" 2>$null
    $trayIcon.Visible = $false
    $trayIcon.Dispose()
    [System.Windows.Forms.Application]::Exit()
})

$menu.MenuItems.Add($itemAbrir)  | Out-Null
$menu.MenuItems.Add($itemPanel)  | Out-Null
$menu.MenuItems.Add($itemSep)    | Out-Null
$menu.MenuItems.Add($itemCerrar) | Out-Null
$trayIcon.ContextMenu = $menu

$trayIcon.add_DoubleClick({
    Start-Process -FilePath "$DIR\macrodev.hta"
})

# Mantener el proceso vivo
[System.Windows.Forms.Application]::Run()
