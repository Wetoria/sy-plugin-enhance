import { readFileSync } from 'node:fs'
import {
  dirname,
  resolve,
} from 'node:path'
import { fileURLToPath } from 'node:url'

// 获取当前文件的目录路径
const __dirname = dirname(fileURLToPath(import.meta.url))

function validateValueType(value, typeDef) {
  if (typeDef.type === 'literal') {
    return value === typeDef.value
  }

  switch (typeDef.type) {
    case 'string':
      return typeof value === 'string'
    case 'number':
      return typeof value === 'number'
    case 'boolean':
      return typeof value === 'boolean'
    case 'string[]':
      return Array.isArray(value) && value.every((item) => typeof item === 'string')
    default:
      return true
  }
}

function validateKeysSorting(keys) {
  const errors = []
  for (let i = 1; i < keys.length; i++) {
    const currentKey = keys[i]
    const previousKey = keys[i - 1]

    // 获取前缀（以_分割的第一部分）
    const currentPrefix = currentKey.split('_')[0]
    const previousPrefix = previousKey.split('_')[0]

    // 如果前缀不同，检查是否按字母顺序排序
    if (currentPrefix !== previousPrefix) {
      if (currentPrefix.localeCompare(previousPrefix) < 0) {
        errors.push({
          key: currentKey,
          prevKey: previousKey,
        })
      }
      continue
    }

    // 如果前缀相同，直接比较完整的键
    if (currentKey.localeCompare(previousKey) < 0) {
      errors.push({
        key: currentKey,
        prevKey: previousKey,
      })
    }
  }
  return errors
}


export default {
  rules: {
    'validate-keys': {
      meta: {
        type: 'problem',
        docs: {
          description: '验证 i18n json 文件中的键是否与 I18nType 接口定义一致',
        },
        fixable: 'code',
        schema: [], // 无需配置选项
      },
      create(context) {
        return {
          Program(node) {
            const filename = context.getFilename()
            if (!filename.endsWith('.json')) return
            if (!filename.includes('i18n')) return

            try {
              // 读取类型定义文件
              const typesContent = readFileSync(
                resolve(__dirname, '../../i18n/types.d.ts'),
                'utf-8',
              )

              // 提取 I18nType 中定义的所有键和类型
              const typeDefinitions = typesContent
                .match(/interface I18nType \{([^}]+)\}/)?.[1]
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line.includes(':'))
                .map((line) => {
                  const [key, typeStr] = line.split(':').map((s) => s.trim())
                  // 处理字面量类型，例如: "pluginName: 'Enhance'"
                  const literalMatch = typeStr.match(/^'([^']*)'/)
                  const type = literalMatch
                    ? {
                        type: 'literal',
                        value: literalMatch[1],
                      }
                    : { type: typeStr.replace(';', '').trim() }
                  return {
                    key,
                    ...type,
                  }
                }) || []

              const typeKeys = typeDefinitions.map((def) => def.key)

              // 读取当前 JSON 文件的内容
              const jsonContent = context.getSourceCode().getText()
              let jsonObj = {}
              let jsonKeys = []
              try {
                jsonObj = JSON.parse(jsonContent)
                jsonKeys = Object.keys(jsonObj)
              } catch (err) {
                context.report({
                  node,
                  message: `JSON 解析错误: ${err.message}`,
                })
                return
              }

              // 检查键的排序
              const sortingErrors = validateKeysSorting(jsonKeys)
              sortingErrors.forEach(({
                key,
                prevKey,
              }) => {
                context.report({
                  node,
                  message: `键的排序错误: "${key}" 应该在 "${prevKey}" 之前`,
                  fix(fixer) {
                    // 重新排序所有键
                    const sortedObj = {}
                    Object.keys(jsonObj)
                      .sort((a, b) => {
                        const aPrefix = a.split('_')[0]
                        const bPrefix = b.split('_')[0]
                        if (aPrefix !== bPrefix) {
                          return aPrefix.localeCompare(bPrefix)
                        }
                        return a.localeCompare(b)
                      })
                      .forEach((k) => {
                        sortedObj[k] = jsonObj[k]
                      })

                    return fixer.replaceText(node, JSON.stringify(sortedObj, null, 2))
                  },
                })
              })

              // 检查 JSON 文件中的键和值是否符合类型定义
              jsonKeys.forEach((key) => {
                const typeDef = typeDefinitions.find((def) => def.key === key)
                if (!typeDef) {
                  context.report({
                    node,
                    message: `键 "${key}" 在 I18nType 接口中未定义`,
                  })
                  return
                }

                // 验证值类型
                const value = jsonObj[key]
                if (!validateValueType(value, typeDef)) {
                  const expectedType = typeDef.type === 'literal'
                    ? `'${typeDef.value}'`
                    : typeDef.type
                  context.report({
                    node,
                    message: `键 "${key}" 的值不符合定义，期望值: ${expectedType}，实际值: ${JSON.stringify(value)}`,
                  })
                }
              })

              // 检查类型定义中的键是否都在 JSON 文件中
              typeKeys.forEach((key) => {
                if (!jsonKeys.includes(key)) {
                  context.report({
                    node,
                    message: `缺少 I18nType 接口中定义的键 "${key}"`,
                  })
                }
              })
            } catch (err) {
              context.report({
                node,
                message: `验证过程出错: ${err.message}`,
              })
            }
          },
        }
      },
    },
  },
}
