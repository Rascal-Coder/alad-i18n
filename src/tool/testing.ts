// 检测是否存在根目录
import { getVsCodeProjectPath } from './file'

export function testRootPath() {
  if (!getVsCodeProjectPath()) return new Error('无法获取到根目录')
  return true
}
