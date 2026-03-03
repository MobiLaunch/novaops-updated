; ─────────────────────────────────────────────────────────────────────────────
; NovaOps — Custom NSIS text & theme overrides
; electron-builder includes this AFTER it has already defined:
;   MUI_HEADERIMAGE, MUI_HEADERIMAGE_BITMAP, MUI_WELCOMEFINISHPAGE_BITMAP etc.
; So this file must ONLY define things electron-builder does NOT set itself.
; DO NOT: !include MUI2.nsh, !define MUI_HEADERIMAGE*, !insertmacro MUI_PAGE_*
; ─────────────────────────────────────────────────────────────────────────────

; ── Background color (dark theme) ────────────────────────────────────────────
; NSIS color format is RRGGBB
!define MUI_BGCOLOR                   "0D1117"

; ── Welcome page ─────────────────────────────────────────────────────────────
!define MUI_WELCOMEPAGE_TITLE         "Welcome to NovaOps"
!define MUI_WELCOMEPAGE_TEXT          "NovaOps is a modern repair shop management system.$\r$\n$\r$\nThis wizard will guide you through the installation.$\r$\n$\r$\nClick Next to continue."

; ── Finish page ──────────────────────────────────────────────────────────────
!define MUI_FINISHPAGE_TITLE          "NovaOps is Ready"
!define MUI_FINISHPAGE_TEXT           "Installation complete.$\r$\n$\r$\nNovaOps has been installed successfully.$\r$\nClick Finish to launch the app."
!define MUI_FINISHPAGE_RUN            "$INSTDIR\NovaOps.exe"
!define MUI_FINISHPAGE_RUN_TEXT       "Launch NovaOps now"

; ── Abort warning ────────────────────────────────────────────────────────────
!define MUI_ABORTWARNING
!define MUI_ABORTWARNING_TEXT         "Are you sure you want to cancel the NovaOps installation?"
