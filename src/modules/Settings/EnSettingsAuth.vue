<template>
  <a-button
    v-if="!settings.v && !authModuleData.lv"
    type="primary"
    @click="openAuthModal"
  >
    订阅
  </a-button>
  <template v-else>
    <a-tag
      v-if="isPermanent"
      color="gold"
    >
      <a-space>
        <EnIconDragon />
      </a-space>
    </a-tag>
    <a-tag
      v-else
      color="arcoblue"
      style="cursor: pointer;"
      @click="openAuthModal"
    >
      {{ levelLabel }}
    </a-tag>
  </template>
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
          @click="updateAuthSubscription"
        >
          更新订阅状态
        </a-button>


        <a-divider orientation="center">
          其他说明
        </a-divider>
        <a-typography-text>
          1、购买订阅，请至 <a href="https://simplest-frontend.feishu.cn/docx/B3NndXHi7oLLXJxnxQmcczRsnse#share-I2LpdCzwYohOsbx8KgpcJXtCnQc">如何订阅</a>。
        </a-typography-text>
        <a-typography-text>
          2、版本升级，请至 <a href="https://simplest-frontend.feishu.cn/wiki/wikcnHmIs4HagSlJPiti2VESQEh#share-GT12dWEr9opouaxYW6wcpkiGn6c">联系作者</a> 了解补差价升级。
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

<script lang="ts">
import { request } from '@/api'
import EnIconDragon from '@/components/EnIconDragon.vue'
import { useSyncModuleData } from '@/utils/SyncData'
import { Notification } from '@arco-design/web-vue'
import dayjs from 'dayjs'
import {
  computed,
  onMounted,
  ref,
  watch,
} from 'vue'
import { useSettings } from './EnSettings.vue'

interface EnAuth {
  lv: number
  expiration: string | number | null
}

const authModule = useSyncModuleData<EnAuth>({
  namespace: 'EnSettingsAuth',
  defaultData: {
    lv: 0,
    expiration: null,
  },
  needSave: false,
})

export const authModuleData = computed(() => {
  return authModule.value.data
})

export const lv = (level: number) => {
  const settings = useSettings()
  return authModuleData.value.lv >= level || settings.value.v >= 1
}

export const useAuthLevel = (level: number | string) => {
  const settings = useSettings()
  const hasAuth = computed(() => {
    return !level || authModuleData.value.lv >= Number(level) || settings.value.v >= 1
  })
  return hasAuth
}
</script>

<script setup lang="ts">


const settings = useSettings()

const isPermanent = computed(() => {
  return settings.value.v && settings.value.v >= 1
})

const authModalVisible = ref(false)
const openAuthModal = () => {
  getSiyuanAccount()
  authModalVisible.value = true
}

const levelLabel = computed(() => {
  const map = {
    0: '普通版',
    98: 'Inner',
    99: 'Super',
  }
  return map[authModuleData.value.lv] || (authModuleData.value.lv ? `Lv. ${authModuleData.value.lv}` : '--')
})
const expiration = computed(() => {
  return authModuleData.value.expiration ? dayjs(authModuleData.value.expiration).format('YYYY-MM-DD HH:mm') : '--'
})

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
  flag = setTimeout(() => {
    if (siyuanAccount.value.userId) {
      clearTimeout(flag)
      return
    }
    getSiyuanAccount()
  }, 1000)
})

const afdOrderNo = ref('')
const updateAuthSubscription = async (showMessage = true) => {
  if (isPermanent.value) {
    enLog('Auth subscription update canceled, current version is permanent')
    return true
  }
  if (!siyuanAccount.value.userId) {
    enLog('Auth subscription update canceled, userId is empty')
    if (showMessage) {
      Notification.error({
        content: `Enhance｜请先登录思源`,
      })
    }
    return
  }
  // TODO 发起请求更新订阅状态
  try {
    const data = {
      userId: siyuanAccount.value.userId,
      userName: siyuanAccount.value.userName,
      userNickname: siyuanAccount.value.userNickname,
      afdOrderNo: afdOrderNo.value,
    }
    const res = await request(`https://api.wetoria.vip/siyuan/enhance/auth/update?data=${JSON.stringify(data)}`, data)

    if (!res) {
      enError('Update auth subscription error. response is empty')
      return false
    }
    if (res?.code !== 0) {
      if (showMessage) {
        Notification.error({
          content: `Enhance｜${res.msg}`,
        })
      }
      return false
    }
    const respData = res.data || {} as {
      v: number
      e: string
    }
    authModule.value.data = {
      lv: respData.v,
      expiration: respData.e,
    }
    if (showMessage) {
      Notification.success({
        content: `Enhance｜更新订阅状态成功. 当前版本：${levelLabel.value}. 有效期至：${expiration.value}`,
      })
    }
    return true
  } catch (err) {
    enError('update auth subscription error', err)
    return true
  }
}

watch(siyuanAccount, (newValue, oldValue) => {
  const userChanged = newValue.userId !== oldValue.userId
  if (userChanged) {
    updateAuthSubscription(false)
  }
})

const onUpdateAuthSubscription = async () => {
  await updateAuthSubscription()
  return false
}
</script>

<style lang="scss">
.en_settings_auth_modal {
  max-width: 90vw;
}
</style>
