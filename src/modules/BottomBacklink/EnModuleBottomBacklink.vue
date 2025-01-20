<template>
  <EnSettingsTeleportModule
    :name="moduleOptions.moduleName"
    :display="moduleOptions.moduleDisplayName"
    :module="module"
  >
    <EnSettingsItem>
      <div>
        启用底部反链
      </div>
      <template #desc>
        <div>
          是否启用底部反链功能
        </div>
      </template>
      <template #opt>
        <a-switch v-model="moduleOptions.enableBottomBacklink" />
      </template>
    </EnSettingsItem>
    <EnSettingsItem mode="vertical">
      <div>
        反链区域离正文的距离
      </div>
      <template #opt>
        <a-input-number
          v-model="moduleOptions.bottomBacklinkTopDistance"
          placeholder="Bottom Backlink Top Distance"
          mode="button"
          :step="5"
          :min="30"
          :readOnly="plugin.isMobile"
        />
      </template>
    </EnSettingsItem>
    <EnSettingsItem>
      <div>
        启用反链过滤
      </div>
      <template #desc>
        <div>
          是否启用底部反链的过滤功能
        </div>
      </template>
      <template #opt>
        <a-switch v-model="moduleOptions.enableBacklinkFilter" />
      </template>
    </EnSettingsItem>
    <EnSettingsItem>
      <div>
        默认展开过滤区域
      </div>
      <template #desc>
        <div>
          是否默认展开底部反链的过滤区域。
        </div>
      </template>
      <template #opt>
        <a-switch v-model="moduleOptions.defaultShowBacklinkFilter" />
      </template>
    </EnSettingsItem>
    <EnSettingsItem mode="vertical">
      <div>
        反链筛选 SQL 查询上限
      </div>
      <template #desc>
        <div>
          与反链筛选功能有关。如果设置的太小，可能会导致数据不正确。<br />
          请输入正确的数字，否则会重置为默认的 999999999.
        </div>
      </template>
      <template #opt>
        <a-input-number
          v-model="moduleOptions.sqlLimit"
          placeholder="SQL Limit"
          mode="button"
          :min="1"
          :readOnly="plugin.isMobile"
        />
      </template>
    </EnSettingsItem>
  </EnSettingsTeleportModule>
  <template v-if="moduleOptions.enabled">
    <RenderControl />
  </template>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main'
import RenderControl from '@/modules/BottomBacklink/RenderControl.vue'
import { useModule } from '@/modules/EnModuleControl/ModuleProvide'
import EnSettingsItem from '@/modules/Settings/EnSettingsItem.vue'
import EnSettingsTeleportModule from '@/modules/Settings/EnSettingsTeleportModule.vue'
import {
  EN_CONSTANTS,
  EN_MODULE_LIST,
} from '@/utils/Constants'
import { watch } from 'vue'

const plugin = usePlugin()

const {
  module,
  moduleOptions,
} = useModule<BottomBacklinkModuleOptions>(EN_MODULE_LIST.EN_BOTTOM_BACKLINK, {
  defaultData: {
    enabled: false,
    moduleName: EN_MODULE_LIST.EN_BOTTOM_BACKLINK,
    moduleDisplayName: EN_CONSTANTS.EN_BOTTOM_BACKLINK_DISPLAY,

    enableBottomBacklink: false,
    bottomBacklinkTopDistance: 30,
    autoRenderBacklinkMap: {},

    enableBacklinkFilter: false,
    defaultShowBacklinkFilter: false,
    sqlLimit: 999999999,
    docFilterProperties: {},
    docFilterPropertiesSaved: {
    },
  },
})

watch(() => moduleOptions.value.sqlLimit, () => {
  if (!moduleOptions.value.sqlLimit) {
    moduleOptions.value.sqlLimit = module.value.defaultValue.sqlLimit
  }
}, { immediate: true })

</script>

<style lang="scss" scoped>

</style>
