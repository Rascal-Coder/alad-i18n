import { getWordBar, mergeWordBar } from './term-bank'
import { createFile, getVsCodeProjectPath, isAccess, writeFile } from '../tool/file'
import { getConfig } from '../config'
import { globalStatus } from './global-status'
import { join } from 'path'
import { message } from '../tool/message'
import { MessageType } from '../tool/enums'
import * as vscode from 'vscode'
import {
  getLoadingHtml,
  getTranslateWebviewHtml,
  getWordWebviewHtml,
  initializeWordWebview,
  initializeTranslateWebview,
  Language,
  Words,
} from '../html'
import * as fs from 'fs'
import { supportLangTypes } from '../languages'
import path = require('path')
import { sleep, translates } from '../utils/utils'
import { ESLint } from 'eslint'
// import { FileType } from './types'

// 针对词条库合并路径处理
export function mergeEntryPath() {
  const config = getConfig()
  let fileOut = ''
  // 有i18n目录清空
  if (config.i18nLang) {
    fileOut = join(getVsCodeProjectPath(), config.i18nLang + '/')
  } else {
    // 不输出到i1n8目录中
    fileOut = join(getVsCodeProjectPath(), '/' + config.outFile + '/')
  }
  // 需要读取的json数据
  const importDataUrl = fileOut + config.unifiedFileName + '.json'
  // const oldEntry = require(importDataUrl) ?? {}
  return {
    fileOut, // 文件路径
    importDataUrl, // 文件合并路径
  }
}

class WordsManager {
  private words: Words[] = []
  private translateWords: Words[] = []
  private webviewPanel: vscode.WebviewPanel | undefined
  private titleChangeTimer: NodeJS.Timeout | undefined
  private readonly currentTextDocumentFileUri = vscode.window.activeTextEditor?.document.uri
  private readonly projectRootPath = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath
  private readonly DEFAULT_LANG_TYPE = 'zh'
  private previousActiveEditor: vscode.TextEditor | undefined

