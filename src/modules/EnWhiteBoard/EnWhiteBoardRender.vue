<template>
  <div
    class="EnWhiteBoardRenderContainer"
  >
    <EnWhiteBoardSider
      :needSider="needSider"
      :embedBlockOptions="embedBlockOptions"
      pos="Left"
    >
      <template #SiderTopButtonGroupBefore>
        <slot name="SiderLeftTopButtonGroupBefore" />
      </template>
      <template #SiderTopButtonGroupAfter>
        <slot name="SiderLeftTopButtonGroupAfter" />
      </template>

      <div>Sider Left</div>

      <template #SiderBottomButtonGroupBefore>
        <slot name="SiderLeftBottomButtonGroupBefore" />
      </template>
      <template #SiderBottomButtonGroupAfter>
        <slot name="SiderLeftBottomButtonGroupAfter" />
      </template>
    </EnWhiteBoardSider>

    <div class="EnWhiteBoardContentContainer">
      <!-- {{ data.whiteBoardId }} - {{ data.nodeId }} -->
      <div class="EnWhiteBoardControlArea EnWhiteBoardControlArea__Top">
        <a-button-group
          class="FullScreenButtonGroup"
        >
          <slot name="topButtonGroup" />
        </a-button-group>
      </div>
      <div class="EnWhiteBoardControlArea EnWhiteBoardControlArea__Bottom">
        <div>

        </div>
        <div>

        </div>
        <div>

        </div>
      </div>
      <div class="EnWhiteBoardControlArea EnWhiteBoardControlArea__Left">
      </div>
      <div class="EnWhiteBoardControlArea EnWhiteBoardControlArea__Right">
      </div>
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        :zoom-on-scroll="false"
        fit-view-on-init
        :minZoom="0.2"
      >
        <!-- bind your custom node type to a component by using slots, slot names are always `node-<type>` -->
        <template #node-special="specialNodeProps">
          <SpecialNode v-bind="specialNodeProps" />
        </template>
        <template #node-EnWhiteBoardCard="node">
          <EnWhiteBoardCard
            v-bind="node"
          />
        </template>

        <!-- bind your custom edge type to a component by using slots, slot names are always `edge-<type>` -->
        <template #edge-special="specialEdgeProps">
          <SpecialEdge v-bind="specialEdgeProps" />
        </template>
      </VueFlow>
    </div>


    <EnWhiteBoardSider
      :needSider="needSider"
      :embedBlockOptions="embedBlockOptions"
      pos="Right"
    >
      <template #SiderTopButtonGroupBefore>
        <slot name="SiderRightTopButtonGroupBefore" />
      </template>
      <template #SiderTopButtonGroupAfter>
        <slot name="SiderRightTopButtonGroupAfter" />
      </template>

      <div>Sider Right</div>

      <template #SiderBottomButtonGroupBefore>
        <slot name="SiderRightBottomButtonGroupBefore" />
      </template>
      <template #SiderBottomButtonGroupAfter>
        <slot name="SiderRightBottomButtonGroupAfter" />
      </template>
    </EnWhiteBoardSider>
  </div>
</template>

<script setup lang="ts">
import {
  EnWhiteBoardBlockDomTarget,
  getWhiteBoardConfigRefById,
} from '@/modules/EnWhiteBoard/EnWhiteBoard'


import EnWhiteBoardSider from '@/modules/EnWhiteBoard/EnWhiteBoardSider.vue'
import { VueFlow } from '@vue-flow/core'
import {
  ref,
  watch,
} from 'vue'
import EnWhiteBoardCard from './EnWhiteBoardCard.vue'
import SpecialEdge from './SpecialEdge.vue'
import SpecialNode from './SpecialNode.vue'

const props = defineProps<{
  data: EnWhiteBoardBlockDomTarget
  needSider?: boolean
}>()

const {
  embedWhiteBoardConfigData,
  embedBlockOptions,
} = getWhiteBoardConfigRefById(props.data.whiteBoardId, props.data.nodeId)

watch(() => embedBlockOptions.value.SiderLeftWidth, () => {
  embedBlockOptions.value.SiderLeftShow = embedBlockOptions.value.SiderLeftWidth > 0
})
watch(() => embedBlockOptions.value.SiderRightWidth, () => {
  embedBlockOptions.value.SiderRightShow = embedBlockOptions.value.SiderRightWidth > 0
})


const nodes = ref([
  // an input node, specified by using `type: 'input'`
  {
    id: '1',
    type: 'input',
    position: {
      x: 250,
      y: 5,
    },
    // all nodes can have a data object containing any data you want to pass to the node
    // a label can property can be used for default nodes
    data: { label: 'Node 1' },
  },

  // default node, you can omit `type: 'default'` as it's the fallback type
  {
    id: '2',
    position: {
      x: 100,
      y: 100,
    },
    data: { label: 'Node 2' },
  },

  // An output node, specified by using `type: 'output'`
  {
    id: '3',
    type: 'output',
    position: {
      x: 400,
      y: 200,
    },
    data: { label: 'Node 3' },
  },

  // this is a custom node
  // we set it by using a custom type name we choose, in this example `special`
  // the name can be freely chosen, there are no restrictions as long as it's a string
  {
    id: '4',
    type: 'special', // <-- this is the custom node type name
    position: {
      x: 500,
      y: 300,
    },
    data: {
      label: 'Node 4',
      hello: 'world',
    },
  },
  {
    id: '6',
    parentNode: '5',
    expandParent: true,
    position: {
      x: 110,
      y: 110,
    },
    data: {
      label: 'Node 6',
      hello: 'world',
    },
  },
  {
    id: '5',
    type: 'EnWhiteBoardCard', // <-- this is the custom node type name
    position: {
      x: 300,
      y: 300,
    },
    data: {
      label: 'Node 5',
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
    },
  },
])
</script>

<style lang="scss" scoped>
.EnWhiteBoardRenderContainer {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  z-index: 0;

  .EnWhiteBoardContentContainer {
    flex: 1;

    position: relative;

    .FullScreenButtonGroup {
      opacity: 0;
    }
    &:hover .FullScreenButtonGroup {
      opacity: 1;
    }
  }

  .EnWhiteBoardControlArea {
    position: absolute;
    z-index: 2;
    --en-white-board-control-vertical-height: 30px;
    --en-white-board-control-horizontal-width: 30px;
    box-sizing: border-box;

    display: flex;

    padding: var(--b3-border-radius);
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

  :deep(.arco-btn-secondary[type="button"]) {
    background-color: var(--b3-theme-background);

    &:hover {
      background-color: var(--b3-theme-surface);
    }
  }
}
</style>
