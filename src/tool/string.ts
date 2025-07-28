// 去所有空格
export function strAllTrim(str = '') {
  return str.replace(/\s/g, '')
}
// 去除前后空格

// 判断汉字
export function isChina(s: string) {
  const reg = new RegExp('[\\u4E00-\\u9FFF]+', 'g')
  return reg.test(s)
}

//去除特殊字符，包含空格
// export function trimSpecial(string = '') {
//   const pattern = /[`~!@#$^\-&*()=|{}':;',\\\[\]\.<>\/?~！@#￥……&*（）——|{}【】'；：""'。，、？\s]/g
//   return string.replace(pattern, '')
// }

// 匹配不可翻译的函数值
export function unmatchedIdentifier(name: string) {
  return ['t', 'log', '$t'].includes(name)
}
