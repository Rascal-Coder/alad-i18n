import { InsertState, ReplaceType } from '../../store/types'
import { Rule } from 'eslint'
import { ReplaceTextParams } from './types'
import { ASTType } from '../../tool/ast'
import { getConfig } from '../../config'

// 替换文本为指定内容
export function replaceText(
  { node, entryStatus, context, replaceType, isTemplate } = {
    isTemplate: false,
  } as ReplaceTextParams,
) {
  const { state, key, text } = entryStatus
  if (state === InsertState.empty) return false
  const { type } = node

  const TemplateCode = i18nTemplateCode(replaceType, key, text)

  // 修复函数
  let fixFun = (
    fixer: Rule.RuleFixer,
  ): null | Rule.Fix | IterableIterator<Rule.Fix> | Rule.Fix[] => {
    return null
  }

  if (type === ASTType.Literal) {
    fixFun = (fixer: Rule.RuleFixer) => {
      const [start, end] = node.range
      return fixer.replaceTextRange([start, end], TemplateCode)
    }
  }
  if (type === ASTType.TemplateElement) {
    fixFun = (fixer: Rule.RuleFixer) => {
      const [start, end] = node.range
      const { value } = node
      const { raw } = value
      // 需要减去的长度,需要动态变化
      let reduceLen = end - start - 1 - raw.length
      reduceLen = reduceLen === 2 ? 2 : 1 // 存在字符差异，进行抹平
      return fixer.replaceTextRange([start + 1, end - reduceLen], '${' + TemplateCode + '}')
    }
  }
  if (type === ASTType.VText) {
    fixFun = (fixer: Rule.RuleFixer) => {
      const [start, end] = node.range
      return fixer.replaceTextRange([start, end], '{{' + TemplateCode + '}}')
    }
  }
  if (type === ASTType.VAttribute) {
    fixFun = (fixer: Rule.RuleFixer) => {
      const { key } = node
      return fixer.replaceText(node, ':' + key.name + '=' + '"' + TemplateCode + '"')
    }
  }
  if (type === ASTType.JSXText) {
    fixFun = (fixer: Rule.RuleFixer) => {
      const [start, end] = node.range
      return fixer.replaceTextRange([start, end], '{' + TemplateCode + '}')
    }
  }
  if (type === ASTType.JSXAttribute) {
    fixFun = (fixer: Rule.RuleFixer) => {
      const { name } = node
      return fixer.replaceText(node, name.name + '=' + '{' + TemplateCode + '}')
    }
  }
  context.report({ node, message: '替换为:' + TemplateCode, fix: fixFun })
}

// i18n模板代码
export function i18nTemplateCode(replaceType: ReplaceType, key: string, text: string) {
  const { localesMehodName, localesPerfix } = getConfig()

  const defaultReplaceText = localesPerfix
    ? `${localesMehodName}('${localesPerfix}.${key}' /* ${text} */)`
    : `${localesMehodName}('${key}' /* ${text} */)`

  const optionsReplaceText = localesPerfix
    ? `this.${localesMehodName}('${localesPerfix}.${key}' /* ${text} */)`
    : `this.${localesMehodName}('${key}' /* ${text} */)`

  switch (replaceType) {
    case ReplaceType.js: {
      return defaultReplaceText
    }
    case ReplaceType.vueOptions: {
      return optionsReplaceText
    }
    case ReplaceType.vueTemplate: {
      return defaultReplaceText
    }
    case ReplaceType.vue3js: {
      return defaultReplaceText
    }
    default: {
      return defaultReplaceText
    }
  }
}