  // 清理文本：去除换行符、多余空格、制表符等
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // 将多个空白字符替换为单个空格
      .trim() // 去除首尾空格
  }

  // 改为getter方法，每次使用时动态获取最新配置
  private get languages() {
    return this.getLanguages()
  }

  constructor() {
    // 初始化words数组
    this.words = []
  }

  private getLanguages() {
    const languages = getConfig().languages as Array<string>
    const localesPerfix = getConfig().localesPerfix
    if (!languages.length) {
      return []
    }

    const res = languages
      .map((lang) => {
        let [langType, localeFileName] = lang.split(':')
        if (!supportLangTypes.includes(langType)) {
          message({
            msg: `你配置的语言类型{${langType}}不在百度翻译支持的语言类型内，请检查是否输入错误。`,
            type: MessageType.error,
          })
          throw new Error()
        }

        // 兼容文件名和key同名的情况
        if (!localeFileName) {
          localeFileName = langType
        }

        if (localesPerfix) {
          localeFileName = `${localeFileName}/${localesPerfix}`
        }
        return {
          langType,
          localeFileName,
        }
      })
      .filter((o) => !!o)

    return res
  }

  public openWordsPage() {
    // 保存当前激活的编辑器，以便在关闭 webview 时重新激活
    this.previousActiveEditor = vscode.window.activeTextEditor

    const columnToShowIn = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : vscode.ViewColumn.Active

    if (!this.webviewPanel) {
      this.webviewPanel = vscode.window.createWebviewPanel(
        'translate',
        '词条',
        columnToShowIn || vscode.ViewColumn.Active,
        {
          retainContextWhenHidden: true,
          enableScripts: true,
        },
      )
    } else {
      this.webviewPanel.reveal(columnToShowIn)
    }

    this.webviewPanel.onDidDispose(() => {
      this.webviewPanel = undefined
      // 重新激活之前的编辑器
      if (this.previousActiveEditor && !this.previousActiveEditor.document.isClosed) {
        vscode.window.showTextDocument(
          this.previousActiveEditor.document,
          this.previousActiveEditor.viewColumn,
        )
      }
      this.previousActiveEditor = undefined
    })

    this.webviewPanel.webview.html = getWordWebviewHtml(globalStatus.context)
    // 获取当前页面的词条
    const currentPageWords = this.getCurrentPageWords()
    initializeWordWebview(this.webviewPanel.webview, currentPageWords)

    this.webviewPanel.webview.onDidReceiveMessage((e) => this.didReceiveMessageHandle(e))
  }

  private didReceiveMessageHandle(e: { type: string; data: any }) {
    const { type, data } = e
    // console.log('e', e)

    // console.log('data', data)

    const methodMap: { [k: string]: Function } = {
      translate: () => {
        // 确保传入的数据是数组
        if (Array.isArray(data) && data.length > 0) {
          this.translate(data)
        } else {
          message({ msg: '没有可翻译的数据', type: MessageType.error })
        }
      },
      delete: () => {
        // 删除词条
        if (data && data.key) {
          this.deleteWord(data.key)
        }
      },
      save: async () => {
        await vscode.window.showTextDocument(this.currentTextDocumentFileUri!)
        saveToLocalFile(data as Words[], this)
        // 先插入导入语句，再应用ESLint修复，避免行号错位
        await ESLint.outputFixes(globalStatus.eslintResults)
        this.webviewPanel?.dispose()
      },
    }

    if (methodMap[type]) {
      methodMap[type]()
    }
  }
  private async translate(data: Words[]) {
    if (this.webviewPanel && this.currentTextDocumentFileUri) {
      if (!fs.existsSync(this.currentTextDocumentFileUri.fsPath)) {
        message({ msg: '文件已被删除', type: MessageType.error })
        return
      }

      let index = 1

      this.titleChangeTimer = globalThis.setInterval(() => {
        if (this.webviewPanel) {
          this.webviewPanel.title = `翻译中${'.'.repeat(index)}`
        } else {
          globalThis.clearInterval(this.titleChangeTimer)
        }
        index += 1
        if (index === 4) {
          index = 1
        }
      }, 500)

      this.webviewPanel.title = '翻译中'
      this.webviewPanel.webview.html = getLoadingHtml(globalStatus.context)

      if (!this.projectRootPath) {
        return
      }

      const defalutLanguage = this.languages.find((o) => o.langType === this.DEFAULT_LANG_TYPE)
      console.log('defalutLanguage', defalutLanguage)

      if (!defalutLanguage) {
        return
      }

      this.translateWords = await this.getTranslateResult(defalutLanguage, data)

      if (!this.translateWords.length) {
        if (this.titleChangeTimer) {
          globalThis.clearInterval(this.titleChangeTimer)
        }

        if (this.webviewPanel) {
          // 退到中文列表页面
          this.webviewPanel.title = '中文列表'
          this.webviewPanel.webview.html = getWordWebviewHtml(globalStatus.context)
          initializeWordWebview(this.webviewPanel.webview, this.words)
        }
        return
      }

      if (this.titleChangeTimer) {
        globalThis.clearInterval(this.titleChangeTimer)
      }

      this.webviewPanel.title = '翻译'
      this.webviewPanel.webview.html = getTranslateWebviewHtml(globalStatus.context)
      initializeTranslateWebview(this.webviewPanel.webview, this.translateWords, this.languages)
    }
  }

  private async getTranslateResult(defalutLanguage: Language, data: Words[]): Promise<Words[]> {
    // 确保data是数组
    if (!Array.isArray(data)) {
      console.error('getTranslateResult: data is not an array', data)
      return []
    }

    const defaultWords = this.getLocalWordsByFileName(defalutLanguage.localeFileName, true)

    data.forEach((item: any) => {
      if (defaultWords[item.value]) {
        item.key = defaultWords[item.value]
        item[this.DEFAULT_LANG_TYPE] = {
          exists: true,
          value: item.value,
        }
      } else {
        // item.key = `${item.key.slice(0, 4)}${item.key.slice(-4)}`
        item[this.DEFAULT_LANG_TYPE] = {
          exists: false,
          value: item.value,
        }
      }
    })

    const toTranslateLanguages = this.languages.filter(
      (lang) => lang.langType !== this.DEFAULT_LANG_TYPE,
    )

    for (let i = 0; i < toTranslateLanguages.length; i += 1) {
      const lang = toTranslateLanguages[i]

      const words = this.getLocalWordsByFileName(lang.localeFileName, false)
      const toTranslateWords = data
        .filter((item: any) => !words[item.key])
        .map((item: any) => this.cleanText(item.value))

      let transResult: any = {}

      if (toTranslateWords.length) {
        try {
          transResult = await translates(toTranslateWords, lang.langType)
        } catch {
          return []
        }
        if (i !== toTranslateLanguages.length - 1) {
          await sleep(1000)
        }
      }

      data.forEach((item: Words) => {
        const value = words[item.key!]
        // 清理文本以匹配翻译结果的键
        const cleanedValue = this.cleanText(item.value)
        item[lang.langType] = {
          exists: !!value,
          value: value || transResult[cleanedValue],
        }
      })
    }
    return data
  }

  private getLocalWordsByFileName = (fileName: string, defaultLang: boolean) => {
    const words: any = {}
    if (!this.projectRootPath) return words
    const localesFullPath = path.join(this.projectRootPath, getConfig().localesPath)
    const filePath = path.join(localesFullPath, `./${fileName}.json`)

    if (!fs.existsSync(filePath)) {
      return words
    }

    const fileContent = fs.readFileSync(filePath).toString()

    try {
      const json = JSON.parse(fileContent)
      if (defaultLang) {
        // 对于默认语言，键值对调（value -> key）
        Object.entries(json).forEach(([key, value]) => {
          words[value as string] = key
        })
      } else {
        // 对于其他语言，直接复制（key -> value）
        Object.assign(words, json)
      }
    } catch (error) {
      console.error('JSON parse error for file:', filePath, error)
      message({
        msg: `解析 JSON 文件 ${filePath} 时出错，请检查文件格式是否正确。`,
        type: MessageType.error,
      })
    }
    return words
  }

  public addWords(newWords: Words[]) {
    this.words = [...this.words, ...newWords]
  }

  public setWords(words: Words[]) {
    this.words = words
  }

  public getWords(): Words[] {
    return this.words
  }

  // 获取当前页面的词条
  private getCurrentPageWords(): Words[] {
    const currentFile = vscode.window.activeTextEditor?.document.uri.fsPath
    if (!currentFile) {
      return this.words // 如果无法获取当前文件，返回所有词条
    }

    // 从 WordBar 中获取与当前文件相关的词条
    const { WordBar } = getWordBar()
    const currentPageWords = WordBar.filter(
      (item) => item.sourceFiles && item.sourceFiles.includes(currentFile),
    ).map((item) => ({
      key: item.key,
      value: item.text,
    })) as Words[]

    return currentPageWords
  }

  // 删除词条
  private deleteWord(key: string) {
    const { WordBar, WordBarJson } = getWordBar()

    // 从WordBar中删除
    const index = WordBar.findIndex((item) => item.key === key)
    if (index !== -1) {
      WordBar.splice(index, 1)
    }

    // 从WordBarJson中删除
    delete WordBarJson[key]

    // 刷新webview显示当前页面的词条
    if (this.webviewPanel) {
      const currentPageWords = this.getCurrentPageWords()
      initializeWordWebview(this.webviewPanel.webview, currentPageWords)
    }
  }
}

