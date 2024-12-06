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
        <SyIcon name="iconVIP" />
        <span>勇士</span>
      </a-space>
    </a-tag>
    <a-tag
      v-else
      color="arcoblue"
      style="cursor: pointer;"
      @click="openAuthModal"
    >
      {{ level }}
    </a-tag>
  </template>
  <a-modal
    v-model:visible="authModalVisible"
    ok-text="更新订阅"
    :on-before-ok="onUpdateAuthSubscription"
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
              value: level,
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
          具体步骤
        </a-divider>
        <a-typography-text type="primary">
          一、使用爱发电自行完成订阅
        </a-typography-text>
        <a-typography-text>
          插件支持在爱发电购买授权。
          购买后，按照以下步骤进行操作，即可完成订阅状态的更新。
        </a-typography-text>
        <a-typography-text>
          1、点击上方按钮<icon-copy /> 复制思源账号信息
        </a-typography-text>
        <a-typography-text>
          2、前往<a href="https://afdian.com/item/f906479eafc411efa26352540025c377">爱发电</a>购买，购买时，在留言中粘贴你的思源账号信息
        </a-typography-text>
        <a-typography-text>
          <a href="https://ifdian.net/order/create?product_type=1&plan_id=f906479eafc411efa26352540025c377&sku=%5B%7B%22sku_id%22%3A%22f90dd522afc411ef9ba052540025c377%22%2C%22count%22%3A1%7D%5D&viokrz_ex=0">Lv.1 订阅直通车</a>
        </a-typography-text>
        <a-typography-text>
          <a href="https://ifdian.net/order/create?product_type=1&plan_id=f906479eafc411efa26352540025c377&sku=%5B%7B%22sku_id%22%3A%22f915377cafc411ef99fe52540025c377%22%2C%22count%22%3A1%7D%5D&viokrz_ex=0">Lv.2 订阅直通车</a>
        </a-typography-text>
        <a-typography-text>
          3、在下方输入爱发电订单号
        </a-typography-text>
        <a-input
          v-model="afdOrderNo"
          placeholder="在此输入爱发电订单号"
          allow-clear
        >
          <template #prefix>
            爱发电订单号：
          </template>
        </a-input>
        <a-typography-text>
          4、点击下方更新按钮刷新订阅状态
        </a-typography-text>
        <a-typography-text type="primary">
          二、联系作者授权
        </a-typography-text>
        <a-typography-text>
          对于不希望使用爱发电购买授权的用户，可以<a href="https://simplest-frontend.feishu.cn/wiki/wikcnHmIs4HagSlJPiti2VESQEh#share-GT12dWEr9opouaxYW6wcpkiGn6c">点击此处联系作者</a>进行订阅。
        </a-typography-text>
        <a-divider orientation="center">
          其他说明
        </a-divider>
        <a-typography-text>
          如果已经订阅了低版本，想升级，请<a href="https://simplest-frontend.feishu.cn/wiki/wikcnHmIs4HagSlJPiti2VESQEh#share-GT12dWEr9opouaxYW6wcpkiGn6c">点击此处联系作者</a>了解补差价升级。
        </a-typography-text>
      </a-space>
      <!-- <a-typography-paragraph copyable>
        Click the icon to copy this text.
      </a-typography-paragraph> -->
    </div>
  </a-modal>
</template>

<script lang="ts">
import { request } from '@/api'
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

const level = computed(() => {
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
        content: `Enhance｜更新订阅状态成功. 当前版本：${level.value}. 有效期至：${expiration.value}`,
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

<style lang="scss" scoped>

</style>
