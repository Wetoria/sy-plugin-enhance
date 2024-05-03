<template>

  <a-drawer
    class="enSettingDrawer"
    :visible="editingSettings"
    :unmountOnClose="true"
    :drawer-style="{
      maxHeight: '80vh',
      height: 'unset',
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px',
    }"
    height="unset"
    placement="bottom"
    @cancel="closeSettings"
    @open="onDrawerOpen"
    @close="onDrawerCLose"
  >
    <template #title>
      <div class="SyEnhancerDialogTitle" @click="onTitleClicked">
        {{plugin.i18n.pluginName}}
      </div>
    </template>

    <div class="flexColumn en_settings_list">
      <template
        v-for="(refItem, index) of settingRefKeys"
      >
        <div
          :ref="(el) => settingsRefMap[refItem] = el"
          :data-ref-name="refItem"
        >
        </div>
        <EnDivider v-if="index != settingRefKeys.length - 1" />
      </template>
    </div>

    <template #footer>
      <div class="enSettingsFooter">
        <span>
          使用说明：
          <a href="https://simplest-frontend.feishu.cn/docx/B3NndXHi7oLLXJxnxQmcczRsnse">{{plugin.version ? `v${plugin.version}` : ''}}</a>
        </span>
        <span>
          <span>作者：</span>
          <a href="https://wetoria.me">Wetoria</a>
        </span>
      </div>
    </template>
  </a-drawer>
</template>

<script setup lang="ts">
import EnDivider from '@/components/EnDivider.vue';
import { usePlugin } from '@/main';
import { computed, ref, watchEffect, watch, onMounted, onBeforeUnmount } from 'vue';
import AnyTouch from 'any-touch';
import { debounce } from '@/utils';
import { onCountClick } from '@/utils/DOM';

const plugin = usePlugin()

const settings = useSettings()

const clickNum = ref(0)
let flag
const onTitleClicked = () => {
  clickNum.value += 1
  clearTimeout(flag)
  if (clickNum.value >= 10) {
    settings.value.isDebugging = !settings.value.isDebugging
  }
  flag = setTimeout(() => {
    clickNum.value = 0
  }, 1000)
}

watchEffect(() => {
  switchState('enDebugging', settings.value.isDebugging)
})

const getSettingDrawer = () => document.querySelector('.arco-drawer') as HTMLDivElement

const onDrawerOpen = () => {
  const el: HTMLDivElement = document.querySelector('.enSettingDrawer');
  const settingDom = getSettingDrawer()
  if (!el || !settingDom) {
    return
  }

  const at = new AnyTouch(el, {
    preventDefault: false,
  });
  const drawerBody: HTMLDivElement = el.querySelector('.arco-drawer-body')

  const drawerBodyScrollTopOnStart = ref(0)
  at.on('panstart', () => {
    drawerBodyScrollTopOnStart.value = drawerBody.scrollTop
  })
  at.on('pan', (e) => {
    if (!settingDom) {
      return
    }

    if (drawerBody.scrollTop > 0) {
      return
    }

    const dis = e.displacementY - drawerBodyScrollTopOnStart.value
    const movableDis = dis > 0 ? dis : 0
    settingDom.style.transform = `translateY(${movableDis}px)`
  });
  at.on('panend', (e) => {
    if (!settingDom) {
      return
    }

    const dis = e.displacementY - drawerBodyScrollTopOnStart.value
    if (dis > 200) {
      settingDom.style.transform = `translateY(100%)`
      editingSettings.value = false
    } else {
      settingDom.style.transform = 'unset'
    }
  })
}

const onDrawerCLose = () => {

}

const loadSettingsOnWS = ({ detail }) => {
  if (detail.cmd === 'backgroundtask') {
    loadSettingsWithoutSave()
  }
}
const loadSettingsOnSyncEnd = () => {
  loadSettingsWithoutSave()
}

onMounted(() => {
  const plugin = usePlugin()
  // plugin.eventBus.on('ws-main', loadSettingsOnWS)
  // plugin.eventBus.on('sync-end', loadSettingsOnSyncEnd)
})
onBeforeUnmount(() => {
  // plugin.eventBus.off('ws-main', loadSettingsOnWS)
  // plugin.eventBus.off('sync-end', loadSettingsOnSyncEnd)
})
</script>

<script lang="ts">

export interface EnModuleType {
  enabled: boolean
  options: object
  defaultOptions: object
}

interface EnSettings {
  isDebugging: boolean
  v: 0 | 1 | 2

  boxId: string;

  enableFixedDocArea: boolean;
  fixedDocIds: string[];


  modules: {
    [module: string]: EnModuleType
  }
}

const defaultSettings: EnSettings = {
  isDebugging: false,
  v: 0,

  boxId: '',

  enableFixedDocArea: true,
  fixedDocIds: [],

  modules: {},
}

