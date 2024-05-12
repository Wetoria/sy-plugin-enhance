<template>
  <Teleport
    to="body"
  >
    <div
      class="enWindowContainer flexColumn"
      :data-in-window="isInWindow"
      v-if="isInWindow"
    >
      <div class="windowToolBarArea">
        <div
          class="windowDraggerArea"
        >

        </div>
        <div class="btns">
          <div
            class="toolBarItem" @click="switchPinStatus"
            v-if="isInWindow"
          >
            <SyIcon v-if="pinned" name="iconUnpin" size="16" />
            <SyIcon v-else name="iconPin" size="16" />
          </div>
          <div
            class="toolBarItem"
            @click="hideWindow"
          >
            <icon-close class="closeIcon" />
          </div>
        </div>
      </div>
      <div class="displayArea">
        <slot></slot>
      </div>
    </div>
  </Teleport>
</template>


<script setup lang="ts">
import SyIcon from '@/components/SiyuanTheme/SyIcon.vue'
import { usePlugin } from '@/main'
import { SyFrontendTypes } from '@/utils/Siyuan'
import { computed, onMounted, ref } from 'vue'
import { useModule } from './Settings/EnSettings.vue'

const props = defineProps<{
  visible: boolean;
  inWindow: boolean;
  windowTitle: string;
  createImmediate?: boolean;
}>()

const emit = defineEmits([
  'update:visible',
  'update:inWindow',
])

const enWindowKey = `enWindow-${props.windowTitle}`

const urlSearchParams = new URLSearchParams(location.search)
const isInWindow = urlSearchParams.has('enhance') && urlSearchParams.get('enhance') === 'true'
  && urlSearchParams.has('enWindowTitle') && urlSearchParams.get('enWindowTitle') === props.windowTitle

let winRef = null

const createEnWindow = () => {
  winRef = createWindow(props.windowTitle)
  return winRef
}
const getEnWinRef = () => {
  if (!winRef) {
    if (isInWindow) {
      winRef = getWindow(props.windowTitle, isInWindow)
    } else {
      winRef = createEnWindow()
    }
  }
  return winRef
}

const saveInitData = () => {
  localStorage.setItem(enWindowKey, JSON.stringify({
    pinned: pinned.value,
  }))
}

const loadInitData = () => {
  const str = localStorage.getItem(enWindowKey)
  try {
    const obj = JSON.parse(str)
    updateDataByStorage(obj)
  } catch(err) {}
}
const updateDataByStorage = (obj) => {
  pinned.value = obj.pinned
  emit('update:visible', obj.visible)
}
onMounted(() => {
  // addEventListener('storage', (event) => {
  //   if (event.key === enWindowKey) {
  //     const obj = JSON.parse(event.newValue)
  //     updateDataByStorage(obj)
  //   }
  // })
})

const openWindow = () => {
  saveInitData()
  const win = getEnWinRef()
  win.show()
  emit('update:visible', true)
}

const hideWindow = () => {
  getEnWinRef()?.hide()
  emit('update:visible', false)
}

const switchWindowVisible = (pin: boolean) => {
  const win = getEnWinRef()
  if (win.isVisible()) {
    hideWindow()
  } else {
    win.setAlwaysOnTop(pin)
    openWindow()
  }
}


window.addEventListener('beforeunload', () => {
  if (winRef) {
    winRef.hide()
    winRef.destroy()
  }
})

const pinned = ref(false)
const switchPinStatus = () => {
  pinWindow(!pinned.value)
}
const pinWindow = (value) => {
  pinned.value = value
  getEnWinRef().setAlwaysOnTop(pinned.value)
}
defineExpose({
  pinWindow,
  openWindow,
  hideWindow,
  switchWindowVisible,
  isVisible: () => getEnWinRef().isVisible(),
  getWin: () => {
    return getEnWinRef()
  }
});

onMounted(() => {
  if (isInWindow) {
    document.documentElement.dataset.enWindow = "true"

    winRef = getWindow(props.windowTitle, isInWindow)
    emit('update:inWindow', isInWindow)
    loadInitData()
  } else {
    if (props.createImmediate) {
      createEnWindow()
    }
  }
})
</script>

<script lang="ts">

const cannot = () => {
  const canPlatform = [SyFrontendTypes.desktop, SyFrontendTypes['desktop-window']]
  const plugin = usePlugin()
  return !canPlatform.includes(plugin.platform)
}

interface IEnWindow {
  width: number;
  height: number;
  x: number;
  y: number;
}

export const createWindow = (title, queryStr?) => {
  if (cannot()) {
    return
  }
  const { BrowserWindow } = require('@electron/remote')

  const module = useModule(`enWindow-${title}`, {
    width: 1000,
    height: 350,
  })
  const moduleOptions = computed(() => module.value.options as IEnWindow)

  const {
    width = 1000,
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
    title: title,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      webviewTag: true,
      webSecurity: false,
      nativeWindowOpen: true,
    }
  })

  require("@electron/remote")
      .require("@electron/remote/main")
      .enable(electronWindow.webContents);

  electronWindow.setTitle(title)

  electronWindow.on('resize', () => {
    const size = electronWindow.getSize(); // 获取新的窗口大小
    moduleOptions.value.width = size[0]
    moduleOptions.value.height = size[1]
  });

  // 监听窗口位置变化事件
  electronWindow.on('move', () => {
    const position = electronWindow.getPosition(); // 获取新的窗口位置
    moduleOptions.value.x = position[0]
    moduleOptions.value.y = position[1]
  });

  electronWindow.loadURL(
    `${window.location.protocol}//${window.location.host}/stage/build/app/window.html?enhance=true&enWindowTitle=${title}&${queryStr ? `&${queryStr}` : ''}`
  )
  return electronWindow
}

export function getWindow(title, isInWindow = false) {
  if (cannot() && !isInWindow) {
    return
  }
  require('@electron/remote/main').enable(window);
  const { BrowserWindow } = require('@electron/remote');
  const allWindows = BrowserWindow.getAllWindows();
  const specificWindow = allWindows.find(window => {
    // 这里可以根据窗口的属性或其他特征来判断是否是你需要的窗口
    return window.getTitle() === title;
  });
  return specificWindow
}

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
      padding: 12px;
      gap: var(--en-gap);

      .toolBarItem {
        width: 24px;
        height: 24px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;

        .arco-icon,
        .enSyIcon {
          color: var(--b3-toolbar-color);
          font-size: 16px;
        }

        &:hover {
          background-color: var(--b3-toolbar-hover);

          .arco-icon,
          .enSyIcon {
            color: var(--b3-theme-on-background);
            font-size: 16px;
          }
        }
      }
    }

  }

  .displayArea {
    flex: 1;
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
