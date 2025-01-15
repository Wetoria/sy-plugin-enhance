<template>
  <EnSettingsTeleportModule
    :name="moduleTamplatesName"
    :display="moduleTemplatesDisplayName"
    :module="module"
  >
    <EnSettingsItem>
      <div>
        康奈尔颜色
      </div>
    </EnSettingsItem>
    <EnSettingsItem>
      <div>
        笔记区
      </div>
      <template #desc>
        <div>
          设置康奈尔模板笔记区的颜色
        </div>
      </template>
      <template #opt>
        <a-space>
          背景
          <EnColorPicker
            v-model="moduleOptions.cornell.noteBgColor"
            type="bgColor"
            defaultIndex="2"
          />
          标题
          <EnColorPicker
            v-model="moduleOptions.cornell.noteTitleColor"
            type="color"
            defaultIndex="2"
          />
          字体
          <EnColorPicker
            v-model="moduleOptions.cornell.noteFontColor"
            type="color"
          />
        </a-space>
      </template>
    </EnSettingsItem>
    <EnSettingsItem>
      <div>
        线索区
      </div>
      <template #desc>
        <div>
          设置康奈尔模板线索区的颜色
        </div>
      </template>
      <template #opt>
        <a-space>
          背景
          <EnColorPicker
            v-model="moduleOptions.cornell.clueBgColor"
            type="bgColor"
            defaultIndex="10"
          />
          标题
          <EnColorPicker
            v-model="moduleOptions.cornell.clueTitleColor"
            type="color"
            defaultIndex="10"
          />
          字体
          <EnColorPicker
            v-model="moduleOptions.cornell.clueFontColor"
            type="color"
          />
        </a-space>
      </template>
    </EnSettingsItem>
    <EnSettingsItem>
      <div>
        总结区
      </div>
      <template #desc>
        <div>
          设置康奈尔模板总结区的颜色
        </div>
      </template>
      <template #opt>
        <a-space>
          背景
          <EnColorPicker
            v-model="moduleOptions.cornell.summaryBgColor"
            type="bgColor"
            defaultIndex="12"
          />
          标题
          <EnColorPicker
            v-model="moduleOptions.cornell.summaryTitleColor"
            type="color"
            defaultIndex="12"
          />
          字体
          <EnColorPicker
            v-model="moduleOptions.cornell.summaryFontColor"
            type="color"
          />
        </a-space>
      </template>
    </EnSettingsItem>
  </EnSettingsTeleportModule>
  <TemplateCornell />
</template>

<script setup lang="ts">
import EnColorPicker from '@/components/EnColorPicker.vue'
import { useModule } from '@/modules/EnModuleControl/ModuleProvide'
import EnSettingsItem from '@/modules/Settings/EnSettingsItem.vue'
import EnSettingsTeleportModule from '@/modules/Settings/EnSettingsTeleportModule.vue'
import {
  EN_CONSTANTS,
  EN_MODULE_LIST,
} from '@/utils/Constants'
import TemplateCornell from './TemplateCornell.vue'


</script>

<script lang="ts">

// #region 基本的模块配置

interface ISettingModuleOptions extends EnModule {
  cornell: {
    noteTitleColor: string
    noteBgColor: string
    noteFontColor: string

    clueTitleColor: string
    clueBgColor: string
    clueFontColor: string

    summaryTitleColor: string
    summaryBgColor: string
    summaryFontColor: string
  }
}

const {
  module,
  moduleOptions,
} = useModule<ISettingModuleOptions>(EN_MODULE_LIST.EN_TEMPLATES, {
  defaultData: {
    enabled: false,
    moduleName: EN_MODULE_LIST.EN_TEMPLATES,
    moduleDisplayName: EN_CONSTANTS.EN_TEMPLATES_DISPLAY,

    cornell: {
      noteTitleColor: '',
      noteBgColor: '',
      noteFontColor: '',

      clueTitleColor: '',
      clueBgColor: '',
      clueFontColor: '',

      summaryTitleColor: '',
      summaryBgColor: '',
      summaryFontColor: '',
    },
  },
})

// #endregion 基本的模块配置


export type ModuleTemplatesOptions = ISettingModuleOptions
export const moduleTamplatesName = moduleOptions.value.moduleName
export const moduleTemplatesDisplayName = moduleOptions.value.moduleDisplayName
</script>

<style lang="scss" scoped>

</style>
