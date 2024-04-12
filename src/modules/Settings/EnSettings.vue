<template>

  <a-drawer
    class="enSettingDrawer"
    :visible="editingSettings"
    :unmountOnClose="true"
    :drawer-style="{
      maxHeight: '90vh',
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
          作者：
          <a href="https://wetoria.me">Wetoria</a>
        </span>
      </div>
    </template>
  </a-drawer>
</template>

<script setup lang="ts">
import EnDivider from '@/components/EnDivider.vue';
import { usePlugin } from '@/main';
import { computed, ref, watchEffect, watch } from 'vue';
import AnyTouch from 'any-touch';
import { debounce } from '@/utils';

const plugin = usePlugin()

const settings = useSettings()

const clickNum = ref(0)
let flag
const onTitleClicked = () => {
  clickNum.value += 1
  clearTimeout(flag)
  if (clickNum.value >= 5) {
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
</script>

<script lang="ts">

export interface EnModuleType {
  enabled: boolean
  options: object
  defaultOptions: object
}

interface EnSettings {
  isDebugging: boolean
  useVipStyle: boolean;
  boxId: string;


  mobileSwitchDocMode: 'doc' | 'dailyNote';

  enableBottomBacklink: boolean;
  enableBacklinkFilter: boolean;
  defaultShowBacklinkFilter: boolean;
  sqlLimit: number;

  lifelogPostUrl: string;
  lifelogEnableBlockTag: boolean;
  lifelogTriggerTime: number;


  enableFixedDocArea: boolean;
  fixedDocIds: string[];


  modules: {
    [module: string]: EnModuleType
  }
}

const defaultSettings: EnSettings = {
  isDebugging: false,

  useVipStyle: true,
  boxId: '',
  sqlLimit: 999999999,

  mobileSwitchDocMode: 'doc',
  enableBottomBacklink: true,
  enableBacklinkFilter: true,

  defaultShowBacklinkFilter: false,

  lifelogPostUrl: '',
  lifelogEnableBlockTag: true,
  lifelogTriggerTime: 5,

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

export function useModule(moduleName: string, defaultOptions: object) {
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

/**
 * 修正设置中，错误的值
 */
function reviseSettingsValue() {
  if (isNaN(settings.value.sqlLimit)) {
    settings.value.sqlLimit = defaultSettings.sqlLimit
  }
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
  const newRef = ref()
  settingsRefMap.value[refName] = newRef
  return newRef
}

export const openSettings = () => {
  editingSettings.value = true;
}

export const closeSettings = () => {
  editingSettings.value = false;
}

export const switchState = (key, value) => {
  document.documentElement.dataset[key] = `${value}`
}
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
