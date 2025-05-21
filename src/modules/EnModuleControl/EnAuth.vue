<template>

  <a-modal
    v-model:visible="authModalVisible"
    modal-class="en_settings_auth_modal"
  >
    <template #title>
      <div>更新订阅状态</div>
    </template>
    <div>
      <a-space
        direction="vertical"
        fill
      >
        <a-descriptions
          :data="[
            {
              label: '用户名',
              value: siyuanAccount.userName,
            },
            {
              label: '昵称',
              value: siyuanAccount.userNickname,
            },
            {
              label: 'UserId',
              value: siyuanAccount.userId,
            },
            {
              label: '当前版本',
              value: levelLabel,
            },
            {
              label: '有效期至',
              value: expiration,
            },
          ]"
          title="思源账号信息"
          :column="1"
        >
          <template #title>
            <a-typography-text
              :copyable="!!siyuanAccount.userId"
              :copy-text="JSON.stringify(siyuanAccount)"
            >
              思源账号信息
            </a-typography-text>
          </template>
        </a-descriptions>
        <a-divider orientation="center">
          更新订阅
        </a-divider>
        <a-typography-text>
          激活码 or 爱发电订单号：
        </a-typography-text>
        <a-input
          v-model="afdOrderNo"
          placeholder="在此输入"
          allow-clear
        >
        </a-input>
        <a-button
          style="width: 100%;"
          type="primary"
          :loading="loading"
          @click="updateByUser"
        >
          更新订阅状态
        </a-button>


        <a-divider orientation="center">
          其他说明
        </a-divider>
        <a-typography-text>
          1、购买订阅，请至
          <EnUsageLink part="how_to_subscribe">
            如何订阅
          </EnUsageLink>。
        </a-typography-text>
        <a-typography-text>
          2、版本升级，请至
          <EnUsageLink part="contact_author">
            联系作者
          </EnUsageLink>
          了解补差价升级。
        </a-typography-text>
      </a-space>
    </div>

    <template #footer>
      <div>
        <a-button @click="authModalVisible = false">
          取消
        </a-button>
      </div>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { request } from '@/api'
import {
  injectAuth,
  injectAuthStatus,
  injectSettings,
} from '@/modules/EnModuleControl/ModuleProvide'
import {
  EN_EVENT_BUS_KEYS,
} from '@/utils/Constants'
import { enEventBus } from '@/utils/EnEventBus'
import { Notification } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'


const authModuleData = injectAuth()
const { levelLabel } = injectAuthStatus()
const expiration = computed(() => {
  return authModuleData.value.expiration ? dayjs(authModuleData.value.expiration).format('YYYY-MM-DD HH:mm') : '--'
})

// CF 代理
const server1 = 'https://server.wetoria.vip'
// 云服务器
const server2 = 'https://api.wetoria.vip'
// IPV6 直连
const ipv6Http = 'http://api.wetoria.cn'
// IPV6 直连 HTTPS
const ipv6Https = 'https://api.wetoria.cn'

const serverList = [
  server2,
  server1,
  ipv6Https,
  ipv6Http,
]

const validServer = ref('')
const getValidServerTimeout = 5
const getValidServer = async () => {
  for (const server of serverList) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 1000 * getValidServerTimeout)

      const res = await Promise.race([
        fetch(`${server}/ping`, {
          method: 'POST',
          signal: controller.signal,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 1000 * getValidServerTimeout),
        ),
      ])

      clearTimeout(timeoutId)

      if ((res as Response)?.ok) {
        validServer.value = server
        break
      }
    } catch (err) {
      validServer.value = ''
      continue
    }
  }
}
let getValidServerFlag = null
onMounted(() => {
  getValidServer()
  getValidServerFlag = setInterval(() => {
    getValidServer()
    // 30分钟检查一次可用的服务器
  }, 1000 * 60 * 30)
})
onBeforeUnmount(() => {
  if (getValidServerFlag) {
    clearInterval(getValidServerFlag)
  }
})


const authModalVisible = ref(false)
const openAuthModal = () => {
  getSiyuanAccount()
  authModalVisible.value = true
}

