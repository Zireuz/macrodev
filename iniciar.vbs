Dim fso, carpeta, WshShell

Set fso     = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")

' Carpeta donde está este .vbs (misma que server.js)
carpeta = fso.GetParentFolderName(WScript.ScriptFullName)

' Arrancar el servidor en segundo plano (0 = ventana oculta)
WshShell.Run "cmd.exe /c node """ & carpeta & "\server.js""", 0, False

' Esperar 1.5s para que el servidor levante
WScript.Sleep 1500

' Abrir la página de bienvenida en el navegador predeterminado
WshShell.Run "http://localhost:4000"
