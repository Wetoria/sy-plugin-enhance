<template>

  <a-drawer
    class="enSettingDrawer"
    :visible="editingSettings"
    :unmountOnClose="false"
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
        v-for="(refItem, index) of settingRefKeysSorted"
        :key="refItem"
      >
        <div
          :ref="(el) => settingsRefMap[refItem] = el"
          :data-ref-name="refItem"
        >
        </div>
        <EnDivider v-if="index != settingRefKeysSorted.length - 1" />
      </template>
      <a-button
        size="mini"
        status="danger"
        @click="resetAllModule"
      >
        重置所有配置
      </a-button>
    </div>

    <template #footer>
      <div class="enSettingsFooter">
        <span>
          <span>作者：</span>
          <a href="https://wetoria.me">Wetoria</a>
        </span>
        <span>
          使用说明：
          <a href="https://simplest-frontend.feishu.cn/docx/B3NndXHi7oLLXJxnxQmcczRsnse">{{plugin.version ? `v${plugin.version}` : ''}}</a>
        </span>
      </div>
    </template>
  </a-drawer>
</template>

<script setup lang="ts">
import EnDivider from '@/components/EnDivider.vue';
import { usePlugin } from '@/main';
import { computed, ref, watchEffect, watch, onMounted, ComputedRef, Ref } from 'vue';
import AnyTouch from 'any-touch';
import { moduleEnableStatusSwitcher } from '@/utils';
import { onCountClick } from '@/utils/DOM';
import { EnSyncModuleData, EnSyncModuleDataRef, getModuleRefByNamespace, updateModuleDataByNamespaceWithLoadFile, useSyncModuleData } from '@/utils/SyncData';
import { getColorStringError } from '@/utils/Log';
import { flushModuleConfigs } from '@/modules/Settings/ModuleConfigs';

const plugin = usePlugin()


const onTitleClicked = onCountClick((count) => {
  if (count >= 10) {
    settings.value.isDebugging = !settings.value.isDebugging
  }
})

