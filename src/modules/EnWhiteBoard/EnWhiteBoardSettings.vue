<template>
  <div class="WhiteBoardSettings">
    <div class="SettingsTitle">
      白板设置
    </div>
    <div class="SettingsItem">
      <div class="ItemTitle">
        白板背景样式
      </div>
      <div class="ItemDesc">
        选择白板的背景样式
      </div>
      <div class="ItemOpt">
        <a-select
          v-model="embedWhiteBoardConfigData.boardOptions.backgroundVariant"
          placeholder="请选择背景样式"
        >
          <a-option value="dots">
            点状
          </a-option>
          <a-option value="lines">
            网格
          </a-option>
          <a-option value="none">
            无
          </a-option>
        </a-select>
        <div
          class="ResetButton"
          @click="resetBackgroundToGlobal"
        >
          重置为全局设置
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  getWhiteBoardConfigRefById,
  useWhiteBoardModule,
} from '@/modules/EnWhiteBoard/EnWhiteBoard'

const props = defineProps<{
  whiteBoardId: string
  nodeId: string
}>()

const { moduleOptions: moduleWhiteBoardOptions } = useWhiteBoardModule()
const { embedWhiteBoardConfigData } = getWhiteBoardConfigRefById(props.whiteBoardId, props.nodeId)

const resetBackgroundToGlobal = () => {
  embedWhiteBoardConfigData.value.boardOptions.backgroundVariant = moduleWhiteBoardOptions.value.backgroundVariant
}
</script>

<style lang="scss" scoped>
.WhiteBoardSettings {
  padding: var(--en-gap);

  .SettingsTitle {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: var(--en-gap);
    padding-bottom: var(--en-gap);
    border-bottom: 1px solid var(--b3-border-color);
  }

  .SettingsItem {
    margin-bottom: var(--en-gap);

    .ItemTitle {
      font-weight: bold;
      margin-bottom: 4px;
    }

    .ItemDesc {
      color: var(--b3-theme-on-surface);
      font-size: 12px;
      margin-bottom: 8px;
    }

    .ItemOpt {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .ResetButton {
        color: var(--b3-theme-error);
        font-size: 12px;
        cursor: pointer;
        padding: 4px;
        border: 1px solid var(--b3-theme-error);
        text-align: center;
        transition: all 0.15s ease-in-out;

        &:hover {
          color: var(--b3-theme-error);
          background-color: var(--b3-theme-error-light);
        }
      }
    }
  }
}
</style>
