<template>

  <EnSettingsTeleportModule
    v-if="settings.isDebugging"
    :name="moduleName"
    :display="moduleDisplayName"
    :module="module"
  >
    <EnSettingsItem>
      <div>
        Test1
      </div>
      <template #opt>
        <a-switch v-model="moduleOptions.test1" />
      </template>
    </EnSettingsItem>
    <EnSettingsItem>
      <div>
        Test2
      </div>
      <template #opt>
        <a-switch v-model="moduleOptions.test2" />
      </template>
    </EnSettingsItem>
  </EnSettingsTeleportModule>
</template>

<script setup lang="ts">
import EnSettingsTeleportModule from '../Settings/EnSettingsTeleportModule.vue';
import EnSettingsItem from '../Settings/EnSettingsItem.vue';
import { EnModule, useSettings } from '../Settings/EnSettings.vue';
import { onBeforeMount, onBeforeUnmount, onMounted, watchEffect } from 'vue';
import { useSettingModuleInScript } from '@/utils/SyncDataHooks';
import { watchDomChange, unWatchDomChange } from '@/utils/DOM';

onBeforeMount(async () => {
  await loadAndUpdate()
})

const test = () => {
  enLog('TestLogic test')
}

watchEffect(() => {
  if (moduleOptions.value.enabled) {
    watchDomChange(test)
  } else {
    unWatchDomChange(test)
  }
})


const settings = useSettings()
</script>

<script lang="ts">

// #region 基本的模块配置

interface ISettingModuleOptions extends EnModule {
  test1: boolean
  test2: boolean
}

const moduleConfig: ISettingModuleOptions = {
  enabled: false,
  moduleName: 'TestLogic',
  moduleDisplayName: 'Test Logic',

  test1: false,
  test2: false,
}

const {
  moduleName,
  moduleDisplayName,
  module,
  moduleOptions,
  loadAndUpdate,
} = useSettingModuleInScript<ISettingModuleOptions>(moduleConfig)

// #endregion 基本的模块配置

// 导出模块配置
export const ModuleName_TestLogic = moduleName

</script>

<style lang="scss" scoped>

</style>