watchEffect(() => {
  moduleEnableStatusSwitcher('EnDebugging', settings.value.isDebugging)
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

const resetAllModule = () => {
  const moduleValues = Object.keys(settings.value.modules)
  moduleValues.forEach((moduleName) => {
    const moduleRef = getModuleRefByNamespace(moduleName)
    resetModuleOptions(moduleRef)
  })
}

const onDrawerCLose = () => {

}

onMounted(() => {
  flushModuleConfigs()

  plugin.addCommand({
    langKey: "openEnhanceSettings",
    langText: "打开设置",
    hotkey: "",
    callback: () => {
      switchSettingsDisplay();
    },
  });
})
</script>

<script lang="ts">
interface EnSettings {
  isDebugging: boolean
  v: 0 | 1 | 2
  l: 0 | 1 | 2

  boxId: string;

  modules: {
    [module: string]: boolean
  }
}

const defaultSettings: EnSettings = {
  isDebugging: false,
  v: 0,
  l: 0,

  boxId: '',

  modules: {},
}

const namespace = 'EnSettings'

const syncSettings = useSyncModuleData({
  namespace,
  defaultData: defaultSettings,
})
const settings = computed(() => syncSettings.value.data)


const STORAGE_KEY = 'SyEnhancerSettings'

export function useSettings() {
  return settings
}

export const switchID = (time) => {
  let v = settings.value.v
  if (11 <= time && time < 20) {
    v = v > 0 ? 0 : 1
  } else if (time >= 20) {
    v = 2
  }
  settings.value.l = settings.value.v
  settings.value.v = v
}
export const isFree = computed(() => settings.value.v === 0)
export const isPro = computed(() => settings.value.v === 1)
export const isVip = computed(() => settings.value.v === 2)
export const isNotFree = computed(() => settings.value.v >= 1)

watchEffect(() => {
  console.log('flag is ', isFree.value, isPro.value, isVip.value, isNotFree.value)
})

/**
 * 模块接口
 *
 * @field enabled - 模块是否启用
 * @field moduleName - 模块名称，用于标识模块，不可修改
 * @field moduleDisplayName - 模块在设置界面显示的名称，不可修改
 */
export interface EnModule {
  enabled: boolean
  readonly moduleName: string
  readonly moduleDisplayName: string
  sort?: number
}

export interface EnModuleOptions<T extends EnModule> {
  defaultData: T
}

export interface EnSettingModule<T extends EnModule>
  extends EnSyncModuleData<T>
{

}
export interface EnSettingModuleRef<T extends EnModule>
  extends EnSyncModuleDataRef<T>
{

}


export function useSettingModule<T extends EnModule>(
  moduleName: string,
  moduleOptions: EnModuleOptions<T> = {} as EnModuleOptions<T>,
): EnSettingModuleRef<T> {
  const {
    defaultData,
  } = moduleOptions

  const module: EnSettingModuleRef<T> = useSyncModuleData<T>({
    namespace: moduleName,
    defaultData,
  })

  // const recorded = settings.value.modules[moduleName]
  // if (!recorded) {
  // }

  return module
}

export function resetModuleOptions<T>(aModule: EnSyncModuleDataRef<T>) {
  aModule.value.data = JSON.parse(JSON.stringify(aModule.value.defaultValue))
}

export interface EnSettingModuleDataRef<T extends EnModule> extends ComputedRef<T> {
}

export function useSettingModuleData<T extends EnModule>(moduleName: string): EnSettingModuleDataRef<T> {
  const module = getModuleRefByNamespace<T>(moduleName)
  const moduleData = computed(() => module.value.data)
  return moduleData
}

export async function loadSettings() {
  useSyncModuleData({
    namespace,
    defaultData: defaultSettings,
  })
  await updateModuleDataByNamespaceWithLoadFile(namespace)

}

const editingSettings = ref(false);

const settingRefKeys = ref<string[]>([])
const settingsRefMap = ref({})

const settingRefKeysSorted = computed(() => {
  const moduleKeys = settingRefKeys.value
  enLog(getColorStringError('moduleKeys is'), moduleKeys)

  moduleKeys.sort((a, b) => {
    const aModule = getModuleRefByNamespace<EnModule>(a)
    const bModule = getModuleRefByNamespace<EnModule>(b)
    return (aModule.value.data.sort || 999) - (bModule.value.data.sort || 999)
  })

  return moduleKeys
})

export function registerSettingRef(refName: string) {
  const registered = settingRefKeys.value.includes(refName)
  let settingRef = settingsRefMap.value[refName]
  if (!registered) {
    settingRef = ref()
    settingRefKeys.value.push(refName)
    settingsRefMap.value[refName] = settingRef
  }

  enSuccess('Setting Ref Registered', refName)
  return settingRef
}

export function unregisterSettingRef(refName: string) {
  settingRefKeys.value = settingRefKeys.value.filter((key) => {
    if (key === refName) {
      return
    }
    return true
  })
  enSuccess('Setting Ref Unregistered', refName)
}

const switchSettingsDisplay = () => {
  if (editingSettings.value) {
    closeSettings()
  } else {
    openSettings()
  }
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

  watch(() => settings.value.v, () => {
    const lastEnabled = settings.value.l >= 1
    const enabled = settings.value.v >= 1
    if (lastEnabled === enabled) {
      return
    }
    onChange(enabled)
    if (enabled) {
      onEnabled()
    } else {
      onDisabled()
    }
  }, {
    immediate: true,
  })
}

</script>

<style lang="scss" scoped>
.SyEnhancerDialogTitle {
  font-weight: bold;
  font-size: 1.18em;
  color: rgb(var(--primary-6));
}
.en_settings_list {
}

.enSettingsFooter {
  display: flex;
  align-items: center;
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
