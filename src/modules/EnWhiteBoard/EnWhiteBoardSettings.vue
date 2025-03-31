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
          :model-value="embedWhiteBoardConfigData.boardOptions.backgroundVariant"
          placeholder="请选择背景样式"
          @change="updateBackgroundVariant"
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

    <!-- 边类型设置 -->
    <div class="SettingsItem">
      <div class="ItemTitle">
        连接线类型
      </div>
      <div class="ItemDesc">
        选择白板中连接线的默认类型
      </div>
      <div class="ItemOpt">
        <a-select
          :model-value="moduleWhiteBoardOptions.edgeTypeDefault"
          placeholder="请选择连接线类型"
          @change="updateEdgeType"
        >
          <a-option value="smoothstep">
            平滑阶梯
          </a-option>
          <a-option value="step">
            阶梯
          </a-option>
          <a-option value="straight">
            直线
          </a-option>
          <a-option value="bezier">
            贝塞尔曲线
          </a-option>
        </a-select>
      </div>
    </div>

    <!-- 边粗细设置 -->
    <div class="SettingsItem">
      <div class="ItemTitle">
        连接线粗细
      </div>
      <div class="ItemDesc">
        选择白板中连接线的默认粗细
      </div>
      <div class="ItemOpt">
        <a-select
          :model-value="moduleWhiteBoardOptions.edgeWidthDefault"
          placeholder="请选择连接线粗细"
          @change="updateEdgeWidth"
        >
          <a-option value="1">
            细
          </a-option>
          <a-option value="2">
            中
          </a-option>
          <a-option value="3">
            粗
          </a-option>
        </a-select>
      </div>
    </div>

    <!-- 边样式设置 -->
    <div class="SettingsItem">
      <div class="ItemTitle">
        连接线样式
      </div>
      <div class="ItemDesc">
        选择白板中连接线的默认样式
      </div>
      <div class="ItemOpt">
        <a-select
          :model-value="moduleWhiteBoardOptions.edgeStyleDefault"
          placeholder="请选择连接线样式"
          @change="updateEdgeStyle"
        >
          <a-option value="solid">
            实线
          </a-option>
          <a-option value="dashed">
            虚线
          </a-option>
          <a-option value="dotted">
            点线
          </a-option>
        </a-select>
      </div>
    </div>

    <!-- 起点箭头设置 -->
    <div class="SettingsItem">
      <div class="ItemTitle">
        连接线起点箭头
      </div>
      <div class="ItemDesc">
        选择白板中连接线的默认起点箭头
      </div>
      <div class="ItemOpt">
        <a-select
          :model-value="moduleWhiteBoardOptions.edgeMarkerStartDefault"
          placeholder="请选择起点箭头"
          @change="updateEdgeMarkerStart"
        >
          <a-option value="">
            无
          </a-option>
          <a-option value="circle-solid">
            实心圆点
          </a-option>
          <a-option value="line">
            横线
          </a-option>
          <a-option value="circle-hollow">
            空心圆点
          </a-option>
          <a-option value="arrow-start">
            箭头
          </a-option>
        </a-select>
      </div>
    </div>

    <!-- 终点箭头设置 -->
    <div class="SettingsItem">
      <div class="ItemTitle">
        连接线终点箭头
      </div>
      <div class="ItemDesc">
        选择白板中连接线的默认终点箭头
      </div>
      <div class="ItemOpt">
        <a-select
          :model-value="moduleWhiteBoardOptions.edgeMarkerEndDefault"
          placeholder="请选择终点箭头"
          @change="updateEdgeMarkerEnd"
        >
          <a-option value="">
            无
          </a-option>
          <a-option value="circle-solid">
            实心圆点
          </a-option>
          <a-option value="line">
            横线
          </a-option>
          <a-option value="circle-hollow">
            空心圆点
          </a-option>
          <a-option value="arrow">
            箭头
          </a-option>
        </a-select>
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
  embedWhiteBoardConfigData.value.boardOptions.useCustomBackground = false
  embedWhiteBoardConfigData.value.boardOptions.backgroundVariant = moduleWhiteBoardOptions.value.backgroundVariant
}

const updateBackgroundVariant = (value: 'dots' | 'lines' | 'none') => {
  embedWhiteBoardConfigData.value.boardOptions.useCustomBackground = true
  embedWhiteBoardConfigData.value.boardOptions.backgroundVariant = value
}

// 更新边类型
const updateEdgeType = (value: 'smoothstep' | 'step' | 'straight' | 'bezier') => {
  moduleWhiteBoardOptions.value.edgeTypeDefault = value
}

// 更新边粗细
const updateEdgeWidth = (value: '1' | '2' | '3') => {
  moduleWhiteBoardOptions.value.edgeWidthDefault = value
}

// 更新边样式
const updateEdgeStyle = (value: 'solid' | 'dashed' | 'dotted') => {
  moduleWhiteBoardOptions.value.edgeStyleDefault = value
}

// 更新起点箭头
const updateEdgeMarkerStart = (value: '' | 'circle-solid' | 'line' | 'circle-hollow' | 'arrow-start') => {
  moduleWhiteBoardOptions.value.edgeMarkerStartDefault = value
}

// 更新终点箭头
const updateEdgeMarkerEnd = (value: '' | 'circle-solid' | 'line' | 'circle-hollow' | 'arrow') => {
  moduleWhiteBoardOptions.value.edgeMarkerEndDefault = value
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
