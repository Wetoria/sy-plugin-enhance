<template>
  <Teleport
    v-if="dialogContainerRef"
    :to="dialogContainerRef"
  >
    <EnProtyle
      :blockId="currentVNAInfo.bid"
      disableEnhance
      :options="{
        action: [],
      }"
      @after-render="onAfterRender"
    />
  </Teleport>
</template>

<script setup lang="ts">
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
import {
  Dialog,
  Protyle,
  showMessage,
} from 'siyuan'
import {
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'

const plugin = usePlugin()

const {
  moduleOptions,
} = useModule<EnModuleVideoAndAudio>(EN_MODULE_LIST.EN_VIDEO_AND_AUDIO)


const syDialogRef = ref<Dialog | null>(null)
const dialogContainerRef = ref<HTMLDivElement | null>(null)
const currentVNAInfo = ref({
  bid: '',
  time: '',
})

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
  if (!syDialogRef.value) {
    syDialogRef.value = new Dialog({
      transparent: true,
      width: '520px',
      height: '300px',
      title: '叶归｜时间戳',
      content: `<div class="EnVNADialogContainer"></div>`,
      destroyCallback() {
        syDialogRef.value = null
        dialogContainerRef.value = null
        currentVNAInfo.value = {
          bid: '',
          time: '',
        }
      },
    })

    if (!syDialogRef.value) {
      showMessage('叶归｜时间戳弹窗创建失败')
      return
    }
    syDialogRef.value?.element?.classList.add('EnVNADialog')
    const container = syDialogRef.value?.element?.querySelector('.EnVNADialogContainer') as HTMLDivElement
    dialogContainerRef.value = container
  }


  currentVNAInfo.value = {
    bid,
    time,
  }
  setVideoTime(currentVNAInfo.value)
}

const onAfterRender = (protyle: Protyle) => {
  protyle.disable()

  let flag
  const checkTargetTime = () => {
    const videoTarget = protyle.protyle.element.querySelector('video')
    const audioTarget = protyle.protyle.element.querySelector('audio')

    const target = videoTarget || audioTarget

    if (!target) {
      return
    }
    clearInterval(flag)
    setVideoTime(currentVNAInfo.value)
  }

  checkTargetTime()
  flag = setInterval(() => {
    checkTargetTime()
  }, 300)
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

<style lang="scss">
.EnVNADialog {

  .b3-dialog {
    pointer-events: none;
  }
  .b3-dialog__container {
    pointer-events: auto;
  }
  .b3-dialog__scrim {
    display: none;
  }

  .b3-dialog__header {
    padding: 4px 12px;
  }
  .b3-dialog__body {
    padding: 4px;
    overflow: hidden;

    .EnVNADialogContainer {
      flex: 1;
      overflow: hidden;

      .protyle-content,
      .protyle-wysiwyg {
        padding: 0px !important;
        overflow: hidden;
      }

      .protyle-content {
        scrollbar-gutter: unset;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;

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
  }
}
</style>
