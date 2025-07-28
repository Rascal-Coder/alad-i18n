import * as fs from 'fs/promises'
import { FileContent } from '../types/file'
import { resolve } from 'path'
import { access, mkdir } from 'fs/promises'
import * as vscode from 'vscode'
import { setCurrentFileName, setFileType } from '../store/global-status'
import { FileType } from '../store/types'
// 读取文件内容
export async function readFile(url: string) {
  const fileBuffer = await fs.readFile(url)
  return {
    strFile: fileBuffer.toString(),
    fileBuffer,
  }
}

// 写入文件
// writeUrl 注意是是否需要增加斜杠和fileName组成完整的地址链路
export async function writeFile(writeUrl: string, fileName: string, fileContent: FileContent) {
  await fs.writeFile(writeUrl + fileName, fileContent)
}

// 获取根目录
export function rootPath() {
  return resolve('.')
}
// 获取vscode项目路径
export function getVsCodeProjectPath(): string {
  const workName = vscode.workspace.name
  const workspaceFolders = vscode.workspace.workspaceFolders ?? []
  return workspaceFolders.find((li) => li.name === workName)?.uri.fsPath as string
}

// 检测并创建目录
export async function createFile(path: string) {
  try {
    await access(path)
    return Promise.resolve(true)
  } catch (e) {
    await mkdir(path)
    return Promise.resolve(true)
  }
}

// 处理文件得到文件地址
export function handlerFileUrl(url: string) {
  // 获取文件后缀名
  const fileSuffixName = url.split('.').reverse()[0]
  const fileName = url.split('\\').reverse()[0]
  setFileType(fileSuffixName as FileType) // 获取文件后缀
  setCurrentFileName(fileName) // 文件名称
}

export async function isAccess(url: string, mode?: number) {
  try {
    if (mode) await access(url, mode)
    else await access(url)
    return true
  } catch (e) {
    return false
  }
}
