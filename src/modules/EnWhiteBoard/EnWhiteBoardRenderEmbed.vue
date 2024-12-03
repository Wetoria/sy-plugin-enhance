<template>
  <EnProtyleCustomArea
    :getTargetBlockDom="data.getDom"
    :fullScreen="fullScreen"
  >
    <div
      :class="['EnWhiteBoardRenderContainer', fullScreen ? 'FullScreen' : '']"
    >
      <a-resize-box
        :directions="!fullScreen ? ['bottom'] : []"
        :style="{
          minHeight: `${module.embedBlockMinHeight}px`,
          height: fullScreen ? '100%' : undefined,
        }"
        v-model:height="whiteBoardConfig.embedOptions[data.nodeId].height"
      >
        <div class="EnWhiteBoardContainer">
          <div
            class="EnWhiteBoardSider EnWhiteBoardLeftAreaContainer"
          >
            <a-resize-box
              v-show="showSider && embedOptions.SiderLeftShow"
              :directions="['right']"
              :style="{
                maxWidth: '100%',
              }"
              v-model:width="whiteBoardConfig.embedOptions[data.nodeId].SiderLeftWidth"
            >
              <div>Sider Left</div>
            </a-resize-box>
          </div>

          <div class="EnWhiteBoardContentContainer">
            <!-- {{ data.whiteBoardId }} - {{ data.nodeId }} -->
            <div class="EnWhiteBoardControlArea EnWhiteBoardControlArea__Top">
              <a-button-group
                class="FullScreenButtonGroup"
              >
                <a-tooltip content="思源内铺满">
                  <a-button @click="changeFullScreen('siyuan')">
                    <SyIcon name="iconSiYuan" />
                  </a-button>
                </a-tooltip>
                <a-tooltip content="文档内铺满">
                  <a-button @click="changeFullScreen('doc')">
                    <SyIcon name="iconFile" />
                  </a-button>
                </a-tooltip>
                <a-tooltip content="退出全屏" v-if="fullScreen">
                  <a-button @click="changeFullScreen()">
                    <SyIcon name="iconContract" />
                  </a-button>
                </a-tooltip>
              </a-button-group>
            </div>
            <div class="EnWhiteBoardControlArea EnWhiteBoardControlArea__Bottom">
              <div>
                <a-button
                  v-show="showSider"
                  @click="embedOptions.SiderLeftShow = !embedOptions.SiderLeftShow"
                >
                  <template v-if="embedOptions.SiderLeftShow">
                    <SyIcon name="iconOutdent" />
                  </template>
                  <template v-else>
                    <SyIcon name="iconIndent" />
                  </template>
                </a-button>
              </div>
              <div>

              </div>
              <div>
                <a-button
                  v-show="showSider"
                  @click="embedOptions.SiderRightShow = !embedOptions.SiderRightShow"
                >
                  <template v-if="embedOptions.SiderRightShow">
                    <SyIcon name="iconIndent" />
                  </template>
                  <template v-else>
                    <SyIcon name="iconOutdent" />
                  </template>
                </a-button>
              </div>
            </div>
            <div class="EnWhiteBoardControlArea EnWhiteBoardControlArea__Right">
            </div>
            <div class="EnWhiteBoardControlArea EnWhiteBoardControlArea__Left">
            </div>
            <VueFlow :nodes="nodes" :edges="edges">
              <!-- bind your custom node type to a component by using slots, slot names are always `node-<type>` -->
              <template #node-special="specialNodeProps">
                <SpecialNode v-bind="specialNodeProps" />
              </template>

              <!-- bind your custom edge type to a component by using slots, slot names are always `edge-<type>` -->
              <template #edge-special="specialEdgeProps">
                <SpecialEdge v-bind="specialEdgeProps" />
              </template>
            </VueFlow>
          </div>


          <div class="EnWhiteBoardSider EnWhiteBoardRightAreaContainer">
            <a-resize-box
              v-show="showSider && embedOptions.SiderRightShow"
              :directions="['left']"
              :style="{
                maxWidth: '100%',
              }"
              v-model:width="whiteBoardConfig.embedOptions[data.nodeId].SiderRightWidth"
            >
              <div>Sider Right</div>
            </a-resize-box>
          </div>

        </div>
      </a-resize-box>
    </div>
  </EnProtyleCustomArea>
</template>

<script lang="ts">
</script>

<script setup lang="ts">
import { useSettingModuleData } from '../Settings/EnSettings.vue';
import { EnWhiteBoard, EnWhiteBoardBlockDomTarget, EnWhiteBoardSetting, whiteBoardConfigList } from './EnModuleWhiteBoard.vue';
import EnProtyleCustomArea from '@/components/EnProtyleCustomArea.vue';
import { computed, ref, watchEffect } from 'vue';
import SpecialNode from './SpecialNode.vue';
import SpecialEdge from './SpecialEdge.vue';
import { VueFlow } from '@vue-flow/core';

