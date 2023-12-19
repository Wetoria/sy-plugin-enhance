<template>
  <div
    class="EnhanceSettingsContainer"
  >
    <div class="settingItem">
      <div class="settingItemDescArea">
        <div class="settingTitle">
          启用样式效果
        </div>
        <div class="settingDesc">
          是否启用双链颜色、双链增加中括号等样式。
        </div>
      </div>
      <div class="settingItemOptionArea">
        <SyCheckbox v-model="settings.useVip" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSettings } from '@/logic';
import SyCheckbox from './SiyuanTheme/SyCheckbox.vue';

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

  .settingItem {
    display: flex;
    min-height: 32px;
    align-items: center;

    .settingItemDescArea {
      flex: 1;

      .settingTitle {
        font-size: 16px;
      }

      .settingDesc {
        font-size: 12px;
      }
    }

    .settingItemOptionArea {
      width: 20%;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
