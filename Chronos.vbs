Option Explicit

Dim WshShell, objFSO, strAppDir, strBatPath

Set WshShell = CreateObject("WScript.Shell")
Set objFSO   = CreateObject("Scripting.FileSystemObject")

strAppDir  = objFSO.GetParentFolderName(WScript.ScriptFullName)
strBatPath = strAppDir & "\start-app.bat"

If objFSO.FileExists(strBatPath) Then
    ' start-app.bat を完全非表示(0)で実行
    WshShell.Run """" & strBatPath & """", 0, False
Else
    MsgBox "start-app.bat not found.", vbCritical, "Chronos Error"
End If

Set WshShell = Nothing
Set objFSO   = Nothing
