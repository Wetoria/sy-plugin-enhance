<template>

</template>

<script setup lang="ts">
import { usePlugin } from '@/main';
import { debounce } from '@/utils';
import { queryAllByDom } from '@/utils/DOM';
import { Protyle, showMessage } from 'siyuan';
import { useProWatcher } from './Settings/EnSettings.vue';

const plugin = usePlugin()

let currentSiyuanNode: HTMLElement = null

let currentTarget: HTMLVideoElement | HTMLAudioElement = null

const toggleCurrentNodeClass = (node, status) => {
  if (!node) return
  node.classList.toggle('enCurrentVideoNode', status)
}

const recordCurrentSiyuanNode = (node) => {
  const lastSiyuanNode = currentSiyuanNode
  toggleCurrentNodeClass(lastSiyuanNode, false)
  currentSiyuanNode = node
  toggleCurrentNodeClass(currentSiyuanNode, true)
}

const recordVideoAndAudio = (video: HTMLVideoElement | HTMLAudioElement) => {
  if (!('enred' in video.dataset)) {
    video.addEventListener('play', () => {
      currentTarget = video
      let parent = video.parentElement
      while (parent) {
        parent = parent.parentElement
        if (isTargetSiyuanNode(parent.dataset.type)) {
          break
        }
      }
      if (parent) {
        recordCurrentSiyuanNode(parent)
      }
    })
    video.dataset.enred = ''
  }
}

const handler = () => {
  const videos = queryAllByDom(document.body, `video`)
  const audios = queryAllByDom(document.body, `audio`)

  videos.forEach((item) => {
    recordVideoAndAudio(item as HTMLVideoElement)
  })
  audios.forEach((item) => {
    recordVideoAndAudio(item as HTMLAudioElement)
  })
}


const basePluginUrl = 'siyuan://plugins/sy-plugin-enhance'
const typeMap = {
  NodeVideo: 'v',
  NodeAudio: 'a',
}
const getVideoTimeLink = (videoNode, siyuanVideoNode) => {
  const time = videoNode.currentTime
  const blockId = siyuanVideoNode.dataset.nodeId
  const type = typeMap[siyuanVideoNode.dataset.type]
  const link = `${basePluginUrl}?t=${time}&bid=${blockId}&type=${type}`
  return {
    time,
    blockId,
    link,
    type,
  }
}

const getCurrentVideoTimeLink = () => {
  if (!currentTarget) {
    showMessage('请先播放视频或音频')
    return
  }
  const {
    link
  } = getVideoTimeLink(currentTarget, currentSiyuanNode)
  return link
}

const getCurrentVideoTimeLinkMd = () => {
  if (!currentTarget) {
    showMessage('请先播放视频或音频')
    return
  }
  const {
    time,
    link,
  } = getVideoTimeLink(currentTarget, currentSiyuanNode)
  // const time = currentVideo.currentTime
  const hour = Math.floor(time / 60 / 60)
  const min = Math.floor(time / 60)
  const second = Math.floor(time % 60)
  const result = `[${hour}:${min}:${second}](${link})`
  return result
}

const copyCurrentVideoTimeLink = async () => {
  const link = getCurrentVideoTimeLink()
  try {
    await navigator.clipboard.writeText(link)
    showMessage('已复制当前视频/音频的时间戳链接')
  } catch(err) {
    console.error(err)
  }
}
const copyCurrentVideoTimeLinkMD = async () => {
  const link = getCurrentVideoTimeLinkMd()
  try {
    await navigator.clipboard.writeText(link)
    showMessage('已复制当前视频/音频的时间戳(Markdown)链接')
  } catch(err) {
    console.error(err)
  }
}

const pinOrUnpinVideo = (pin) => {
  if (pin) {
    document.documentElement.dataset.envp = ''
  } else {
    delete document.documentElement.dataset.envp
  }
}

const isTargetSiyuanNode = (type) => ['NodeVideo', 'NodeAudio'].includes(type)

const onOpenContextMenu = ({ detail }) => {
  const plugin = usePlugin()
  const {
    blockElements
  } = detail
  if (blockElements.length != 1) {
    return
  }
  const element = blockElements[0]
  const isTargetType = isTargetSiyuanNode(element.dataset.type)
  if (!isTargetType) {
    return
  }

  const pinned = 'envp' in document.documentElement.dataset
  detail.menu.addItem({
    icon: "iconVideo",
    label: plugin.i18n.displayName,
    submenu: [
      {
        icon: pinned ? 'iconUnpin' : 'iconPin',
        label: pinned ? plugin.i18n.unpinVideo : plugin.i18n.pinVideo,
        click: () => {
          const video = element.querySelector('video')
          const audio = element.querySelector('audio')
          if (video || audio) {
            currentTarget = video || audio
            recordCurrentSiyuanNode(element)
          }
          pinOrUnpinVideo(!pinned)
        },
      },
      {
        icon: 'iconLink',
        label: plugin.i18n.copyVideoTimestamp,
        click: () => {
          const video = element.querySelector('video')
          const audio = element.querySelector('audio')
          if (video || audio) {
            currentTarget = video || audio
            recordCurrentSiyuanNode(element)
          }
          copyCurrentVideoTimeLink()
        },
      },
      {
        icon: 'iconMarkdown',
        label: plugin.i18n.copyVideoTimestampMarkdown,
        click: () => {
          const video = element.querySelector('video')
          const audio = element.querySelector('audio')
          if (video || audio) {
            currentTarget = video || audio
            recordCurrentSiyuanNode(element)
          }
          copyCurrentVideoTimeLinkMD()
        },
      },
    ],
  });
}

