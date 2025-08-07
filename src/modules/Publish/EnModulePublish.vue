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
const baseCwdPath = '/conf/en_publish'
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
    const fullCwdPath = path.join(workspacePath, baseCwdPath)

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
        NITRO_BASE: fullCwdPath,
        NODE_ENV: 'production',
        // 确保模块解析使用 Node 模式
        ELECTRON_RUN_AS_NODE: '1',
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


const configPath = `${baseCwdPath}/configs/siyuan.json`
const saveConfig = async (conf: any) => {
  const configBlob = new Blob([JSON.stringify(conf, null, 2)], {
    type: 'application/json',
  })
  await putFile(configPath, false, configBlob)
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


    // 每次启动，以当前思源信息写入 config
    const baseConfig = {
      base_siyuan: location.origin,
      token: window.siyuan.config.api.token,
      setByEnPlugin: true,
    }
    saveConfig(baseConfig)

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
  Notification.info('叶归｜正在获取新版本包...')
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
