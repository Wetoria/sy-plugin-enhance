<template>
  <EnModal
    id="EnVideoAndAudioModal"
    v-model:visible="modalVisible"
  >
    <template #title>
      叶归｜时间戳
    </template>
    <div
      ref="EnVideoAndAudioModalRef"
      class="EnVideoAndAudioModal"
    >
      <EnProtyle
        :blockId="currentVNAInfo.bid"
        disableEnhance
        :options="{
          action: [],
        }"
        @after-render="onAfterRender"
      />
    </div>
  </EnModal>
</template>

<script setup lang="ts">
import EnModal from '@/components/EnModal.vue'
import EnProtyle from '@/components/EnProtyle.vue'
import { usePlugin } from '@/main'
import { useModule } from '@/modules/EnModuleControl/ModuleProvide'
import {
  getEVAParamsByUrl,
  jumpToVNABlock,
  setVideoTime,
} from '@/modules/VideoAndAudio/VideoAndAudio'
import { EN_MODULE_LIST } from '@/utils/Constants'
import {
  convertSiyuanLinkIntoNormal,
  isTargetPluginType,
  URL_TYPE_MAP,
} from '@/utils/url'
import { useIntervalFn } from '@vueuse/core'
import {
  Protyle,
} from 'siyuan'
import {
  onBeforeUnmount,
  onMounted,
  ref,
  watchEffect,
} from 'vue'

const plugin = usePlugin()

const {
  moduleOptions,
} = useModule<EnModuleVideoAndAudio>(EN_MODULE_LIST.EN_VIDEO_AND_AUDIO)

const modalVisible = ref(false)

const currentVNAInfo = ref({
  bid: '',
  time: '',
})

const EnVideoAndAudioModalRef = ref<HTMLDivElement>(null)

watchEffect(() => {
  // 如果弹窗关闭，则清空当前音视频信息
  if (!modalVisible.value) {
    currentVNAInfo.value = {
      bid: '',
      time: '',
    }
  }
})

const {
  pause,
  resume: checkTargetTimeAndAutoPlay,
} = useIntervalFn(() => {
  if (!EnVideoAndAudioModalRef.value) {
    return
  }
  const videoTarget = EnVideoAndAudioModalRef.value.querySelector(`div[data-node-id="${currentVNAInfo.value.bid}"] video`)
  const audioTarget = EnVideoAndAudioModalRef.value.querySelector(`div[data-node-id="${currentVNAInfo.value.bid}"] audio`)

  const target = (videoTarget || audioTarget) as HTMLVideoElement | HTMLAudioElement

  if (!target) {
    return
  }
  pause()
  setVideoTime(currentVNAInfo.value)

  if (moduleOptions.value.autoPlay) {
    target.play()
  }

}, 300)

const hackLink = (event: MouseEvent) => {
  const target = event.target as HTMLSpanElement

  const isSpanElement = target.tagName.toLowerCase() === 'span'

  if (!isSpanElement) {
    return
  }

  if (!target.dataset.type) {
    return
  }

  const dataTypes = target.dataset.type.split(/\s+/)

  const isSyLink = dataTypes.includes('a')

  if (!isSyLink) {
    return
  }

  const href = convertSiyuanLinkIntoNormal(target.dataset.href)

  const isEVALink = isTargetPluginType(href, URL_TYPE_MAP.VideoAndAudio)

  if (!isEVALink) {
    return
  }
  event.stopImmediatePropagation()
  event.preventDefault()
  event.stopPropagation()


  const jumpMode = moduleOptions.value.jumpMode

  if (jumpMode === 'toDoc') {
    jumpToVNABlock(href)
    return
  }

  const {
    bid,
    time,
  } = getEVAParamsByUrl(href)


  if (jumpMode === 'openWindow') {


    if (plugin.isElectron) {

      // TODO 用新窗口打开

      return
    }
  }

  // 如果没有弹窗，则创建弹窗
  // 如果弹窗存在，则直接更新音视频参数
  modalVisible.value = true

  currentVNAInfo.value = {
    bid,
    time,
  }

  checkTargetTimeAndAutoPlay()
}

const onAfterRender = (protyle: Protyle) => {
  protyle.disable()

  checkTargetTimeAndAutoPlay()
}

const enable = () => {
  document.body.addEventListener('click', hackLink, true)
}

const disable = () => {
  document.body.removeEventListener('click', hackLink, true)
}

onMounted(() => {
  enable()
})
onBeforeUnmount(() => {
  disable()
})
</script>

<style lang="scss" scoped>
.EnVideoAndAudioModal {
  width: 100%;
  height: 100%;

  :deep(.protyle-content) {
    scrollbar-gutter: unset;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;

    &,
    & .protyle-wysiwyg {
      padding: 0px !important;
      overflow: hidden;
    }

    .protyle-wysiwyg {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;

      [data-type="NodeVideo"],
      [data-type="NodeAudio"] {
        display: flex;
        flex-direction: column;
        flex: 1 !important;
        width: 100%;
        height: 100%;

        box-sizing: border-box;
        overflow: hidden;
        padding-top: 20px;
        margin: unset;

        .protyle-action__drag {
          display: none;
        }

        .protyle-attr {
          transform: translateY(14px);
        }

        .iframe-content {
          display: flex;
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;

          video,
          audio {
            flex: 1;
            height: unset !important;
          }
        }
      }
    }
  }
}

</style>
