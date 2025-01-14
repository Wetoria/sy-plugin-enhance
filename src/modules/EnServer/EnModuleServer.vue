<template>
  <EnSettingsTeleportModule
    :name="moduleOptions.moduleName"
    :display="moduleOptions.moduleDisplayName"
    :module="module"
    @moduleEnabled="handleModuleEnabled"
    @moduleDisabled="handleModuleDisabled"
  >
    <EnSettingsItem mode="vertical">
      <div>
        默认端口
      </div>
      <template #desc>
        默认端口，用于 API 服务
      </template>
      <template #opt>
        <a-input-number
          v-model="moduleOptions.defaultPort"
          class="input-demo"
          placeholder="Please Enter"
          mode="button"
          :readOnly="plugin.isMobile"
          :step="1"
          @change="handleChange"
        />
      </template>
    </EnSettingsItem>
  </EnSettingsTeleportModule>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main'
import { useModule } from '@/modules/EnModuleControl/ModuleProvide'
import { EnModule } from '@/modules/Settings/EnSettings.vue'
import EnSettingsItem from '@/modules/Settings/EnSettingsItem.vue'
import EnSettingsTeleportModule from '@/modules/Settings/EnSettingsTeleportModule.vue'
import {
  EN_CONSTANTS,
  EN_MODULE_LIST,
} from '@/utils/Constants'
import { nextTick } from 'vue'



const plugin = usePlugin()

const {
  module,
  moduleOptions,
} = useModule<{
  defaultPort: number
} & EnModule>(EN_MODULE_LIST.EN_SERVER, {
  defaultData: {
    enabled: false,
    moduleName: EN_CONSTANTS.EN_SERVER,
    moduleDisplayName: EN_CONSTANTS.EN_SERVER_DISPLAY,

    defaultPort: 6868,
  },
})

const handleChange = () => {
  console.log('moduleOptions.value.defaultPort is ', moduleOptions.value.defaultPort)
  if (!moduleOptions.value.defaultPort) {
    nextTick(() => {
      moduleOptions.value.defaultPort = 6868
    })
  }
}

const handleModuleEnabled = () => {
  console.log('handleModuleEnabled')
}

const handleModuleDisabled = () => {
  console.log('handleModuleDisabled')
}
</script>

<style lang="scss" scoped>

</style>
