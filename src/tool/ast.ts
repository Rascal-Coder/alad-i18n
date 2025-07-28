export enum ASTType {
  // 一个完整的程序源代码树。
  Directive = 'Directive',
  // 指令当中的文字
  DirectiveLiteral = 'DirectiveLiteral',
  // 字符串文字
  StringLiteral = 'StringLiteral',
  // 表达式语句，即由单个表达式组成的语句。
  ExpressionStatement = 'ExpressionStatement',
  // 三元表达式
  ConditionalExpression = 'ConditionalExpression',
  // 函数或方法调用表达式。
  CallExpression = 'CallExpression',
  // 二元运算符表达式。
  BinaryExpression = 'BinaryExpression',
  // 标识符。请注意，标识符可以是表达式或析构函数模式。
  Identifier = 'Identifier',
  // 成员表达式。如果computed为true，则节点对应于computed（a[b]）成员表达式，属性为expression。如果computed为false，则节点对应于静态（a.b）成员表达式，属性为Identifier。
  MemberExpression = 'MemberExpression',
  // 模板字符串节点
  TemplateElement = 'TemplateElement',
  // 一个字符串
  Literal = 'Literal',
  // vue字符串
  VLiteral = 'VLiteral',
  // vue html中的字符串
  VText = 'VText',
  // vue html属性
  VAttribute = 'VAttribute',
  // jsx純文字
  JSXText = 'JSXText',
  // jsx屬性
  JSXAttribute = 'JSXAttribute',
}
