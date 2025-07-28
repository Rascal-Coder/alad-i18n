export enum InsertState {
  success,
  // error,
  empty, // 这个代表词条内容不符合要求，不进行任何处理
}

export type EntryStatus = {
  state: InsertState
  key: string
  text: string
}

// 替换内容类型
export enum ReplaceType {
  vueTemplate, // $t('key')
  vueOptions, // this.$t('key')
  vue3js, // i18n.global.t('key')
  js, // i18n.t('key')
}
// 文件后缀名
export enum FileType {
  vue = 'vue',
  js = 'js',
  jsx = 'jsx',
  ts = 'ts',
  tsx = 'tsx',
}
