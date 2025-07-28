import { ExtensionContext } from 'vscode'

import * as fs from 'fs'
import * as path from 'path'

export interface Words {
  value: string
  key: string
  [key: string]: any
}

export interface Language {
  langType: string
  localeFileName: string
}

export const getWordWebviewHtml = (context: ExtensionContext) => {
  return fs.readFileSync(path.join(context.extensionPath, './out/html/word.html')).toString()
}

export const getLoadingHtml = (context: ExtensionContext) => {
  return fs.readFileSync(path.join(context.extensionPath, './out/html/loading.html')).toString()
}

export const getTranslateWebviewHtml = (context: ExtensionContext) => {
  return fs.readFileSync(path.join(context.extensionPath, './out/html/translate.html')).toString()
}

// Helper functions to send data to webview
export const sendDataToWebview = (webview: any, type: string, data: any) => {
  webview.postMessage({
    type: type,
    data: data,
  })
}

export const initializeWordWebview = (webview: any, words: Words[]) => {
  sendDataToWebview(webview, 'initialize', words)
}

export const initializeTranslateWebview = (webview: any, words: Words[], languages: Language[]) => {
  sendDataToWebview(webview, 'initialize', {
    words: words,
    languages: languages,
  })
}
