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
import { computed } from 'vue';
import { useModule } from '../Settings/EnSettings.vue';
import TemplateCornell from './TemplateCornell.vue';
import { usePlugin } from '@/main';
import EnSettingsItem from '@/modules/Settings/EnSettingsItem.vue';
import EnSettingsTeleportModule from '@/modules/Settings/EnSettingsTeleportModule.vue';
import EnColorPicker from '@/components/EnColorPicker.vue';

const plugin = usePlugin()


const defaultOptions: ModuleTemplatesOptions = {
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
const module = useModule(moduleTamplatesName, defaultOptions)
const moduleOptions = computed(() => module.value.options as ModuleTemplatesOptions)

</script>

<script lang="ts">
export interface ModuleTemplatesOptions {
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
export const moduleTamplatesName = 'EnTemplates'
export const moduleTemplatesDisplayName = '模板'
</script>

<style lang="scss" scoped>

</style>
