<template>
  <EnSettingsTeleportModule
    :name="moduleName"
    :display="moduleDisplayName"
    :module="module"
  >
    <EnSettingsItem mode="vertical">
      <div>
        嵌入白板最小高度
      </div>
      <template #desc>
        <div>
          在文档中嵌入白板的最小高度。
        </div>
      </template>
      <template #opt>
        <a-input-number class="input-demo" placeholder="Please Enter" mode="button"
          :readOnly="plugin.isMobile"
          v-model="moduleOptions.embedBlockMinHeight" />
      </template>
    </EnSettingsItem>
  </EnSettingsTeleportModule>

  <template v-if="moduleOptions.enabled">
    <EnWhiteBoardEntrySlash />
    <template
      v-for="item in wbEmbedBlockDomTargetList"
      :key="item.whiteBoardId + '|' + item.nodeId"
    >
      <EnWhiteBoardRenderEmbed :data="item" />
    </template>
  </template>
</template>

<script lang="ts">
export interface EnWhiteBoardConfig {
  id: string
  name: string
  embedOptions: {
    // key 嵌入的思源 nodeId
    [key: string]: {
      // 嵌入的白板高度
      height: number
    }
  }
}

const defaultWhiteBoardConfig: EnWhiteBoardConfig = {
  id: '',
  name: '',
  embedOptions: {},
}

export interface EnWhiteBoardIndexMap {
  [key: string]: {
    // 方便后续新增加相关字段
    whiteBoardId: string
    whiteBoardName: string
  }
}

export interface EnWhiteBoardBlockDomTarget {
  whiteBoardId: string
  nodeId: string
  domRef: HTMLElement
  getDom: () => HTMLElement
}

let loadedData = false
export const Module_EnWhiteBoardIndexMap = 'EnWhiteBoardIndexMap'
const whiteBoardIndexMap = useSyncModuleData<EnWhiteBoardIndexMap>({
  namespace: Module_EnWhiteBoardIndexMap,
  defaultData: {},
})
watchEffect(() => {
  Object.keys(whiteBoardIndexMap.value.data).forEach(whiteBoardId => {
    if (!whiteBoardConfigList.value.data[whiteBoardId]) {
      whiteBoardConfigList.value.data[whiteBoardId] = createWhiteBoardConfig({
        whiteBoardId,
        whiteBoardName: whiteBoardIndexMap.value.data[whiteBoardId].whiteBoardName,
      })
    }
  })
})

export const Module_EnWhiteBoardConfigList = 'EnWhiteBoardConfigList'
export const whiteBoardConfigList = useSyncModuleData<{
  [id: string]: EnWhiteBoardConfig
}>({
  namespace: Module_EnWhiteBoardConfigList,
  defaultData: {},
})

export function generateWhiteBoardId() {
  const shortUUID = generateShortUUID()
  return `en-whiteboard-id-${shortUUID}`
}

// TODO 获取白板的逻辑
export function getWhiteBoardListBySearchValue(searchValue: string) {
  const testData = Object.values(whiteBoardIndexMap.value.data)

  return testData.filter(item => {
    const included = item.whiteBoardName.includes(searchValue) || item.whiteBoardId.includes(searchValue)
    return included
  })
}

function createWhiteBoardConfig({
  whiteBoardId,
  whiteBoardName,
}: {
  whiteBoardId: string
  whiteBoardName: string
}) {
  const newConfig = JSON.parse(JSON.stringify(defaultWhiteBoardConfig))
  newConfig.id = whiteBoardId
  newConfig.name = whiteBoardName
  return newConfig
}

// TODO 新增白板
export function createWhiteBoard({
  whiteBoardId,
  whiteBoardName,
}: {
  whiteBoardId: string
  whiteBoardName: string
}) {
  whiteBoardIndexMap.value.data[whiteBoardId] = {
    whiteBoardId,
    whiteBoardName,
  }
  whiteBoardConfigList.value.data[whiteBoardId] = createWhiteBoardConfig({
    whiteBoardId,
    whiteBoardName,
  })
}

