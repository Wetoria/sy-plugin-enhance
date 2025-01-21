<template>
  <EnSettingsTeleportModule
    :name="moduleOptions.moduleName"
    :display="moduleOptions.moduleDisplayName"
    :module="module"
    @moduleEnabled="onModuleEnable"
    @moduleDisabled="onModuleDisable"
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
import { request } from '@/api'
import { usePlugin } from '@/main'
import RenderControl from '@/modules/BottomBacklink/RenderControl.vue'
import { getCurrentDocTitleDomByDom } from '@/modules/DailyNote/DailyNote'
import { useModule } from '@/modules/EnModuleControl/ModuleProvide'
import EnSettingsItem from '@/modules/Settings/EnSettingsItem.vue'
import EnSettingsTeleportModule from '@/modules/Settings/EnSettingsTeleportModule.vue'
import {
  EN_CONSTANTS,
  EN_MODULE_LIST,
} from '@/utils/Constants'
import {
  Protyle,
  showMessage,
} from 'siyuan'
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

const searchParams = {
  id: '',
  k: '',
  sort: '3',
  mk: '',
  mSort: '3',
}
const insertBacklinkTOCSlash = {
  filter: [
    '插入当前反链 MOC',
    'insert current moc',
  ],
  html: `<div class="b3-list-item__first"><span class="b3-list-item__text">${'叶归｜插入当前反链 MOC'}</span></div>`,
  id: 'enInsertMocCurrent',
  callback(protyle: Protyle) {
    const titleDom = getCurrentDocTitleDomByDom(protyle.protyle.contentElement)
    if (!titleDom) {
      return
    }

    searchParams.id = titleDom.dataset.nodeId
    request('/api/ref/getBacklink2', searchParams).then((res) => {
      const {
        backlinks,
      } = res
      if (!backlinks.length) {
        showMessage('当前文档暂无反链')
        return
      }

      const insertMD = []
      backlinks.forEach((backlink) => {
        insertMD.push(`- [${backlink.name}](siyuan://blocks/${backlink.id})`)
      })
      const result = insertMD.join('\n')
      protyle.insert(result)
    })
  },
}

const onModuleEnable = () => {
  plugin.protyleSlash.push(insertBacklinkTOCSlash)
}
const onModuleDisable = () => {
  plugin.protyleSlash = plugin.protyleSlash.filter((item) => item.id !== insertBacklinkTOCSlash.id)
}
</script>

<style lang="scss" scoped>

</style>
