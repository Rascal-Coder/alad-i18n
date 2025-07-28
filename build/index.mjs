import * as fs from 'fs/promises';

const packageApi = {
    read: () => fs.readFile('./package.json'),
    write: (str) => fs.writeFile('./package.json', str)
}

// 版本号修改
function updateVersionTool(resData) {
    resData = JSON.parse(resData.toString())
    const versionArr = resData.version.split('.')

    versionArr[2] = Number(versionArr[2]) + 1

    resData.version = versionArr.toString().replace(/,/g, '.')

    return resData
}

// 修改版本
async function updateVersion() {
    try {
        // 修改package.json下面的版本号
        const packData = await packageApi.read()
        const pack = updateVersionTool(packData)
        const version = pack.version

        // 写入版本文件
        await packageApi.write(JSON.stringify(pack,null,'\t'))

        console.log('最新版本号：' + version)
    } catch (e) {
        console.log(e)
        return new Error(e)
    }
}
updateVersion()
