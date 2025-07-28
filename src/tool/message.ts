import * as vscode from 'vscode'
import { MessageType } from './enums'

export function message({ msg = '', type = MessageType.info }) {
  //向用户显示消息框
  vscode.window.showInformationMessage(`${type}：${msg}`)
}