const onOpenUrlScheme = (event) => {
  const plugin = usePlugin()
  const { url } = event.detail
  const urlObj = new URL(url)
  const urlSP = urlObj.searchParams
  const time = urlSP.get('t')
  const bid = urlSP.get('bid')
  const type = urlSP.get('type') || 'v'
  const nodeType = Object.keys(typeMap).find(key => typeMap[key] === type)
  if (!bid || !time) {
    return
  }
  window.openFileByURL(`siyuan://blocks/${bid}`)
  let flag
  const setVideoTime = () => {
    const node = document.body.querySelector(`div[data-type="${nodeType}"][data-node-id="${bid}"]`)

    if (!node) {
      return
    }
    if (flag) {
      clearInterval(flag)
    }
    const videoNode = node.querySelector('video')
    const audioNode = node.querySelector('audio')
    if (!videoNode && !audioNode) {
      return
    }

    const validTimeStrReg = /^(\d+(\.\d+)?(:\d+(\.\d+)?)?(:\d+(\.\d+)?)?)$/
    const isValidTimeStr = validTimeStrReg.test(time)

    if (!isValidTimeStr) {
      showMessage('时间格式有误，将不会设置视频时间。（只支持 0、0.00、0:0、0:0.00、0:0:0、0:0:0.00 格式）')
      return
    }

    const parts = time.split('.')
    const msPart = parts[1] || 0
    const hmsParts = parts[0].split(':').reverse()
    const secondPart = Number(hmsParts[0] || 0)
    const minutePart = Number(hmsParts[1] || 0)
    const hourPart = Number(hmsParts[2] || 0)

    const currentTimeValue = `${(hourPart * 60 + minutePart) * 60 + secondPart}.${msPart}`

    if (videoNode) {
      videoNode.currentTime = Number(currentTimeValue)
    }
    if (audioNode) {
      audioNode.currentTime = Number(currentTimeValue)
    }
  }
  plugin.eventBus.once('loaded-protyle-static', setVideoTime)
  flag = setInterval(() => {
    setVideoTime()
  }, 100)
}


const protyleSlashList = [
  {
    filter: [
      "add current video/audio timestamp",
      '插入当前视频/音频的时间戳',
      "insert current video/audio timestamp",
      'ivt',
      'avt',
      'aat',
      'charu',
    ],
    html: `<div class="b3-list-item__first"><span class="b3-list-item__text">${'插入当前视频/音频的时间戳（Markdown）'}</span><span class="b3-list-item__meta">🎥</span></div>`,
    id: "insertCurrentVideoOrAudioTimestamp",
    callback(protyle: Protyle) {
      const timestamp = getCurrentVideoTimeLinkMd()
      protyle.insert(timestamp);
    }
  },
]

const commands = [
  {
    langKey: "enPinVideoAndAudio",
    langText: '切换当前视频/音频的钉住状态',
    hotkey: "",
    callback: () => {
      const pinned = 'envp' in document.documentElement.dataset
      pinOrUnpinVideo(!pinned)
    },
  },
]
const observer = new MutationObserver(debounce(handler, 100));
const enable = () => {
  handler()
  observer.observe(document.body, {
    childList: true, // 观察目标子节点的变化，是否有添加或者删除
    subtree: true, // 观察后代节点，默认为 false
  })

  commands.forEach((command) => {
    plugin.addCommand(command);
  })

  plugin.protyleSlash.push(...protyleSlashList)

  plugin.eventBus.on('click-blockicon', onOpenContextMenu)
  plugin.eventBus.on('open-siyuan-url-plugin', onOpenUrlScheme)
}

const disable = () => {
  observer.disconnect()
  plugin.protyleSlash = plugin.protyleSlash.filter(i => !protyleSlashList.find(j => j != i))
  plugin.commands = plugin.commands.filter(i => !commands.find(j => j != i))
  plugin.eventBus.off('click-blockicon', onOpenContextMenu)
  plugin.eventBus.off('open-siyuan-url-plugin', onOpenUrlScheme)
}

useProWatcher({
  onEnabled: () => {
    enable()
  },
  onDisabled: () => {
    disable()
  },
})
</script>

<style lang="scss">
html[data-envp] {
  [data-type="NodeVideo"],
  [data-type="NodeAudio"] {
    &.enCurrentVideoNode {
      position: sticky;
      top: 0;
      z-index: 3;
    }
  }
}

</style>