export const EnWhiteBoard = 'EnWhiteBoard'
export interface EnWhiteBoardSetting extends EnModule {
  embedBlockMinHeight: number
}
</script>

<script setup lang="ts">
import { updateModuleDataByNamespaceWithLoadFile, useSyncModuleData } from '@/utils/SyncData';
import EnWhiteBoardEntrySlash from './EnWhiteBoardEntrySlash.vue';
import { useSettingModuleInSetup } from '@/utils/SyncDataHooks';
import { EnModule } from '../Settings/EnSettings.vue';
import EnSettingsTeleportModule from '../Settings/EnSettingsTeleportModule.vue';
import EnSettingsItem from '../Settings/EnSettingsItem.vue';
import { onMounted, ref, watchEffect } from 'vue';
import { debounce, generateShortUUID } from '@/utils';
import { queryAllByDom, unWatchDomChange, watchDomChange } from '@/utils/DOM';
import EnWhiteBoardRenderEmbed from './EnWhiteBoardRenderEmbed.vue';
import { getColorStringWarn } from '@/utils/Log';
import { usePlugin } from '@/main';

const plugin = usePlugin()

// #region 基本的模块配置

interface ISettingModuleOptions extends EnModule, EnWhiteBoardSetting {
}

const moduleConfig: ISettingModuleOptions = {
  enabled: false,
  moduleName: EnWhiteBoard,
  moduleDisplayName: '白板',

  embedBlockMinHeight: 200,
}

const {
  moduleName,
  moduleDisplayName,
  module,
  moduleOptions,
} = useSettingModuleInSetup<ISettingModuleOptions>(moduleConfig)

// #endregion 基本的模块配置

onMounted(async () => {
  await updateModuleDataByNamespaceWithLoadFile(Module_EnWhiteBoardIndexMap)
})

const wbEmbedBlockDomTargetList = ref<Array<EnWhiteBoardBlockDomTarget>>([])

const recordBlockDomNeedRenderWhiteBoard = debounce(() => {
  const targetList = queryAllByDom(document.body, '[custom-en-ref-whiteboard-id]')

  const isSameLength = targetList.length === wbEmbedBlockDomTargetList.value.length
  const isSameDom = targetList.every(target => {
    const targetDom = target as HTMLElement
    return wbEmbedBlockDomTargetList.value.some(item => item.getDom() === targetDom)
  })

  if (isSameLength && isSameDom) {
    enLog(`${getColorStringWarn('Record Block Dom Need Render White Board: ')} White Board Target don't change`)
    return
  }

  // 清空不存在的
  wbEmbedBlockDomTargetList.value = wbEmbedBlockDomTargetList.value.filter(item => {
    const target = item.getDom()
    return targetList.includes(target)
  })

  targetList.forEach((target: HTMLElement) => {
    const whiteBoardId = target.getAttribute('custom-en-ref-whiteboard-id')
    const nodeId = target.dataset.nodeId
    const whiteBoardItem = wbEmbedBlockDomTargetList.value.find(item => item.domRef === target)
    if (!whiteBoardItem) {
      wbEmbedBlockDomTargetList.value.push({
        whiteBoardId,
        nodeId,
        domRef: target as HTMLElement,
        getDom: () => target as HTMLElement,
      })
    }
  })
}, 100)

const watchBlockNeedRenderWhiteBoard = () => {
  watchDomChange(recordBlockDomNeedRenderWhiteBoard)
}

const unwatchBlockNeedRenderWhiteBoard = () => {
  unWatchDomChange(recordBlockDomNeedRenderWhiteBoard)
}

watchEffect(() => {
  if (moduleOptions.value.enabled) {
    watchBlockNeedRenderWhiteBoard()

    if (!loadedData) {
      loadedData = true
      updateModuleDataByNamespaceWithLoadFile(Module_EnWhiteBoardIndexMap)
      updateModuleDataByNamespaceWithLoadFile(Module_EnWhiteBoardConfigList)
    }
  } else {
    unwatchBlockNeedRenderWhiteBoard()
  }
})
</script>

<style lang="scss" scoped>

</style>
