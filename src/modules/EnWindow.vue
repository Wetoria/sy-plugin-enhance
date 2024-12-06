<template>
  <Teleport
    to="body"
  >
    <div
      v-if="currentInWindow"
      class="enWindowContainer"
      :data-in-window="currentInWindow"
    >
      <div class="windowToolBarArea">
        <div
          class="windowDraggerArea"
        >

        </div>
        <div class="btns">
          <a-button
            v-if="currentInWindow"
            type="text"
            status="normal"
            @click="switchPinStatus"
          >
            <SyIcon
              v-if="pinned"
              name="iconUnpin"
              size="14"
            />
            <SyIcon
              v-else
              name="iconPin"
              size="14"
            />
          </a-button>
          <a-button
            type="text"
            @click="hideWindow"
          >
            <icon-close />
          </a-button>
        </div>
      </div>
      <div class="displayArea">
        <slot></slot>
      </div>
    </div>
  </Teleport>
</template>


<script lang="ts">
import SyIcon from '@/components/SiyuanTheme/SyIcon.vue'
import { usePlugin } from '@/main'
import { getColorStringWarn } from '@/utils/Log'
import { SyFrontendTypes } from '@/utils/Siyuan'
import {
  updateModuleDataByNamespaceWithLoadFile,
  useSyncModuleData,
} from '@/utils/SyncData'
import {
  computed,
  onMounted,
  ref,
} from 'vue'


const cannot = () => {
  const canPlatform = [SyFrontendTypes.desktop, SyFrontendTypes['desktop-window']]
  const plugin = usePlugin()
  return !canPlatform.includes(plugin.platform)
}

interface IEnWindow {
  width: number
  height: number
  x: number
  y: number
}

export const isInWindow = (title) => {
  const urlSearchParams = new URLSearchParams(location.search)
  return urlSearchParams.has('enhance') && urlSearchParams.get('enhance') === 'true'
    && urlSearchParams.has('enWindowTitle') && urlSearchParams.get('enWindowTitle') === title
}

export const createWindow = (title, queryStr?) => {
  if (cannot()) {
    return
  }
  const { BrowserWindow } = require('@electron/remote')

  const module = useSyncModuleData({
    namespace: `enWindow-${title}`,
    defaultData: {
      width: 1000,
      height: 350,
    },
    needSync: false,
  })
  enLog(`${getColorStringWarn('EnWindow created:')} ${title}`)
  enLog('', module.value)

  const moduleOptions = computed(() => module.value.data as IEnWindow)

  const {
    width = 500,
    height = 350,
    x,
    y,
  } = moduleOptions.value

  const electronWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    show: false,
    resizable: true,
    movable: true,
    frame: false,
    center: true,
    title,
    type: 'panel',
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      webviewTag: true,
      webSecurity: false,
      nativeWindowOpen: true,
    },
  })

  require("@electron/remote")
    .require("@electron/remote/main")
    .enable(electronWindow.webContents)

  electronWindow.setTitle(title)

  electronWindow.on('resize', () => {
    const size = electronWindow.getSize() // 获取新的窗口大小
    moduleOptions.value.width = size[0]
    moduleOptions.value.height = size[1]
  })

  // 监听窗口位置变化事件
  electronWindow.on('move', () => {
    const position = electronWindow.getPosition() // 获取新的窗口位置
    moduleOptions.value.x = position[0]
    moduleOptions.value.y = position[1]
  })

  electronWindow.loadURL(
    `${window.location.protocol}//${window.location.host}/stage/build/app/window.html?enhance=true&enWindowTitle=${title}&${queryStr ? `&${queryStr}` : ''}`,
  )
  return electronWindow
}

export function getWindow(title, currentInWindow = false) {
  if (cannot() && !currentInWindow) {
    return
  }
  require('@electron/remote/main').enable(window)
  const { BrowserWindow } = require('@electron/remote')
  const allWindows = BrowserWindow.getAllWindows()
  const specificWindow = allWindows.find((window) => {
    // 这里可以根据窗口的属性或其他特征来判断是否是你需要的窗口
    return window.getTitle() === title
  })
  return specificWindow
}
</script>

<script setup lang="ts">
const props = defineProps<{
  windowTitle: string
  createImmediate?: boolean
}>()

const emit = defineEmits([
])

const currentInWindow = isInWindow(props.windowTitle)

let winRef = null

const createEnWindow = () => {
  winRef = createWindow(props.windowTitle)
  return winRef
}
const getEnWinRef = () => {
  if (!winRef) {
    if (currentInWindow) {
      winRef = getWindow(props.windowTitle, currentInWindow)
    } else {
      winRef = createEnWindow()
    }
  }
  return winRef
}

const openWindow = () => {
  const win = getEnWinRef()
  win.show()
}
const hideWindow = () => {
  getEnWinRef()?.hide()
}

const pinned = ref(false)
const switchPinStatus = () => {
  pinWindow(!pinned.value)
}
const pinWindow = (value, ...args) => {
  pinned.value = value
  getEnWinRef().setAlwaysOnTop(pinned.value, ...args)
}
defineExpose({
  pinWindow,
  openWindow,
  hideWindow,
  isVisible: () => getEnWinRef().isVisible(),
  getWin: () => {
    return getEnWinRef()
  },
})

onMounted(async () => {
  if (currentInWindow) {
    document.documentElement.dataset.enWindow = "true"

    winRef = getWindow(props.windowTitle, currentInWindow)
    winRef.on('always-on-top-changed', (event, isAlwaysOnTop) => {
      pinned.value = isAlwaysOnTop
    })
  } else {
    useSyncModuleData({
      namespace: `enWindow-${props.windowTitle}`,
      defaultData: {
        width: 500,
        height: 350,
      },
      needSync: false,
    })
    await updateModuleDataByNamespaceWithLoadFile(`enWindow-${props.windowTitle}`)
    if (props.createImmediate) {
      createEnWindow()
    }
  }
})

window.addEventListener('beforeunload', () => {
  if (winRef) {
    winRef.hide()
    winRef.destroy()
  }
})
</script>

<style lang="scss">
.enWindowContainer {
  width: 500px;
  height: 300px;
  background-color: var(--b3-theme-background);
  position: fixed;
  top: 0px;
  left: 0px;
  opacity: var(--en-opacity);

  display: flex;
  flex-direction: column;
  gap: 2px;

  &[data-in-window="true"] {
    .windowDraggerArea {
      -webkit-app-region: drag;
    }
  }
  .windowToolBarArea {
    width: 100%;
    display: flex;
    justify-content: flex-end;

    .windowDraggerArea {
      flex: 1;
    }

    .btns {
      display: flex;
      box-sizing: border-box;

      .arco-btn {
        color: var(--b3-toolbar-color);

        &:hover {
          background-color: var(--b3-toolbar-hover);
          color: var(--b3-theme-on-background);
        }
      }

    }

  }

  .displayArea {
    flex: 1;
    display: flex;
    max-height: 100%;
  }
}
</style>

<style lang="scss">
html[data-en-window="true"] {
  .toolbar__window,
  #status {
    display: none;
  }

  .enWindowContainer {
    width: 100vw;
    height: 100vh;
  }
}
</style>
