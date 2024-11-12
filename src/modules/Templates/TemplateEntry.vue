<template>
  <EnSettingsTeleportModule :name="moduleTamplatesName" :display="moduleTemplatesDisplayName" :module="module">
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
          背景色：
          <EnColorPicker
            v-model="moduleOptions.cornell.noteBgColor"
            type="bgColor"
            defaultIndex="2"
          />
          标题色
          <EnColorPicker
            v-model="moduleOptions.cornell.noteTitleColor"
            type="color"
            defaultIndex="2"
          />
          字体色：
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
          背景色：
          <EnColorPicker
            v-model="moduleOptions.cornell.clueBgColor"
            type="bgColor"
            defaultIndex="10"
          />
          标题色
          <EnColorPicker
            v-model="moduleOptions.cornell.clueTitleColor"
            type="color"
            defaultIndex="10"
          />
          字体色：
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
          背景色：
          <EnColorPicker
            v-model="moduleOptions.cornell.summaryBgColor"
            type="bgColor"
            defaultIndex="12"
          />
          标题色
          <EnColorPicker
            v-model="moduleOptions.cornell.summaryTitleColor"
            type="color"
            defaultIndex="12"
          />
          字体色：
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
import TemplateCornell from './TemplateCornell.vue';
import EnSettingsItem from '@/modules/Settings/EnSettingsItem.vue';
import EnSettingsTeleportModule from '@/modules/Settings/EnSettingsTeleportModule.vue';
import EnColorPicker from '@/components/EnColorPicker.vue';
import { EnModule } from '../Settings/EnSettings.vue';
import { useSettingModuleInScript } from '@/utils/SyncDataHooks';
import { onBeforeMount } from 'vue';


onBeforeMount(async () => {
  await loadAndUpdate()
})

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

const moduleConfig: ISettingModuleOptions = {
  enabled: false,
  moduleName: 'EnTemplates',
  moduleDisplayName: '模板',

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
  }
}

const {
  moduleName,
  moduleDisplayName,
  module,
  moduleOptions,
  loadAndUpdate,
} = useSettingModuleInScript<ISettingModuleOptions>(moduleConfig)

// #endregion 基本的模块配置


export type ModuleTemplatesOptions = ISettingModuleOptions
export const moduleTamplatesName = moduleName
export const moduleTemplatesDisplayName = moduleDisplayName
</script>

<style lang="scss" scoped>

</style>
