import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import {
  dirname,
  join,
} from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  configs,
  locales,
} from './config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export function generateI18nFiles() {
  console.log('run generate')

  // 确保 i18n 目录存在
  const i18nDir = join(__dirname, '..', 'i18n', 'generated')
  if (!existsSync(i18nDir)) {
    mkdirSync(i18nDir, { recursive: true })
  }

  // 为每个语言生成对应的 JSON 文件
  Object.values(locales).forEach((locale) => {
    const fileName = `${locale}.json`
    const filePath = join(i18nDir, fileName)

    // 从 configs 中获取新的翻译内容
    const newData: Record<string, string> = {}
    Object.keys(configs).sort().forEach((key) => {
      const config = configs[key]
      if (config && config[locale]) {
        newData[key] = config[locale]!
      }
    })

    // 读取已存在的文件内容
    let existingData: Record<string, string> = {}
    if (existsSync(filePath)) {
      try {
        const existingContent = readFileSync(filePath, 'utf-8')
        existingData = JSON.parse(existingContent)
        // console.log(`Read existing data from ${fileName}`)
      } catch (error) {
        console.warn(`Failed to parse existing ${fileName}, starting fresh`)
        existingData = {}
      }
    }


    // 合并数据：保留已存在的内容，添加新的内容
    const mergedData = {
      ...existingData, // 保留已存在的内容
      ...newData, // 添加新的内容（如果有重复的键，新内容会覆盖旧的）
    }

    // 如果没有任何新的翻译内容，跳过生成
    if (Object.keys(mergedData).length === 0) {
      // console.log(`Skipped: ${fileName} (no translations available)`)
      return
    }


    // 判断内容是否有变化
    const hasChanges = (() => {
      const newKeys = Object.keys(mergedData)
      const existingKeys = Object.keys(existingData)

      const isNotSameLength = newKeys.length !== existingKeys.length
      if (isNotSameLength) {
        return true
      }

      const hasNewValue = newKeys.some((key) => {
        return mergedData[key] !== existingData[key]
      })
      if (hasNewValue) {
        return true
      }

      const oldValueChanged = existingKeys.some((key) => {
        return mergedData[key] !== existingData[key]
      })
      if (oldValueChanged) {
        return true
      }

      return false
    })()

    // 如果内容没有变化，跳过生成
    if (!hasChanges) {
      console.log(`Skipped: ${fileName} (no changes detected)`)
      return
    }

    // 生成 JSON 文件
    const jsonContent = JSON.stringify(mergedData, null, 2)
    writeFileSync(filePath, jsonContent, 'utf-8')

    const newKeys = Object.keys(newData).length
    const existingKeys = Object.keys(existingData).length
    const totalKeys = Object.keys(mergedData).length

    console.log(`Generated: ${fileName} (${newKeys} new, ${existingKeys} existing, ${totalKeys} total)`)
  })

  console.log('i18n JSON files generation completed!')
}