let doNotSave = false
let settings = ref<EnSettings>({
  modules: {},
} as EnSettings)
watch(settings, () => {
  if (doNotSave) {
    doNotSave = false
    return
  }
  saveSettings()
}, {
  deep: true,
})

let STORAGE_KEY = 'SyEnhancerSettings'

export function useSettings() {
  return settings
}

export const switchID = (time) => {
  let v = settings.value.v
  if (11 <= time && time <= 20) {
    v += 1
  } else if (time > 20) {
    v += 2
  }
  settings.value.v = v % 3 as 0 | 1 | 2
}

export function useModule(moduleName: string, defaultOptions: object = {}) {
  const module = ref<EnModuleType>(settings.value.modules[moduleName])

  if (!module.value) {
    module.value = registerModule(moduleName, defaultOptions)
  }
  // 刷一次 options，防止新增参数不生效
  const options = module.value.options
  module.value.options = {
    ...defaultOptions,
    ...options,
  }
  // 刷一次默认值设置，防止出现问题
  // 比如 module 的数据已经保存过了，但是更新了代码。
  module.value.defaultOptions = {
    ...module.value.defaultOptions,
    ...defaultOptions,
  }
  return module
}

export function useModuleOptions(moduleName: string) {
  const module = useModule(moduleName)
  return module.value.options
}

function registerModule(module: string, defaultOptions: object) {
  const isInSetting = module in settings.value.modules
  const newModule = {
    enabled: false,
    options: defaultOptions,
    defaultOptions: defaultOptions,
  }
  if (!isInSetting) {
    settings.value.modules[module] = newModule
  }
  return newModule
}

export async function loadSettings() {
  const plugin = usePlugin()
  const res = await plugin.loadData(STORAGE_KEY)
  if (res) {
    settings.value = Object.assign({}, defaultSettings, settings.value, res)
  } else {
    settings.value = Object.assign({}, JSON.parse(JSON.stringify(defaultSettings)), settings.value)
  }
  if (!settings.value.modules) {
    settings.value.modules = {}
  }
}

const loadSettingsWithoutSave = () => {
  doNotSave = true
  loadSettings()
}

/**
 * 修正设置中，错误的值
 */
function reviseSettingsValue() {

}

const saveSettings = debounce(()=> {
  const plugin = usePlugin()

  // 保存前对值进行校验和修正。
  reviseSettingsValue()

  const info = JSON.stringify(settings.value);
  plugin.saveData(STORAGE_KEY, info)
  localStorage.setItem(STORAGE_KEY, info)
})

export const syncLocalStorage = (event) => {
  if (event.key === STORAGE_KEY) {
    const newSettings = JSON.parse(event.newValue)
    doNotSave = true
    settings.value = newSettings
  }
}

const editingSettings = ref(false);

const settingsRefMap = ref({})
const settingRefKeys = computed(() => Object.keys(settingsRefMap.value))

export function registerSettingRef(refName: string) {
  let settingRef = settingsRefMap.value[refName]
  if (!settingRef) {
    settingRef = ref()
    settingsRefMap.value[refName] = settingRef
  }
  return settingRef
}

export const openSettings = () => {
  editingSettings.value = true;
}

export const entryOpenSettings = onCountClick((time) => {
  if (time >= 11) {
    switchID(time)
  } else {
    openSettings()
  }
})

export const closeSettings = () => {
  editingSettings.value = false;
}

export const switchState = (key, value) => {
  document.documentElement.dataset[key] = `${value}`
}

let eventListOfPro: Array<(isPro: boolean) => void> = []
export const watchProEnable = (callback) => {
  eventListOfPro.push(callback)
  callback(settings.value.v >= 1)
}
export const unwatchProEnable = (callback)  => {
  eventListOfPro = eventListOfPro.filter(i => i != callback)
}

export const useProWatcher = (props: {
  onChange?: (enabled: boolean) => void,
  onEnabled?: () => void,
  onDisabled?: () => void,
}) => {
  const {
    onChange = () => {},
    onEnabled = () => {},
    onDisabled = () => {},
  } = props
  watchProEnable((enabled) => {
    onChange(enabled)
    if (enabled) {
      onEnabled()
    } else {
      onDisabled()
    }
  })
}

watchEffect(() => {
  const enbaled = settings.value.v >= 1
  eventListOfPro.forEach((cb) => {
    cb(enbaled)
  })
})
</script>

<style lang="scss" scoped>
.en_settings_list {
}

.enSettingsFooter {
  display: flex;
  justify-content: flex-end;
  gap: var(--en-gap);
}
</style>

<style lang="scss">
.enSettingDrawer {
  .arco-drawer-body {
    overscroll-behavior: none;
  }
}
</style>
