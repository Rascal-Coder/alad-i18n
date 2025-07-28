import { MessageType } from './tool/enums'
import { message } from './tool/message'
import { Config } from './types/config'
import * as vscode from 'vscode'

// 默认配置
const defaultConfig: Config = {
  // 注意输出的文件地址为：项目地址+outFile+文件.json
  outFile: 'alad-i18n-out',
  // 项目的i18n语言路径,路径编写需要前斜杠，如：/src/i18n/zh
  i18nLang: '',
  fileOutMode: 'unified',
  unifiedFileName: 'lang',
  vue3i18n: true,
  localesMehodName: '$t',
  baiduAppId: '',
  baiduAppToken: '',
  outExtractFile: false,
  languages: ['zh:zh-CN', 'en:en-US'],
  localesPath: '', //apps/web-antd/src/locales/langs
  importCode: "import { $t } from '#/locales';\n",
  localesPerfix: 'locale',
}

/**
 * 获取当前配置 - 使用 VS Code workspace 配置
 */
export function getConfig(): Config {
  const configuration = vscode.workspace.getConfiguration('Alad-i18n')

  return {
    outFile: configuration.get<string>('OutFile') || defaultConfig.outFile,
    i18nLang: configuration.get<string>('I18nLang') || defaultConfig.i18nLang,
    fileOutMode: configuration.get<'file' | 'unified'>('FileOutMode') || defaultConfig.fileOutMode,
    unifiedFileName: configuration.get<string>('UnifiedFileName') || defaultConfig.unifiedFileName,
    vue3i18n: configuration.get<boolean>('Vue3i18n') ?? defaultConfig.vue3i18n,
    localesMehodName:
      configuration.get<string>('LocalesMehodName') || defaultConfig.localesMehodName,
    baiduAppId: configuration.get<string>('Baidu App Id') || defaultConfig.baiduAppId,
    baiduAppToken: configuration.get<string>('Baidu App Token') || defaultConfig.baiduAppToken,
    outExtractFile: configuration.get<boolean>('OutExtractFile') ?? defaultConfig.outExtractFile,
    languages: configuration.get<string[]>('Languages') || defaultConfig.languages,
    localesPath: configuration.get<string>('LocalesPath') || defaultConfig.localesPath,
    importCode: configuration.get<string>('ImportCode') || defaultConfig.importCode,
    localesPerfix: configuration.get<string>('LocalesPerfix') || defaultConfig.localesPerfix,
  }
}

export function checkConfig() {
  const config = getConfig()
  if (config.baiduAppId === '') {
    message({ msg: '请先参考使用文档设置百度app id', type: MessageType.error })
    return false
  }
  if (config.baiduAppToken === '') {
    message({ msg: '请先参考使用文档设置百度app token', type: MessageType.error })
    return false
  }
  return true
}
