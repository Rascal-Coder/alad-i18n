# Alad-i18n VSCode 插件

Alad-i18n 是一个 VSCode 插件，支持自动获取文件代码中的中文，自动翻译成各种语言并自动保存到本地。

## 功能特性

- 🚀 自动提取代码中的中文文本
- 🌍 支持多种语言翻译
- 📝 自动生成国际化文件
- ⚡ 支持 Vue 3 项目
- 🔧 灵活的配置管理系统

## 使用方法

### 快捷键

- `Ctrl+Shift+T` (Windows/Linux)
- `Cmd+Shift+T` (Mac)

### 右键菜单

在支持的文件类型（JavaScript、TypeScript、Vue 等）中右键选择 "Alad-i18n: 翻译当前页面"

## 配置管理

### 支持的配置文件格式

`alad-i18n.config.json` - JSON 格式

### 配置文件示例

#### JSON 格式 (alad-i18n.config.json)

```json
{
  "outFile": "alad-i18n-out",
  "i18nLang": "/src/i18n/zh",
  "fileOutMode": "unified",
  "unifiedFileName": "lang",
  "vue3i18n": true,
  "localesMehodName": "$t",
  "languages": ["zh:zh-CN", "en:en-US"],
  "localesPath": "src/locales/langs",
  "importCode": "import { $t } from '@/locales';\n",
  "localesPerfix": "locale"
}
```

### 配置项说明

| 配置项             | 类型                  | 默认值                     | 说明                                     |
| ------------------ | --------------------- | -------------------------- | ---------------------------------------- |
| `outFile`          | string                | `'alad-i18n-out'`          | 输出文件目录名称                         |
| `i18nLang`         | string                | `''`                       | 项目的 i18n 语言路径，如：`/src/i18n/zh` |
| `fileOutMode`      | `'file' \| 'unified'` | `'unified'`                | 文件输出模式                             |
| `unifiedFileName`  | string                | `'lang'`                   | 统一输出的文件名称                       |
| `vue3i18n`         | boolean               | `true`                     | 是否是 Vue 3 项目                        |
| `localesMehodName` | string                | `'$t'`                     | i18n 方法名                              |
| `baiduAppId`       | string                | -                          | 百度翻译 App ID                          |
| `baiduAppToken`    | string                | -                          | 百度翻译 App Token                       |
| `outExtractFile`   | boolean               | `false`                    | 是否输出提取的文件                       |
| `languages`        | string[]              | `['zh:zh-CN', 'en:en-US']` | 支持的语言列表                           |
| `localesPath`      | string                | -                          | 多语言文件输出路径                       |
| `importCode`       | string                | -                          | 自动注入的导入代码                       |
| `localesPerfix`    | string                | `'locale'`                 | 多语言键值前缀                           |

## 配置系统特性

### 🔄 智能缓存

- 自动检测配置文件变更
- 只在文件更新时重新加载配置
- 提升性能，减少不必要的文件读取

### ✅ 配置验证

- 自动验证配置格式的正确性
- 提供详细的错误信息和警告
- 配置错误时自动回退到默认配置

### 🛡️ 错误处理

- 完善的错误处理机制
- 配置文件不存在时自动使用默认配置
- 详细的日志信息，便于调试

## 开发说明

遵循 VSCode 开发规范，请尽可能的保证代码解耦。

### 发布

请先安装：`npm install -g @vscode/vsce`

运行 `npm run build` 会生成 `Alad-i18n-{版本}.vsix` 文件，请自行安装到本地 VSCode。

## 许可证

本项目遵循 MIT 许可证。
