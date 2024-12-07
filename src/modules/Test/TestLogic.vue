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

  <!-- <EnProtyleCustomArea
    :getTargetBlockDom="getTargetBlockDom"
    v-if="settings.isDebugging"
  >
    <div style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
      <EnProtyle
        blockId="20241126120630-4zr5xtq"
      />
    </div>
  </EnProtyleCustomArea> -->
</template>

<script setup lang="ts">
import EnSettingsTeleportModule from '../Settings/EnSettingsTeleportModule.vue';
import EnSettingsItem from '../Settings/EnSettingsItem.vue';
import { EnModule, useSettings } from '../Settings/EnSettings.vue';
import { onBeforeMount, onBeforeUnmount, onMounted, watchEffect } from 'vue';
import { useSettingModuleInScript } from '@/utils/SyncDataHooks';
import { watchDomChange, unWatchDomChange } from '@/utils/DOM';
import EnProtyleCustomArea from '@/components/EnProtyleCustomArea.vue';
import EnProtyle from '@/components/EnProtyle.vue';
import { EN_MODULE_LIST } from '@/utils/Constants'
import { useModule } from '@/modules/EnModuleControl/ModuleDataProvide.vue'
onBeforeMount(async () => {
  await loadAndUpdate()
})

const test = () => {
  enLog('TestLogic test')
}

watchEffect(() => {
  if (moduleOptions.value.enabled) {
  } else {
  }
})


const settings = useSettings()

const getTargetBlockDom = () => {
  // const dom = document.body.querySelector('[data-type="NodeParagraph"][data-node-id="20241125202123-7uoztlc"]')
  const dom = document.body.querySelector('[data-type="NodeHTMLBlock"][data-node-id="20241126034926-o2u9s2v"]')
  return dom as HTMLElement
}

onMounted(() => {
  console.log('test logic onmouted')
})
const testModule1 = useModule<{
  test1: boolean
  test2: boolean
} & EnModule>(EN_MODULE_LIST.EN_TEST_LOGIC)
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
