import { ESLint } from 'eslint'
import ChineseExtract, { meta } from '../plugins/chinese-extract/imort'
import { setEslintResults } from '../store/global-status'
const tsParser = require('@typescript-eslint/parser')
const espree = require('espree')
const vueParser = require.resolve('vue-eslint-parser')

// eslint配置提取
export async function analysis(url: string) {
  // console.log(vueParser)
  const eslint = new ESLint({
    fix: true, // 是否自动修复
    plugins: { [meta.name]: ChineseExtract }, // 加载自定义的插件
    overrideConfig: {
      // 加载插件自定义的配置
      // 原理：根据已经加载的插件去读取插件下面的配置信息
      extends: ['plugin:parrot/extract'],
      // 添加vue和ts解析功能
      parser: vueParser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true,
        },
        parser: {
          js: espree,
          jsx: espree,
          ts: tsParser,
          tsx: tsParser,
        },
      },
      rules: {
        'prettier/prettier': 'off',
      },
    },
  })

  // 检查文件
  const results = await eslint.lintFiles([url])
  setEslintResults(results)
  // console.log(results)
  // 输出回原文件
  // await ESLint.outputFixes(results)
}
