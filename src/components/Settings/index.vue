<template>
  <div
    class="EnhanceSettingsContainer"
  >
    <SettingItem>
      <div>
        启用样式效果
      </div>
      <template #desc>
        <div>
          是否启用双链颜色、双链增加中括号等样式。
        </div>
      </template>
      <template #opt>
        <SyCheckbox v-model="settings.useVipStyle" />
      </template>
    </SettingItem>

    <SettingItem mode="complex">
      <div>
        悬浮球开启平台
      </div>
      <template #desc>
        <div>
          是否启用双链颜色、双链增加中括号等样式。
        </div>
      </template>
      <template #opt>
        <SySelect
          v-model="settings.floatingBallPlatform"
          :options="[
            {
              value: 'all',
              text: '全部'
            },
            {
              value: 'only-mobile',
              text: '仅移动端'
            },
            {
              value: 'none',
              text: '关闭悬浮球'
            },
          ]"
        ></SySelect>
      </template>
    </SettingItem>

    <SettingItem mode="complex">
      <div>
        反链筛选 SQL 查询上限
      </div>
      <template #desc>
        <div>
          与反链筛选功能有关。如果设置的太小，筛选项可能会不正确。
        </div>
      </template>
      <template #opt>
        <SyInput
          v-model="settings.sqlLimit"
        />
      </template>
    </SettingItem>

    <div class="sperator"></div>
    <div
      style="
        font-weight: bold;
      "
    >
      移动端
    </div>
    <SettingItem>
      <div>
        导航栏显示名称
      </div>
      <template #desc>
        <div>
          是否显示导航栏按钮的名称。
        </div>
      </template>
      <template #opt>
        <SyCheckbox v-model="settings.showMobileNavLabel" />
      </template>
    </SettingItem>

    <SettingItem mode="complex">
      <div>
        导航栏文档切换模式
      </div>
      <template #desc>
        <div>
          切换导航栏上/下一篇翻页模式为翻日记，或翻浏览过的文档。
        </div>
      </template>
      <template #opt>
        <SySelect
          v-model="settings.mobileSwitchDocMode"
          :options="[
            {
              value: 'doc',
              text: '切换历史文档'
            },
            {
              value: 'dailyNote',
              text: '切换日记'
            },
          ]"
        ></SySelect>
      </template>
    </SettingItem>
    <!-- <SettingItem mode="complex">
      <div>
        日记默认笔记本
      </div>
      <template #desc>
        <div>
          默认存放日记的笔记本。
        </div>
      </template>
      <template #opt>

      </template>
    </SettingItem> -->

  </div>
</template>

<script setup lang="ts">
import { useSettings } from '@/logic';
import SyCheckbox from '../SiyuanTheme/SyCheckbox.vue';
import SySelect from '../SiyuanTheme/SySelect.vue';
import SettingItem from './SettingItem.vue';
import SyInput from '../SiyuanTheme/SyInput.vue';

const settings = useSettings()

</script>

<style lang="scss">
.SyEnhancerDialogTitle {
  font-weight: bold;
}
</style>

<style scoped lang="scss">
.EnhanceSettingsContainer {
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 9px 24px;
  box-sizing: border-box;
  max-height: 80vh;
  overflow-x: hidden;
  overflow-y: auto;
  gap: 12px;

  .sperator {
    width: 100%;
    height: 1px;
    border-bottom: 1px solid var(--b3-theme-surface-lighter);
  }
}
</style>
