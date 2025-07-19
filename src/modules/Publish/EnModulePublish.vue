<template>
  <EnSettingsTeleportModule
    :name="moduleName"
    :display="moduleDisplayName"
    :module="module"
    always
  >
    <EnSettingsItem>
      <div>
        启用在线分享
      </div>
      <template #opt>
        <a-switch
          v-model="moduleOptions.enabled"
        />
      </template>
      <template
        #desc
      >
        <a-space direction="vertical">
          <div>
            <template v-if="isPermanent">
              <a-button @click="getPackage">
                获取功能
              </a-button>
            </template>
            <template v-else>
              该功能目前仅永久订阅用户可用
            </template>
          </div>
          <div>
            <a-space>
              <template v-if="moduleOptions.enabled">
                <icon-check-circle style="color: rgb(var(--success-6))" />
              </template>
              <template v-else>
                <icon-close-circle style="color: rgb(var(--danger-6))" />
              </template>
              <a-typography-text>
                在线分享功能{{ moduleOptions.enabled ? '已开启' : '未开启' }}
              </a-typography-text>
            </a-space>
          </div>
          <div v-if="moduleOptions.enabled">
            在线分享已启用于：
            <a
              :href="publishAddr"
              target="_blank"
            >{{ publishAddr }}</a>
          </div>
        </a-space>
      </template>
    </EnSettingsItem>
    <EnSettingsItem mode="vertical">
      <div>
        端口
      </div>
      <template #desc>
        用于提供在线分享服务的端口
      </template>
      <template #opt>
        <a-input-number
          v-model="moduleOptions.defaultPort"
          class="input-demo"
          placeholder="Please Enter"
          mode="button"
          :readOnly="plugin.isMobile"
          :step="1"
          @change="handleChange"
        />
      </template>
    </EnSettingsItem>
    <EnSettingsItem
      v-if="moduleOptions.enabled"
      mode="vertical"
    >
      <div>
        页面映射
      </div>
      <template #desc>
        <a-space
          direction="vertical"
          style="width: 100%"
        >
          <div>
            用于将地址映射到在线分享服务。根目录请使用 home
          </div>
          <div>
            你也可以使用 /siyuan/blocks/:blockId 来访问任意块(:blockId 部分为块 ID)
          </div>
          <div>
            例如：about 映射到 20250426112627-dvxroxk
          </div>
          <div>
            注：api 和 resources 开头的 path 会被自动忽略
          </div>
          <!-- 现有的页面映射条目（值可编辑） -->
          <div
            v-for="key in Object.keys(pageMap)"
            :key="key"
            style="display: flex; gap: 2px; align-items: center;"
          >
            <div style="flex: 1;">
              <a-typography-text>
                <strong>{{ key }}</strong>
              </a-typography-text>
            </div>
            <div style="flex: 1;">
              <a-input
                v-model="pageMap[key]"
                placeholder="请输入对应的块 ID"
                @change="savePageMapData"
              />
            </div>
            <EnButtonIcon
              @click="openPageInBrowser(key as string)"
            >
              <template #prompt>
                查看页面
              </template>
              <SyIcon
                name="iconOpen"
                :size="10"
              />
            </EnButtonIcon>
            <EnBlockJumper
              :block-id="pageMap[key]"
            />
            <EnButtonIcon
              status="danger"
              @click="removePageMapItem(key as string)"
            >
              <template #prompt>
                删除
              </template>
              <icon-delete />
            </EnButtonIcon>
          </div>

          <!-- 添加新条目的输入框 -->
          <div style="display: flex; gap: 8px; align-items: flex-start;">
            <div style="flex: 1;">
              <a-input
                v-model="newPath"
                placeholder="请输入新的地址路径 (如: about 或 /about)"
                :status="getPathValidationStatus(newPath)"
                @keyup.enter="addPageMapItem"
              />
              <div
                v-if="getPathValidationError(newPath)"
                style="color: rgb(var(--danger-6)); font-size: 12px; margin-top: 4px;"
              >
                {{ getPathValidationError(newPath) }}
              </div>
            </div>
            <div style="flex: 1;">
              <a-input
                v-model="newBlockId"
                placeholder="请输入对应的块 ID"
                @keyup.enter="addPageMapItem"
              />
            </div>
            <a-button
              type="primary"
              :disabled="!canAddNewItem"
              @click="addPageMapItem"
            >
              <template #icon>
                <icon-plus />
              </template>
              添加
            </a-button>
          </div>
        </a-space>
      </template>
    </EnSettingsItem>
  </EnSettingsTeleportModule>
