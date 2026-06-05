Dim fso, dir, sh
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh  = CreateObject("WScript.Shell")
dir = fso.GetParentFolderName(WScript.ScriptFullName) & "\"
sh.Run "cmd.exe /c cd /d """ & dir & """ && node_modules\.bin\electron.cmd .""", 0, False