// 创建全局实例
const wordsManager = new WordsManager()

// 将词条存入到文件当中
export async function depositEntry() {
  if (!getWordBar().WordBar.length) {
    return message({ msg: '没有可以提取的文字内容', type: MessageType.error })
  }
  // d:\G\zl-project\nbs-pc
  const config = getConfig()
  if (config.outExtractFile) {
    if (config.fileOutMode === 'file') {
      // 输出的文件目录
      const createPath = join(getVsCodeProjectPath(), '/' + config.outFile + '/')
      await createFile(createPath)
      await writeFile(
        createPath,
        globalStatus.currentFileName + '.json',
        JSON.stringify(getWordBar().WordBarJson, null, '\t'),
      )
    }
    if (config.fileOutMode === 'unified') {
      const { fileOut } = mergeEntryPath()
      // 检测并创建目录
      if (!config.i18nLang) await createFile(fileOut)

      await writeFile(
        fileOut,
        config.unifiedFileName + '.json',
        JSON.stringify(getWordBar().WordBarJson, null, '\t'),
      )
    }
    message({ msg: `提取${globalStatus.currentFileName}成功`, type: MessageType.success })
  } else {
    // 转换数据格式并设置到wordsManager中
    const words: Words[] = []
    for (const key in getWordBar().WordBarJson) {
      words.push({ key, value: getWordBar().WordBarJson[key] })
    }
    wordsManager.setWords(words)
    wordsManager.openWordsPage()
    message({ msg: `提取${globalStatus.currentFileName}成功`, type: MessageType.success })
  }

  console.log('提取成功')
}

