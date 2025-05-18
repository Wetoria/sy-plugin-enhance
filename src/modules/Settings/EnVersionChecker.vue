<template>
  <EnButtonIcon
    @click="() => checkNewUpdate()"
  >
    <icon-cloud-download />
    <template #prompt>
      检查新版本
    </template>
  </EnButtonIcon>
  <a-modal
    v-model:visible="updateModalVisible"
    title="叶归｜更新成功"
    title-align="start"
    cancelText="取消"
    :mask="false"
    okText="刷新"
    @ok="onUpdateModalOk"
  >
    <div>
      是否刷新思源重启叶归插件？
    </div>
  </a-modal>
  <a-modal
    v-model:visible="downloadPromptModalVisible"
    title="叶归｜发现新版本"
    title-align="start"
    :mask="false"
    okText="下载"
    @ok="updatePlugin"
  >
    <div>
      点击下载新版本
      <a-link @click="openUpdateHistory">
        {{ downloadPromptModalData.tag_name }}
      </a-link>（点击版本号可查看更新记录）
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import {
  getNewPackageAndUnzip,
  hasNewVersion,
} from '@/modules/Settings/Version'
import { EN_CONTENT_ANCHOR_MAP } from '@/utils/Constants'
import { Notification } from '@arco-design/web-vue'
import {
  ref
} from 'vue'


const hasNew = ref(false)
const loading = ref(false)

const updateModalVisible = ref(false)
const onUpdateModalOk = () => {
  window.location.reload()
}
const updatePlugin = async () => {
  Notification.info({
    id: 'EnDownloading',
    title: '叶归',
    content: '正在下载新版本...',
    duration: 0,
  })
  loading.value = true
  try {
    await getNewPackageAndUnzip()
    Notification.success({
      id: 'EnDownloading',
      title: '叶归',
      content: '新版本下载成功',
      duration: 2000,
    })
    updateModalVisible.value = true
  } catch (error) {
    Notification.error({
      id: 'EnDownloading',
      title: '叶归',
      content: '新版本下载失败',
      duration: 2000,
    })
  } finally {
    loading.value = false
  }
}
const downloadPromptModalVisible = ref(false)
const downloadPromptModalData = ref({
  tag_name: '',
})

const checkNewUpdate = async (mute = false) => {
  loading.value = true
  let closeNotification = () => {

  }
  if (!mute) {
    const { close } = Notification.info({
      id: 'EnCheckingUpdate',
      title: '叶归',
      content: '正在检查新版本...',
      duration: 2000,
    })
    closeNotification = close
  }
  const data = await hasNewVersion()
  closeNotification()
  loading.value = false
  hasNew.value = data.hasNew
  if (hasNew.value) {
    downloadPromptModalData.value = data.info
    if (mute) {
      Notification.info({
        title: '叶归',
        content: '发现新版本，可前往插件设置中进行更新。',
        duration: 2000,
        closable: true,
      })
    } else {
      downloadPromptModalVisible.value = true
    }
  } else {
    if (!mute) {
      Notification.success('叶归｜当前已是最新版本')
    }
  }
}
const openUpdateHistory = () => {
  window.open(EN_CONTENT_ANCHOR_MAP.update_history, '_blank')
}

// onMounted(() => {
//   checkNewUpdate(true)
// })
</script>

<style lang="scss" scoped>

</style>
