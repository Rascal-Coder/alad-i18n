#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// 读取 package.json
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
const version = packageJson.version

// 读取 README.md
const readmePath = './README.md'
let readmeContent = fs.readFileSync(readmePath, 'utf8')

// 更新版本号
const versionRegex = /badge\/version-[^)]*/g
const updatedContent = readmeContent.replace(versionRegex, `badge/version-${version}`)

// 写回文件
fs.writeFileSync(readmePath, updatedContent)

console.log(`✅ 版本号已同步到 ${version}`)