const props = defineProps<{
  data: EnWhiteBoardBlockDomTarget
}>()

const module = useSettingModuleData<EnWhiteBoardSetting>(EnWhiteBoard)

const whiteBoardConfig = computed(() => {
  return whiteBoardConfigList.value.data[props.data.whiteBoardId]
})
watchEffect(() => {
  if (!whiteBoardConfig.value.embedOptions[props.data.nodeId]) {
    whiteBoardConfig.value.embedOptions[props.data.nodeId] = {
      height: 0,
      SiderLeftShow: false,
      SiderRightShow: false,
    }
  }
})

const embedOptions = computed(() => {
  return whiteBoardConfig.value.embedOptions[props.data.nodeId]
})

const fullScreen = ref<'doc' | 'siyuan' | undefined>(undefined)
const changeFullScreen = (value?: 'doc' | 'siyuan') => {
  fullScreen.value = value
}
const showSider = computed(() => !!fullScreen.value)

const nodes = ref([
  // an input node, specified by using `type: 'input'`
  {
    id: '1',
    type: 'input',
    position: { x: 250, y: 5 },
    // all nodes can have a data object containing any data you want to pass to the node
    // a label can property can be used for default nodes
    data: { label: 'Node 1' },
  },

  // default node, you can omit `type: 'default'` as it's the fallback type
  {
    id: '2',
    position: { x: 100, y: 100 },
    data: { label: 'Node 2' },
  },

  // An output node, specified by using `type: 'output'`
  {
    id: '3',
    type: 'output',
    position: { x: 400, y: 200 },
    data: { label: 'Node 3' },
  },

  // this is a custom node
  // we set it by using a custom type name we choose, in this example `special`
  // the name can be freely chosen, there are no restrictions as long as it's a string
  {
    id: '4',
    type: 'special', // <-- this is the custom node type name
    position: { x: 500, y: 300 },
    data: {
      label: 'Node 4',
      hello: 'world',
    },
  },
])

// these are our edges
const edges = ref([
  // default bezier edge
  // consists of an edge id, source node id and target node id
  {
    id: 'e1->2',
    source: '1',
    target: '2',
  },

  // set `animated: true` to create an animated edge path
  {
    id: 'e2->3',
    source: '2',
    target: '3',
    animated: true,
  },

  // a custom edge, specified by using a custom type name
  // we choose `type: 'special'` for this example
  {
    id: 'e3->4',
    type: 'special',
    source: '3',
    target: '4',

    // all edges can have a data object containing any data you want to pass to the edge
    data: {
      hello: 'world',
    }
  },
])
</script>

<style lang="scss" scoped>
.EnWhiteBoardRenderContainer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--b3-theme-background);
  box-sizing: border-box;
  border: 1px solid var(--b3-border-color);

  .arco-resizebox {
    box-sizing: border-box;
  }

  &.FullScreen .arco-resizebox {
    height: 100% !important;
    padding-bottom: unset !important;
  }

  .EnWhiteBoardContainer {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;

    .EnWhiteBoardContentContainer {
      flex: 1;

      position: relative;
    }

    .EnWhiteBoardControlArea {
      position: absolute;
      z-index: 2;
      --en-white-board-control-vertical-height: 30px;
      --en-white-board-control-horizontal-width: 30px;
      box-sizing: border-box;

      display: flex;

      padding: 4px;
    }

    .EnWhiteBoardControlArea__Top {
      top: 0;
      left: 0;
      width: 100%;
      height: var(--en-white-board-control-vertical-height);

      justify-content: flex-end;
      align-items: center;

    }
    .EnWhiteBoardControlArea__Bottom {
      bottom: 0;
      left: 0;
      width: 100%;
      height: var(--en-white-board-control-vertical-height);

      justify-content: space-between;
    }
    .EnWhiteBoardControlArea__Left {
      left: 0;
      top: var(--en-white-board-control-vertical-height);
      width: var(--en-white-board-control-horizontal-width);
      height: calc(100% - var(--en-white-board-control-vertical-height) * 2);

      flex-direction: column;
    }
    .EnWhiteBoardControlArea__Right {
      right: 0;
      top: var(--en-white-board-control-vertical-height);
      width: var(--en-white-board-control-horizontal-width);
      height: calc(100% - var(--en-white-board-control-vertical-height) * 2);

      flex-direction: column;
    }

    .EnWhiteBoardSider {
      height: 100%;
      box-sizing: border-box;
      max-width: 30%;

      display: flex;
      flex-direction: column;

      .arco-resizebox {
        height: 100%;
      }
    }
  }
}
</style>
