Dim fso, carpeta, sh
Set fso  = CreateObject("Scripting.FileSystemObject")
Set sh   = CreateObject("WScript.Shell")
carpeta  = fso.GetParentFolderName(WScript.ScriptFullName) & "\"
' 0 = SW_HIDE: ventana completamente oculta, sin parpadeos
sh.Run "powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File """ & carpeta & "iniciar.ps1""", 0, False
