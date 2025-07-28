import { ESLint, Rule } from 'eslint'
import * as ESTree from 'estree'
import { PrivateIdentifier } from 'estree'
import type { AST } from 'vue-eslint-parser'
import { entryWordBar } from '../../store/term-bank'
import { ASTType } from '../../tool/ast'
import { unmatchedIdentifier } from '../../tool/string'
import { replaceText } from './replace'
import { FileType, ReplaceType, InsertState } from '../../store/types'
import { globalStatus } from '../../store/global-status'
import type { JSXText } from '@typescript-eslint/types/dist/generated/ast-spec'
import { getConfig } from '../../config'
import { message } from '../../tool/message'
import { MessageType } from '../../tool/enums'

// 插入import代码的函数
function insertImportCode(fixer: Rule.RuleFixer, context: Rule.RuleContext, config: any) {
  const { fileType } = globalStatus

  if (fileType === FileType.vue) {
    // 对于Vue文件，需要在script标签内的开始位置插入
    const sourceCode = context.getSourceCode()
    const program = sourceCode.ast as any

    // 在Program节点的开始位置插入（这是script标签内容的开始）
    if (program.body && program.body.length > 0) {
      // 在第一个语句前插入
      const firstStatement = program.body[0]
      return fixer.insertTextBefore(firstStatement, config.importCode)
    } else {
      message({
        msg: '插入失败没有script标签',
        type: MessageType.error,
      })
      return null
    }
  } else {
    // 对于普通JS/TS文件，在文件开头插入
    return fixer.insertTextBeforeRange([0, 0], config.importCode)
  }
}

export const meta = {
  name: 'eslint-plugin-parrot',
  version: '1.0.0',
}