</template>

<script setup lang="ts">
import {
  getFile,
  putFile,
  unzip,
} from '@/api'
import { injectAuthStatus } from '@/logic/Auth'
import { useValidServer } from '@/logic/ValidServer'
import { usePlugin } from '@/main'
import { useModule } from '@/modules/EnModuleControl/ModuleProvide'
import EnSettingsItem from '@/modules/Settings/EnSettingsItem.vue'

import EnSettingsTeleportModule from '@/modules/Settings/EnSettingsTeleportModule.vue'

import {
  EN_CONSTANTS,
  EN_MODULE_LIST,
} from '@/utils/Constants'
import {
  Notification,
} from '@arco-design/web-vue'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  watch,
} from 'vue'

// 声明全局类型扩展
declare global {
  interface Window {
    nuxtProject?: any
  }
}


const {
  isPermanent,
} = injectAuthStatus()


const port = 3000
const plugin = usePlugin()

const moduleName = EN_CONSTANTS.EN_PUBLISH
const moduleDisplayName = EN_CONSTANTS.EN_PUBLISH_DISPLAY

const {
  module,
  moduleOptions,
} = useModule<{
  defaultPort: number
} & EnModule>(EN_MODULE_LIST.EN_PUBLISH, {
  defaultData: {
    enabled: false,
    moduleName,
    moduleDisplayName,

    defaultPort: port,
  },
  needSync: false,
})

const publishAddr = ref('')
const handleChange = () => {
  if (!moduleOptions.value.defaultPort) {
    nextTick(() => {
      moduleOptions.value.defaultPort = port
    })
  }
}


// const switchEnabledStatus = (enabled: boolean) => {
//   if (enabled) {
//     enablePublish()
//   } else {
//     disablePublish()
//   }
// }

let nuxtProject = null

const onStartSuccess = () => {
  console.log('onSuccess')
  moduleOptions.value.enabled = true
  Notification.success('叶归｜在线分享功能已启动')
}
const stopPublish = () => {
  nuxtProject?.kill()
  moduleOptions.value.enabled = false
  nuxtProject = null
  publishAddr.value = ''
}


const workspacePath = window?.siyuan?.config?.system?.workspaceDir
const configBasePath = '/conf/en_publish'
const basePublishPath = `/data/plugins/sy-plugin-enhance/publish`

