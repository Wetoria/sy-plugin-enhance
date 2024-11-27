<template>
  <EnSettingsTeleportModule
    :name="moduleName"
    :display="moduleDisplayName"
    :module="module"
  >
  </EnSettingsTeleportModule>

  <EnWhiteBoardEntrySlash v-if="moduleOptions.enabled" />
</template>

<script lang="ts">
export interface EnWhiteBoardIndexMap {
  [key: string]: {
    whiteBoardId: string
    whiteBoardName: string
  }
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
import { onMounted } from 'vue';
import { generateShortUUID } from '@/utils';

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

</script>

<style lang="scss" scoped>

</style>