// 在unified模式下判断创建目录或文件
export async function unifiedFileMergeData() {
  if (getConfig().fileOutMode !== 'unified') return null
  const { importDataUrl } = mergeEntryPath()
  const isFile = await isAccess(importDataUrl)
  if (isFile) {
    // 如果存在数据文件则需要进行合并词条库
    delete require.cache[importDataUrl]
    const data = require(importDataUrl)
    mergeWordBar(data)
  }
}

// 导出函数供外部使用
export function openWordsPage() {
  wordsManager.openWordsPage()
}

// 读取已有的翻译文件来初始化词条库
export async function loadExistingTranslations() {
  const config = getConfig()
  if (!config.localesPath) return

  const projectRootPath = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath
  if (!projectRootPath) return

  const localesFullPath = path.join(projectRootPath, config.localesPath)
  if (!fs.existsSync(localesFullPath)) return

  // 找到默认语言文件（中文）
  const languages = config.languages as Array<string>
  const defaultLang = languages.find((lang) => lang.startsWith('zh')) || languages[0]
  if (!defaultLang) return

  const [langType, localeFileName] = defaultLang.split(':')
  const fileName = localeFileName || langType

  let finalFileName = fileName
  if (config.localesPerfix) {
    finalFileName = `${fileName}/${config.localesPerfix}`
  }

  const filePath = path.join(localesFullPath, `./${finalFileName}.json`)
  if (!fs.existsSync(filePath)) return

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const existingTranslations = JSON.parse(fileContent)
    console.log('existingTranslations', existingTranslations)

    if (Object.keys(existingTranslations).length > 0) {
      console.log('加载已有翻译文件:', filePath)
      console.log('加载词条数量:', Object.keys(existingTranslations).length)
      // 直接合并已有翻译到词条库，保持原有的 key -> value 格式
      mergeWordBar(existingTranslations)
    }
  } catch (error) {
    console.error('读取翻译文件失败:', filePath, error)
  }
}

const saveToLocalFile = (data: Words[], instance: WordsManager) => {
  if (!instance['currentTextDocumentFileUri']) {
    return
  }

  if (!fs.existsSync(instance['currentTextDocumentFileUri'].fsPath)) {
    message({
      type: MessageType.error,
      msg: '文件已被删除',
    })
    return
  }

  if (!instance['projectRootPath']) {
    return
  }

  // 计算 locales 完整路径
  const localesFullPath = path.join(instance['projectRootPath'], getConfig().localesPath)
  instance['languages'].forEach((lang: Language) => {
    const fullFilePath = path.join(localesFullPath, `./${lang.localeFileName}.json`)

    // 确保语言子目录存在
    const languageDir = path.dirname(fullFilePath)
    if (!fs.existsSync(languageDir)) {
      try {
        fs.mkdirSync(languageDir, { recursive: true })
        message({
          type: MessageType.warn,
          msg: `语言目录 ${languageDir} 不存在，已为您自动生成。`,
        })
      } catch (error) {
        message({
          type: MessageType.error,
          msg: `创建语言目录 ${languageDir} 失败：${error}`,
        })
        return
      }
    }

    if (!fs.existsSync(fullFilePath)) {
      try {
        fs.writeFileSync(fullFilePath, '{}')
        message({
          type: MessageType.warn,
          msg: `${lang.localeFileName}.json 文件不存在，已为您自动生成。`,
        })
      } catch (error) {
        message({
          type: MessageType.error,
          msg: `创建文件 ${fullFilePath} 失败：${error}`,
        })
        return
      }
    }

    const newWords = data.reduce((prev: { key: string; value: string }[], item: Words) => {
      if (!item[lang.langType]?.exists && !prev.some((o) => o.key === item.key)) {
        prev.push({
          key: item.key!,
          value: item[lang.langType]?.value || '',
        })
      }
      return prev
    }, [])

    let json: Record<string, any> = {}
    try {
      if (fs.existsSync(fullFilePath)) {
        const fileContent = fs.readFileSync(fullFilePath, 'utf-8')
        json = JSON.parse(fileContent)
      }
    } catch (error) {
      message({
        type: MessageType.error,
        msg: `解析 JSON 文件 ${fullFilePath} 时出错：${error}`,
      })
      json = {}
    }

    newWords.forEach((word) => {
      json[word.key] = word.value
    })

    try {
      fs.writeFileSync(fullFilePath, JSON.stringify(json, null, 2))
    } catch (error) {
      message({
        type: MessageType.error,
        msg: `写入文件 ${fullFilePath} 失败：${error}`,
      })
    }
  })
}
