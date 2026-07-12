; Adds the VisualnsCode install directory to the system PATH
; so `spxcode` works from cmd.exe, PowerShell, and Windows Terminal.
!macro customInstall
  ${EnvVarUpdate} $0 "PATH" "A" "HKLM" "$INSTDIR"
!macroend

!macro customUnInstall
  ${un.EnvVarUpdate} $0 "PATH" "R" "HKLM" "$INSTDIR"
!macroend
