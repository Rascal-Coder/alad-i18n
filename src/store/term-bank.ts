import { isChina } from '../tool/string'
import { getId } from '../utils/utils'
import { EntryStatus, InsertState } from './types'

export type WordBarItem = {
  key: string
  text: string
  sourceFiles?: string[] // 记录词条来源的所有文件路径
}
/*两个词条库数据保持一致，用于不同的校验处理*/
// 单词条目
export let WordBar: WordBarItem[] = []
// json结构的词条，最终丢出去的提取词条库
export let WordBarJson: { [key: string]: string } = {}
// 录入词条，统一处理，必须是唯一的处理入口
export function entryWordBar(content: string, sourceFile?: string): EntryStatus {
  const item = wordProcessing(content, sourceFile)
  if (!item) return { key: '', state: InsertState.empty, text: '' }
  const { text } = item

  // 首先检查已有的WordBarJson中是否有相同的中文文本
  for (const [existingKey, existingText] of Object.entries(WordBarJson)) {
    if (existingText === text) {
      // 找到相同的中文文本，更新源文件信息
      if (sourceFile) {
        const existingItem = WordBar.find((item) => item.key === existingKey)
        if (existingItem) {
          if (!existingItem.sourceFiles) {
            existingItem.sourceFiles = []
          }
          if (!existingItem.sourceFiles.includes(sourceFile)) {
            existingItem.sourceFiles.push(sourceFile)
          }
        }
      }

      return {
        state: InsertState.success,
        key: existingKey, // 使用已有的key
        text,
      }
    }
  }

  // 如果没有找到相同的文本，生成新的key
  const newKey = getId()
  WordBar.push({
    key: newKey,
    text,
    sourceFiles: sourceFile ? [sourceFile] : [], // 添加源文件信息数组
  })
  WordBarJson[newKey] = text

  // 表示新增的词条
  return {
    state: InsertState.success,
    key: newKey,
    text,
  }
}
// 获取处理过后的词条
export function getWordBar() {
  return {
    WordBar,
    WordBarJson,
  }
}

// 文字提取处理
export function wordProcessing(str = '', sourceFile?: string) {
  if (!str) return false
  // 不是汉字的不能进入提取
  if (!isChina(str)) return false
  // 去除特殊字符,作为key
  // if (!keyStr) return false
  const sortId = `${getId().slice(0, 4)}${getId().slice(-4)}`
  return {
    key: sortId, // nanoid
    text: str.trim(), // 原始内容需要保留
    sourceFiles: sourceFile ? [sourceFile] : [], // 添加源文件信息数组
  } as WordBarItem
}

// 合并词条库，针对需要将所有提取翻译内容输出到一个文件中的场景
export function mergeWordBar(datas: { [key: string]: string }) {
  if (!datas) return null
  initData()
  WordBarJson = datas
  for (const key in datas) {
    const text = datas[key]
    WordBarJson[key] = text
    WordBar.push({ key, text })
  }
}

// 初始化数据
export function initData() {
  WordBar = []
  WordBarJson = {}
}
