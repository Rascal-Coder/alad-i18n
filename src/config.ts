import { Config } from './types/config'
import { getVsCodeProjectPath, isAccess, readFile } from './tool/file'
import { join } from 'path'
import { pathToFileURL } from 'url'
import * as fs from 'fs/promises'
// import { message } from './tool/message'
// import { MessageType } from './tool/enums'

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
  baiduAppId: '20250723002413545',
  baiduAppToken: 'vpH9SHtxjsxupjBiTeBa',
  outExtractFile: false,
  languages: ['zh:zh-CN', 'en:en-US'],
  localesPath: 'apps/web-antd/src/locales/langs',
  importCode: "import { $t } from '#/locales';\n",
  localesPerfix: 'locale',
}

let configCache: Config | null = null
let configLastModified: number = 0

// 支持的配置文件名
const CONFIG_FILE_NAMES = ['alad-i18n.config.json']

/**
 * 获取当前配置
 */
export function getConfig(): Config {
  return configCache || defaultConfig
}

/**
 * 验证配置是否有效
 */
function validateConfig(config: any): config is Partial<Config> {
  if (!config || typeof config !== 'object') {
    return false
  }

  // 基本验证，可以根据需要扩展
  if (config.fileOutMode && !['file', 'unified'].includes(config.fileOutMode)) {
    console.warn('无效的 fileOutMode 值:', config.fileOutMode)
    return false
  }

  if (config.languages && !Array.isArray(config.languages)) {
    console.warn('languages 必须是数组')
    return false
  }

  return true
}

/**
 * 查找配置文件
 */
async function findConfigFile(): Promise<string | null> {
  const projectPath = getVsCodeProjectPath()

  for (const configFileName of CONFIG_FILE_NAMES) {
    const configPath = join(projectPath, configFileName)
    if (await isAccess(configPath)) {
      console.log('找到配置文件:', configPath)
      return configPath
    }
  }

  console.log('未找到配置文件，使用默认配置')
  return null
}

/**
 * 读取 JavaScript/TypeScript 配置文件
 */
// async function loadJsConfig(configPath: string): Promise<any> {
//   try {
//     const ext = configPath.split('.').pop()?.toLowerCase()

//     // 对于 .mjs 文件，使用动态 import
//     if (ext === 'mjs') {
//       return await loadMjsConfig(configPath)
//     }

//     // 对于 .js 文件，使用 require
//     // 删除之前的缓存
//     if (require.cache[configPath]) {
//       delete require.cache[configPath]
//     }

//     const configModule = require(configPath)

//     // 支持 CommonJS 的 module.exports 和 ES6 的 export default
//     const config = configModule.default || configModule

//     // 支持配置为函数的情况
//     return typeof config === 'function' ? config() : config
//   } catch (error) {
//     console.error('加载 JS 配置文件失败:', error)
//     throw new Error(`无法加载配置文件 ${configPath}: ${error}`)
//   }
// }

/**
 * 读取 ES Module (.mjs) 配置文件
 */
// async function loadMjsConfig(configPath: string): Promise<any> {
//   try {
//     // 使用动态 import 加载 ES Module
//     // 使用 pathToFileURL 正确处理跨平台路径
//     // const timestamp = Date.now()
//     const moduleUrl = configPath

//     const configModule = await import(moduleUrl)

//     // 支持 export default 和命名导出
//     const config = configModule.default || configModule.config || configModule

//     // 支持配置为函数的情况
//     return typeof config === 'function' ? config() : config
//   } catch (error) {
//     console.error('加载 MJS 配置文件失败:', error)
//     throw new Error(`无法加载配置文件 ${configPath}: ${error}`)
//   }
// }

/**
 * 读取 JSON 配置文件
 */
async function loadJsonConfig(configPath: string): Promise<any> {
  try {
    const { strFile } = await readFile(configPath)
    return JSON.parse(strFile)
  } catch (error) {
    console.error('解析 JSON 配置文件失败:', error)
    throw new Error(`无法解析配置文件 ${configPath}: ${error}`)
  }
}

/**
 * 获取文件修改时间
 */
async function getFileModifiedTime(filePath: string): Promise<number> {
  try {
    const stats = await fs.stat(filePath)
    return stats.mtime.getTime()
  } catch {
    return 0
  }
}

/**
 * 加载配置文件
 */
async function loadConfigFile(configPath: string): Promise<any> {
  const ext = configPath.split('.').pop()?.toLowerCase()

  switch (ext) {
    case 'json':
      return await loadJsonConfig(configPath)
    // case 'js':
    // case 'mjs':
    //   return await loadJsConfig(configPath)
    // default:
    //   throw new Error(`不支持的配置文件格式: ${ext}`)
  }
}

/**
 * 读取并合并配置文件
 */
export async function loadConfig(force: boolean = false): Promise<boolean> {
  try {
    const configPath = await findConfigFile()

    if (!configPath) {
      // 没有找到配置文件，使用默认配置
      configCache = { ...defaultConfig }
      return false
    }

    // 检查文件是否有更新（除非强制重新加载）
    if (!force && configCache) {
      const currentModified = await getFileModifiedTime(configPath)
      if (currentModified <= configLastModified) {
        console.log('配置文件未发生变化，使用缓存')
        return true
      }
    }

    // 加载配置文件
    const userConfig = await loadConfigFile(configPath)

    // 验证配置
    if (!validateConfig(userConfig)) {
      console.warn('配置文件格式不正确，使用默认配置')
      configCache = { ...defaultConfig }
      return false
    }

    // 合并配置
    configCache = {
      ...defaultConfig,
      ...userConfig,
    }
    console.log('userConfig', userConfig)

    console.log('configCache', configCache)

    // 更新修改时间
    configLastModified = await getFileModifiedTime(configPath)

    console.log('配置加载完成:', configCache)
    return true
  } catch (error) {
    console.error('加载配置失败:', error)
    // 发生错误时使用默认配置
    configCache = { ...defaultConfig }
    return false
  }
}

/**
 * 重置配置缓存
 */
export function resetConfigCache(): void {
  configCache = null
  configLastModified = 0
}

/**
 * 获取配置文件路径（用于调试）
 */
export async function getConfigFilePath(): Promise<string | null> {
  return await findConfigFile()
}

// 兼容旧的函数名
export async function getSetConfigFile(): Promise<boolean> {
  return await loadConfig()
}