export default {
  rules: {
    // 实际规则名称parrot/chinese-extract
    'chinese-extract': {
      meta: {
        /*
         "problem"表示规则正在标识将导致错误或可能导致混淆行为的代码。开发人员应将此视为高度优先解决的问题。
        "suggestion"意味着规则正在识别可以以更好的方式完成的事情，但如果不更改代码就不会发生错误。
        "layout"意味着规则主要关心空格、分号、逗号和括号，程序的所有部分决定代码的外观而不是代码的执行方式。这些规则适用于 AST 中未指定的部分代码。
                * */
        type: 'suggestion',
        // 定义提示信息文本 error-name为提示文本的名称 定义后我们可以在规则内部使用这个名称
        messages: {
          // 'error-name': '这是一个错误的命名',
        },
        docs: {
          description: '检测使用了中文并进行提取',
        },
        // 标识这条规则是否可以修复，假如没有这个属性，即使你在下面那个create方法里实现了fix功能，eslint也不会帮你修复
        fixable: 'code',
        // 这里定义了这条规则需要的参数
        // 比如我们是这样使用带参数的rule的时候，rules: { myRule: ['error', param1, param2....]}
        // error后面的就是参数，而参数就是在这里定义的
        schema: [],
      },
      create(context: Rule.RuleContext): Rule.RuleListener {
        // console.log('create=============>', context.parserServices)

        const importNames: string[] = []

        // vue解析器提供的方式
        return context.parserServices.defineTemplateBodyVisitor(
          // <template>部分走这里
          /* 存在的节点类型,ast原生类型未列出
            VAttribute: ["key", "value"],
            VDirectiveKey: ["name", "argument", "modifiers"],
            VDocumentFragment: ["children"],
            VElement: ["startTag", "children", "endTag"],
            VEndTag: [],
            VExpressionContainer: ["expression"],
            VFilter: ["callee", "arguments"],
            VFilterSequenceExpression: ["expression", "filters"],
            VForExpression: ["left", "right"],
            VIdentifier: [],
            VLiteral: [],
            VOnExpression: ["body"],
            VSlotScopeExpression: ["params"],
            VStartTag: ["attributes"],
            VText: [],*/
          {
            TemplateElement(node: ESTree.TemplateElement) {
              const entryStatus = entryWordBar(node.value.raw)
              replaceText({
                node,
                entryStatus,
                context,
                replaceType: ReplaceType.vueTemplate,
              })
            },
            Literal(node: Rule.Node): void {
              const parent = node?.parent as ESTree.CallExpression
              if (parent && parent.type === ASTType.CallExpression) {
                if (
                  parent.callee.type === ASTType.Identifier &&
                  unmatchedIdentifier(parent.callee.name)
                )
                  return
              }
              const entryStatus = entryWordBar((node as ESTree.Literal).value as string)
              replaceText({
                node,
                entryStatus,
                context,
                replaceType: ReplaceType.vueTemplate,
              })
            },
            VLiteral(node: AST.VLiteral): void {
              const entryStatus = entryWordBar(node.value)
              // 父级节点需要改为冒号方式，传递父节点
              replaceText({
                node: node.parent,
                entryStatus,
                context,
                replaceType: ReplaceType.vueTemplate,
              })
            },
            VText(node: AST.VText): void {
              // console.log(node)
              const entryStatus = entryWordBar(node.value)
              replaceText({
                node,
                entryStatus,
                context,
                replaceType: ReplaceType.vueTemplate,
              })
            },
          },
          // Event handlers for <script> or scripts. (optional)
          // js，ts部分会这里
          {
            Literal(node: Rule.Node): void {
              const parent = node?.parent
              // 获取父节点
              // 如果父节点的spcifiers中的local中有name与localesMehodName相同就不引入
              if (parent && 'specifiers' in parent && parent.type === 'ImportDeclaration') {
                parent.specifiers.forEach((specifier) => {
                  if (
                    specifier.type === 'ImportSpecifier' ||
                    specifier.type === 'ImportDefaultSpecifier'
                  ) {
                    importNames.push(specifier.local.name)
                  }
                })
              }
              const entryStatus = entryWordBar((node as ESTree.Literal).value as string)
              switch (parent?.type as string) {
                case ASTType.JSXAttribute: {
                  // 父级节点需要改为冒号方式，传递父节点
                  replaceText({
                    node: node.parent,
                    entryStatus,
                    context,
                    replaceType: ReplaceType.js,
                  })
                  break
                }
                default: {
                  if (parent && parent.type === ASTType.CallExpression) {
                    const callParent = parent as ESTree.CallExpression
                    // 检查简单的函数调用，如 $t('key')
                    if (
                      callParent.callee.type === ASTType.Identifier &&
                      unmatchedIdentifier(callParent.callee.name)
                    )
                      return
                    // 检查成员表达式调用，如 this.$t('key')
                    if (
                      callParent.callee.type === ASTType.MemberExpression &&
                      unmatchedIdentifier((callParent.callee.property as PrivateIdentifier).name)
                    )
                      return
                  }
                  // 使用上面已经生成的entryStatus，不要重复调用entryWordBar
                  const { fileType } = globalStatus
                  // 默认为js文件处理方式
                  let replaceType = ReplaceType.js
                  // 不同文件下的判断处理
                  if (fileType === FileType.vue) {
                    const { vue3i18n } = getConfig()
                    replaceType = vue3i18n ? ReplaceType.vue3js : ReplaceType.vueOptions
                    // replaceType = ReplaceType.vue3js
                    // replaceText({ node, entryStatus, context, replaceType })
                    // return
                  }
                  replaceText({ node, entryStatus, context, replaceType })
                }
              }
              const isImported = importNames.includes(getConfig().localesMehodName)

              if (entryStatus.state !== InsertState.empty && !isImported) {
                const config = getConfig()
                context.report({
                  node: context.getSourceCode().ast,
                  message: `添加导入: ${config.localesMehodName}`,
                  fix: (fixer: Rule.RuleFixer) => {
                    return insertImportCode(fixer, context, config)
                  },
                })
              }
            },
            TemplateElement(node: ESTree.TemplateElement) {
              const entryStatus = entryWordBar(node.value.raw)
              replaceText({
                node,
                entryStatus,
                context,
                replaceType: ReplaceType.js,
              })
            },
            JSXText(node: JSXText) {
              const entryStatus = entryWordBar(node.value)
              replaceText({
                node,
                entryStatus,
                context,
                replaceType: ReplaceType.js,
              })
            },
          },
          // Options. (optional)
          {
            templateBodyTriggerSelector: 'Program:exit',
          },
        )
      },
    },
  },
  configs: {
    extract: {
      plugins: ['parrot'], // 插件的前缀名称
      rules: {
        'parrot/chinese-extract': 'error',
      },
    },
  },
} as ESLint.Plugin
