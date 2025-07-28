//模块“vscode”包含VS Code可扩展性API
//导入模块并在下面的代码中使用别名vscode引用它
import * as vscode from 'vscode'
import { CommandsEnum, MessageType } from './tool/enums'

import { analysis } from './analysis'
import { message } from './tool/message'
import { depositEntry, unifiedFileMergeData, loadExistingTranslations } from './store/out-file'
import { testRootPath } from './tool/testing'
import { handlerFileUrl } from './tool/file'
import { setGlobalContext } from './store/global-status'
import { checkConfig } from './config'

//当您的扩展被激活时，会调用此方法
//您的扩展在第一次执行命令时就被激活了
export function activate(context: vscode.ExtensionContext) {
  setGlobalContext(context)
  //使用控制台输出诊断信息（console.log）和错误（console.error）
  //当您的扩展被激活时，这行代码将只执行一次

  //该命令需要已在package.json文件中定义
  //现在用registerCommand提供该命令的实现
  //commandId参数必须与package.json中的命令字段匹配
  const disposable = vscode.commands.registerCommand(CommandsEnum.Translate, async (uri) => {
    try {
      // 必要前置检测
      testRootPath()

      const path = uri.fsPath
      if (!path) {
        message({ msg: '没有文件路径,无法进行提取', type: MessageType.error })
        return false
      }
      if (!checkConfig()) {
        return
      }
      // 文件地址预处理
      handlerFileUrl(path)
      // 统一模式下的处理，预先判断是否已有词条库进行合并,内部已经判断模式执行
      await unifiedFileMergeData()
      // 读取已有的多语言翻译文件来初始化词条库
      await loadExistingTranslations()
      // 进行文件处理
      await analysis(path)
      // 提取的词条输出
      await depositEntry()
    } catch (e: any) {
      message({ msg: e, type: MessageType.error })
    }
  })

  context.subscriptions.push(disposable)
}
