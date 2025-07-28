export type Config = {
  // 注意输出的文件地址为：项目地址+outFile+文件.json
  // 这是文件输出的目录地址
  outFile: string
  // 当需要直接输出到i18n当中的json文件时有效，需要配置unified
  // i18n的语言文件目录
  // 项目的i18n语言路径,路径编写需要前斜杠，如：/src/i18n/zh
  i18nLang: string | null
  // file按获取到的翻译文件名称输出提取的文件名称，
  // unified 统一的输出名称,统一模式为根据原来的输出的json，增量增加json当中的内容
  fileOutMode: 'file' | 'unified'
  // 统一输出的文件名称，固定为json文件
  unifiedFileName: string
  // 是否是vue3
  vue3i18n: boolean
  // 默认的i18n的变量名
  localesMehodName: string
  // 百度翻译的appId
  baiduAppId: string
  // 百度翻译的appToken
  baiduAppToken: string
  // 是否输出提取的文件
  outExtractFile: boolean
  // 语言列表
  languages: string[]
  // 国际化输出到的文件地址
  localesPath: string
  // 引入代码
  importCode: string
  // 国际化替换的前缀
  localesPerfix: string
}