const entryPath = `${basePublishPath}/server/index.mjs`
const startPublishService = () => {
  try {
    if (nuxtProject) {
      nuxtProject.kill()
    }

    // 检查是否在 Electron 环境中
    if (typeof require === 'undefined') {
      console.error('Node.js require 不可用，可能不在 Electron 环境中')
      Notification.error('叶归｜在线分享功能需要 Electron 环境')
      return
    }

    const { fork } = require('node:child_process')
    const fs = require('node:fs')
    const path = require('node:path')

    const fullEntryPath = path.join(workspacePath, entryPath)
    const fullCwdPath = path.join(workspacePath, configBasePath)

    console.log('启动在线分享服务:', {
      entryPath: fullEntryPath,
      cwd: fullCwdPath,
      port: moduleOptions.value.defaultPort,
    })

    // 检查入口文件是否存在
    if (!fs.existsSync(fullEntryPath)) {
      console.error('入口文件不存在:', fullEntryPath)
      Notification.error('叶归｜在线分享服务文件不存在，请先安装')
      return
    }

    // 确保工作目录存在
    if (!fs.existsSync(fullCwdPath)) {
      console.log('创建工作目录:', fullCwdPath)
      fs.mkdirSync(fullCwdPath, { recursive: true })
    }

    // 使用 fork 启动 Node.js 进程
    nuxtProject = fork(fullEntryPath, [], {
      cwd: fullCwdPath,
      env: {
        ...process.env,
        NITRO_PORT: moduleOptions.value.defaultPort,
      },
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    })

    nuxtProject.on('error', (error) => {
      console.error('子进程启动错误:', error)
      Notification.error('叶归｜在线分享功能启动失败')
      stopPublish()
    })

    console.log('nuxtProject.value is ', nuxtProject)
    window.nuxtProject = nuxtProject

    nuxtProject.stdout.on('data', (data) => {
      console.log('子进程标准输出:', data.toString())
      if (data && data.toString().includes('Listening on ')) {
        onStartSuccess()
      }
    })

    nuxtProject.stderr.on('data', (data) => {
      console.error('子进程错误输出:', data.toString())
      if (data.toString().includes('Error: listen EADDRINUSE')) {
        Notification.error('叶归｜在线分享功能启动失败，端口已被占用')
        stopPublish()
      }
    })

    nuxtProject.on('exit', (code, signal, ...args) => {
      console.log('code is ', code, signal, ...args)
      if (code !== 0) {
        console.error(`子进程异常退出，退出码: ${code}, 信号: ${signal}`)
        stopPublish()
        Notification.error('叶归｜在线分享功能已关闭')
      }
    })

    // 监听 IPC 消息
    nuxtProject.on('message', (message) => {
      console.log('收到子进程消息:', message)
      if (message && message.type === 'ready') {
        onStartSuccess()
      }
    })

    publishAddr.value = `http://${location.hostname}:${moduleOptions.value.defaultPort}`
  } catch (error) {
    console.error('startPublishService error is ', error)
    Notification.error(`叶归｜在线分享功能启动失败: ${error.message}`)
    stopPublish()
  }
}


const configPath = `${configBasePath}/config.json`
const saveConfig = async (conf: any) => {
  const configBlob = new Blob([JSON.stringify(conf, null, 2)], {
    type: 'application/json',
  })
  await putFile(configPath, false, configBlob)
}

const pageMap = ref<Record<string, string>>({})
const newPath = ref('')
const newBlockId = ref('')

// 校验路径是否有效
const isValidPath = (path: string): boolean => {
  if (!path) {
    return false
  }

  // 标准化路径（去掉开头的 /）
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path

  // 检查是否以 api 或 resources 开头
  if (normalizedPath.startsWith('api') || normalizedPath.startsWith('resources')) {
    return false
  }

  return true
}

// 检查路径是否重复
const isPathDuplicate = (path: string, originalKey?: string): boolean => {
  // 如果是编辑现有条目，排除自身
  const existingKeys = Object.keys(pageMap.value).filter((key) => key !== originalKey)
  return existingKeys.includes(path)
}

// 获取路径校验状态
const getPathValidationStatus = (path: string): 'error' | undefined => {
  if (!path) return undefined

  if (!isValidPath(path) || isPathDuplicate(path)) {
    return 'error'
  }

  return undefined
}

// 获取路径校验错误信息
const getPathValidationError = (path: string): string => {
  if (!path) return ''

  // 标准化路径（去掉开头的 /）
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path

  if (normalizedPath.startsWith('api')) {
    return '路径不能以 api 开头（无论是否有前缀 /）'
  }

  if (normalizedPath.startsWith('resources')) {
    return '路径不能以 resources 开头（无论是否有前缀 /）'
  }

  if (isPathDuplicate(path)) {
    return '路径已存在'
  }

  return ''
}

// 检查是否可以添加新条目
const canAddNewItem = computed(() => {
  return newPath.value
    && newBlockId.value
    && isValidPath(newPath.value)
    && !isPathDuplicate(newPath.value)
})

// 处理页面映射 key 变更
const handlePageMapKeyChange = (oldKey: string, newKey: string) => {
  if (oldKey === newKey) return

  // 校验新 key
  if (!isValidPath(newKey)) {
    Notification.error('路径格式不正确')
    return
  }

  // 标准化路径（去掉开头的 /）
  const processedNewKey = newKey.startsWith('/') ? newKey.slice(1) : newKey

  if (isPathDuplicate(newKey, oldKey)) {
    Notification.error('路径已存在')
    return
  }

  // 更新 pageMap
  const value = pageMap.value[oldKey]
  delete pageMap.value[oldKey]
  pageMap.value[processedNewKey] = value

  savePageMapData()
}

