<template>

  <EnSettingsTeleportModule
    v-if="settings.isDebugging"
    :name="moduleOptions.moduleName"
    :display="moduleOptions.moduleDisplayName"
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
import EnSettingsTeleportModule from '../../modules/Settings/EnSettingsTeleportModule.vue';
import EnSettingsItem from '../../modules/Settings/EnSettingsItem.vue';
import { EnModule, useSettings } from '../Settings/EnSettings.vue';
import { watchEffect } from 'vue';
import { useModule } from '@/modules/EnModuleControl/ModuleProvide'

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
</script>

<script lang="ts">

// #region 基本的模块配置

interface ISettingModuleOptions extends EnModule {
  test1: boolean
  test2: boolean
}

const {
  module,
  moduleOptions,
} = useModule<ISettingModuleOptions>('TestLogic', {
  defaultData: {
    enabled: false,
    moduleName: 'TestLogic',
    moduleDisplayName: 'Test Logic',

    test1: false,
    test2: false,
  },
})
// #endregion 基本的模块配置

// 导出模块配置
export const ModuleName_TestLogic = moduleOptions.value.moduleName

</script>

<style lang="scss" scoped>
</style>
