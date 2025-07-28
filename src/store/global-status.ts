import { FileType } from './types'
import * as vscode from 'vscode'
import { ESLint } from 'eslint'
// import { Words } from '../html'
export const globalStatus = {
  fileType: FileType.vue as FileType,
  currentFileName: 'lang',
  context: {} as vscode.ExtensionContext,
  eslintResults: [] as ESLint.LintResult[],
}

export function setFileType(fileType: FileType) {
  globalStatus.fileType = fileType
}
// 设置当前文件名称
export function setCurrentFileName(name: string) {
  globalStatus.currentFileName = name
}

export function setGlobalContext(context: vscode.ExtensionContext) {
  globalStatus.context = context
}

export function setEslintResults(results: ESLint.LintResult[]) {
  globalStatus.eslintResults = results
}