// 添加新的页面映射条目
const addPageMapItem = () => {
  if (!canAddNewItem.value) {
    return
  }

  // 标准化路径（去掉开头的 /）
  const processedPath = newPath.value.startsWith('/') ? newPath.value.slice(1) : newPath.value

  console.log('addPageMapItem ', newPath.value, newBlockId.value, 'processed:', processedPath)
  pageMap.value[processedPath] = newBlockId.value

  // 清空输入框
  newPath.value = ''
  newBlockId.value = ''

  savePageMapData()
  Notification.success('页面映射已添加')
}

// 删除页面映射条目
const removePageMapItem = (key: string) => {
  delete pageMap.value[key]
  savePageMapData()
  Notification.success('页面映射已删除')
}

// 保存页面映射数据
const savePageMapData = async () => {
  try {
    await savePageMap(pageMap.value)
  } catch (error) {
    console.error('保存页面映射失败:', error)
    Notification.error('保存页面映射失败')
  }
}

// 在浏览器中打开页面
const openPageInBrowser = (key: string) => {
  if (!publishAddr.value) {
    Notification.error('在线分享服务未启动')
    return
  }

  // 如果key是home，则使用根路径
  const path = key === 'home' ? '' : key
  const url = `${publishAddr.value}/${path}`
  window.open(url, '_blank')
}

const pageMapPath = `${configBasePath}/pageMap.json`
const savePageMap = async (pageMap: any) => {
  const pageMapBlob = new Blob([JSON.stringify(pageMap, null, 2)], {
    type: 'application/json',
  })
  await putFile(pageMapPath, false, pageMapBlob)
}

const enablePublish = async () => {
  console.log('enablePublish ')
  try {
    const serviceConf = await getFile(`${basePublishPath}/nitro.json`)
    console.log('serviceConf is ', serviceConf)
    if (!serviceConf || serviceConf.code == 404) {
      Notification.error('叶归｜缺少相关内容，在线分享功能启动失败')
      stopPublish()
      return
    }

    const conf = await getFile(configPath)
    if (!conf || conf.code == 404) {
      const baseConfig = {
        base_siyuan: location.origin,
        token: window.siyuan.config.api.token,
      }
      saveConfig(baseConfig)
    }
    const pageMapRes = await getFile(pageMapPath)
    console.log('pageMapRes is ', pageMapRes)
    if (!pageMapRes || pageMapRes.code == 404) {
      savePageMap({})
    } else {
      pageMap.value = pageMapRes
    }
    console.log('pageMap is ', pageMap.value)
    startPublishService()
  } catch (error) {
    console.error('enablePublish error is ', error)
    Notification.error('叶归｜在线分享功能启动失败')
    stopPublish()
  }
}


const disablePublish = () => {
  console.log('disablePublish ', nuxtProject)
  if (!nuxtProject) {
    return
  }
  stopPublish()
  Notification.success('叶归｜在线分享功能已关闭')
}


onBeforeUnmount(() => {
  disablePublish()
})

window.addEventListener('beforeunload', () => {
  disablePublish()
})

watch(() => moduleOptions.value.enabled, () => {
  if (moduleOptions.value.enabled) {
    enablePublish()
  } else {
    disablePublish()
  }
})


const {
  validServer,
} = useValidServer()
const getPackage = async () => {
  const packagePrompt = `prompt=seeing-this-sentence-means-you-have-the-ability-to-get-the-package-plz-don-not-distribute-it`
  const publishPackageUrl = `${validServer.value}/siyuan/enhance/package/publish?${packagePrompt}`
  const packageRes = await fetch(
    publishPackageUrl,
    {
      method: 'POST',
    },
  )
  if (!packageRes.ok) {
    Notification.error('获取新版本包失败')
    return
  }

  const zipBlob = await packageRes.blob()
  const filename = 'en_publish.zip'
  const file = new File([zipBlob], filename, {
    type: 'application/zip',
  })
  await putFile(
    `/temp/install/${filename}`,
    false,
    file,
  )
  await unzip(`/temp/install/${filename}`, `/data/plugins/sy-plugin-enhance`)

  Notification.success('叶归｜在线分享功能已安装')
}
</script>

<style lang="scss" scoped>

</style>
