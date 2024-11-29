<template>
  <EnSettingsTeleportModule
    :name="moduleName"
    :display="moduleDisplayName"
    :module="module"
  >
  </EnSettingsTeleportModule>

  <template v-if="moduleOptions.enabled">
    <EnWhiteBoardEntrySlash />
    <template
      v-for="item in wbBlockDomTargetList"
      :key="item.whiteBoardId + '|' + item.nodeId"
    >
      <EnWhiteBoardRender :data="item" />
    </template>
  </template>
</template>

<script lang="ts">
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

const Module_EnWhiteBoardIndexMap = 'enWhiteBoardIndexMap'
const whiteBoardIndexMap = useSyncModuleData<EnWhiteBoardIndexMap>({
  namespace: Module_EnWhiteBoardIndexMap,
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
}
</script>

<script setup lang="ts">
import { updateModuleDataByNamespaceWithLoadFile, useSyncModuleData } from '@/utils/SyncData';
import EnWhiteBoardEntrySlash from './EnWhiteBoardEntrySlash.vue';
import { useSettingModuleInSetup } from '@/utils/SyncDataHooks';
import { EnModule } from '../Settings/EnSettings.vue';
import EnSettingsTeleportModule from '../Settings/EnSettingsTeleportModule.vue';
import { onMounted, ref, watchEffect } from 'vue';
import { debounce, generateShortUUID } from '@/utils';
import { queryAllByDom, unWatchDomChange, watchDomChange } from '@/utils/DOM';
import EnWhiteBoardRender from './EnWhiteBoardRender.vue';
import { getColorStringWarn } from '@/utils/Log';

// #region 基本的模块配置

interface ISettingModuleOptions extends EnModule {
}

const moduleConfig: ISettingModuleOptions = {
  enabled: false,
  moduleName: 'EnWhiteBoard',
  moduleDisplayName: '白板',
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

const wbBlockDomTargetList = ref<Array<EnWhiteBoardBlockDomTarget>>([])

const recordBlockDomNeedRenderWhiteBoard = debounce(() => {
  const targetList = queryAllByDom(document.body, '[custom-en-ref-whiteboard-id]')

  const isSameLength = targetList.length === wbBlockDomTargetList.value.length
  const isSameDom = targetList.every(target => {
    const targetDom = target as HTMLElement
    return wbBlockDomTargetList.value.some(item => item.getDom() === targetDom)
  })

  if (isSameLength && isSameDom) {
    enLog(`${getColorStringWarn('Record Block Dom Need Render White Board: ')} White Board Target don't change`)
    return
  }

  // 清空不存在的
  wbBlockDomTargetList.value = wbBlockDomTargetList.value.filter(item => {
    const target = item.getDom()
    return targetList.includes(target)
  })

  targetList.forEach((target: HTMLElement) => {
    const whiteBoardId = target.getAttribute('custom-en-ref-whiteboard-id')
    const nodeId = target.dataset.nodeId
    const whiteBoardItem = wbBlockDomTargetList.value.find(item => item.domRef === target)
    if (!whiteBoardItem) {
      wbBlockDomTargetList.value.push({
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
  } else {
    unwatchBlockNeedRenderWhiteBoard()
  }
})
</script>

<style lang="scss" scoped>

</style>
