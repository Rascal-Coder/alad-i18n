import * as vscode from 'vscode'

export function vscodeWebviewPanel() {
  const panel = vscode.window.createWebviewPanel('alad-i18n', 'alad-i18n', vscode.ViewColumn.One, {
    enableScripts: true,
  })
}
