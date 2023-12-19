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
        <SyCheckbox v-model="settings.useVip" />
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
  gap: 8px;


}
</style>