// #region 👇 监听订阅窗口的开启
onMounted(() => {
  enEventBus.on(EN_EVENT_BUS_KEYS.AUTH_OPEN_MODAL, openAuthModal)
})
onBeforeUnmount(() => {
  enEventBus.off(EN_EVENT_BUS_KEYS.AUTH_OPEN_MODAL, openAuthModal)
})
// #endregion 👆 监听订阅窗口的开启

const siyuanAccount = ref({
  userId: '',
  userName: '',
  userNickname: '',
})
const getSiyuanAccount = () => {
  const {
    userId,
    userName,
    userNickname,
  } = window?.siyuan?.user || {}

  if (!userId) {
    enLog('思源账号获取失败')
    return
  }
  siyuanAccount.value = {
    userId,
    userName,
    userNickname,
  }
}
let flag = null
onMounted(() => {
  getSiyuanAccount()
  flag = setInterval(() => {
    if (siyuanAccount.value.userId) {
      clearInterval(flag)
      return
    }
    getSiyuanAccount()
  }, 1000)
})

const {
  isPermanent,
} = injectAuthStatus()
const settings = injectSettings()

const getT = () => String(Date.now()).slice(0, 10)
const recordPermanentUser = () => {
  const data = {
    userId: siyuanAccount.value.userId,
    userName: siyuanAccount.value.userName,
    userNickname: siyuanAccount.value.userNickname,
    t: `${getT()}${settings.value.v}`,
  }
  updateRequest(data, false)
}

watch(isPermanent, (newIsPermanent) => {
  if (newIsPermanent) {
    recordPermanentUser()
  }
})

const apiPath = '/siyuan/enhance/auth/update'

const afdOrderNo = ref('')
const loading = ref(false)
const updateRequest = async (data, showMessage = true) => {
  try {
    if (!validServer.value) {
      await getValidServer()
    }

    loading.value = true
    const res = await request(`${validServer.value}${apiPath}?data=${JSON.stringify(data)}`, data)
    loading.value = false
    if (!res) {
      enError('Update auth subscription error. response is empty')
      return false
    }
    if (res?.code !== 0) {
      if (showMessage) {
        Notification.error({
          content: `叶归｜${res.msg}`,
        })
      }
      return false
    }
    const respData = res.data || {} as {
      v: number
      e: string
    }
    authModuleData.value = {
      lv: respData.v,
      expiration: respData.e,
    }
    if (showMessage) {
      Notification.success({
        content: `叶归｜更新订阅状态成功. 当前版本：${levelLabel.value}. 有效期至：${expiration.value}`,
      })
    }
    return true
  } catch (err) {
    enError('update auth subscription error', err)
    return true
  }
}

const updateByUser = async () => {
  if (isPermanent.value) {
    enLog('Auth subscription update canceled, current version is permanent')
    return true
  }
  if (!siyuanAccount.value.userId) {
    enLog('Auth subscription update canceled, userId is empty')
    return
  }
  const data = {
    userId: siyuanAccount.value.userId,
    userName: siyuanAccount.value.userName,
    userNickname: siyuanAccount.value.userNickname,
    t: `${getT()}100`,
    afdOrderNo: afdOrderNo.value,
  }
  updateRequest(data, true)
}

const updateOnUserChange = () => {
  if (!siyuanAccount.value.userId) {
    // 如果没有用户 id，则不发送情况
    return
  }
  const data = {
    userId: siyuanAccount.value.userId,
    userName: siyuanAccount.value.userName,
    userNickname: siyuanAccount.value.userNickname,
    t: `${getT()}100`,
  }
  updateRequest(data, false)
}

let autoUpdateFlag = null
onMounted(() => {
  autoUpdateFlag = setInterval(() => {
    updateOnUserChange()
    // 每小时自动更新一次用户状态
  }, 1000 * 60 * 60)
})
onBeforeUnmount(() => {
  if (autoUpdateFlag) {
    clearInterval(autoUpdateFlag)
  }
})

// 用户信息变化时，重新更新订阅状态
watch(siyuanAccount, (newSiyuanAccount, oldSiyuanAccount) => {
  const userChanged = newSiyuanAccount.userId && newSiyuanAccount.userId !== oldSiyuanAccount.userId
  if (userChanged) {
    updateOnUserChange()
  }
})
</script>

<style lang="scss">
.en_settings_auth_modal {
  max-width: 90vw;
}
</style>
