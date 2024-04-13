<template>
  <a-collapse
    class="backlinkArea"
    :defaultActiveKey="['bottomBackLinkArea']"
    :bordered="false"
  >
    <a-collapse-item
      class="backlinkAreaCollapse"
      :header="`反链 (${backlinkRes.linkRefsCount})`"
      key="bottomBackLinkArea"
    >
      <template #extra>
        <div>
          <!-- <a-button @click.stop type="text" size="mini">
            <SyIcon name="iconExpand" />
          </a-button>
          <a-button @click.stop type="text" size="mini">
            <SyIcon name="iconContract" />
          </a-button> -->
          <a-button
            @click.stop="switchFilterShown" type="text" size="mini"
            v-if="enableBacklinkFilter"
          >
            <SyIcon name="iconFilter" />
          </a-button>
        </div>
      </template>
      <EnProtyleBottomBackLinkFilterArea
        v-if="enableBacklinkFilter && showFilterArea"
      />
      <a-collapse
        class="backlinkDocsArea backlinkList"
        ref="backlinkListDomRef"
        :bordered="false"
        v-model:activeKey="activedBacklinkKeys"
      >
        <a-empty v-if="!backlinks.length">
          <template #image>
            <icon-exclamation-circle-fill size="24" />
          </template>
          No data, please reload!
        </a-empty>
        <template v-else>
          <ul class="b3-list b3-list--background">
            <template
              v-for="backlink of backlinkRes.backlinks"
            >
              <EnProtyleBottomBackLinkDoc
                :backlink="backlink"
                :element="element"
                :activedBacklinkKeys="activedBacklinkKeys"
                :currentDocId="currentDocId"
              />
            </template>
          </ul>
        </template>
      </a-collapse>
    </a-collapse-item>
  </a-collapse>
</template>

<script lang="ts">
export interface IBacklink {
  id: string
  box: string
  name: string
  hPath: string
  type: string
  nodeType: string
  subType: string
  depth: number
  count: number
  updated: string
  created: string
}
</script>

<script setup lang="ts">
import { useSettings } from "@/modules/Settings/EnSettings.vue";
import EnProtyleBottomBackLinkFilterArea from './EnProtyleBottomBackLinkFilterArea.vue';
import EnProtyleBottomBackLinkDoc from './EnProtyleBottomBackLinkDoc.vue';
import { request } from '@/api';
import { IProtyle } from 'siyuan';
import { computed, ref, watch, watchEffect } from 'vue';
import SyIcon from '@/components/SiyuanTheme/SyIcon.vue'


interface Node {
  id: string;
  parent_id: string;
  name: string;
  treePath: string;
  _type: 'doc' | 'block_Ref';
}

const props = defineProps<{
  detail: {
    protyle: IProtyle
  },
  element: HTMLDivElement
}>()

const protyle = computed(() => props.detail.protyle as IProtyle)
const currentDocId = computed(() => protyle.value?.block?.id)

const enableBacklinkFilter = computed(() => settings.value.enableBacklinkFilter)

const settings = useSettings();

// TODO 需要调整设置逻辑
const showFilterArea = ref(settings.value.defaultShowBacklinkFilter || settings.value.isDebugging)
const switchFilterShown = () => {
  showFilterArea.value = !showFilterArea.value
}

const searchParams = ref({
  id: currentDocId.value,
  k: '',
  sort: '3',
  mk: '',
  mSort: '3',
})

watchEffect(() => {
  searchParams.value.id = currentDocId.value
})

const defaultRes = {
  backlinks: [],
  backmentions: [],
  box: '',
  k: '',
  mk: '',
  linkRefsCount: 0,
  mentionsCount: 0
}
const backlinkRes = ref<{
  backlinks: IBacklink[]
  backmentions: IBacklink[]
  box: string
  k: string
  mk: string
  linkRefsCount: number
  mentionsCount: number
}>(Object.assign({}, defaultRes))

const backlinks = computed(() => backlinkRes.value.backlinks)
const backmentions = computed(() => backlinkRes.value.backmentions)

watch(searchParams, async () => {
  backlinkRes.value = Object.assign({}, defaultRes)
  const res = await request('/api/ref/getBacklink2', searchParams.value)
  backlinkRes.value = res;
}, {
  immediate: true,
  deep: true,
})

const activedBacklinkKeys = ref([])

watchEffect(() => {
  const keys = []
  // TODO 改成可配置
  const len = backlinks.value.length
  for (let i = 0; i < len; i++) {
    const item = backlinks.value[i]
    keys.push(item.id)
  }
  activedBacklinkKeys.value = keys
})

// ====================================================
</script>

<style lang="scss" scoped>
.backlinkArea {
  :deep(.arco-collapse-item-header),
  :deep(.arco-collapse-item-content) {
    background-color: unset;
  }

  &.arco-collapse {
    overflow: unset;

    :deep(.backlinkAreaCollapse) {
      & > .arco-collapse-item-header {
        padding: 4px 8px 4px 22px;
        position: sticky;
        top: 0px;
        z-index: 1;
        background-color: var(--b3-theme-background);

        .arco-icon-hover {
          left: 4px;
        }

        .arco-btn {
          color: unset;
        }
      }

      & > .arco-collapse-item-content {
        padding: 0px;

        .arco-collapse-item-content-box {
          padding-top: unset;
        }
      }
    }
  }

  :deep(.backlinkDocsArea) {
    .arco-collapse-item {
      border-bottom: unset;

      .arco-collapse-item-header {
        padding: 2px 0px 2px 22px;
        border-bottom: unset;

        .arco-icon-hover {
          left: 4px;
        }
      }
    }

    .backlinkList {
      background: var(--v-backlink-area-bg-color);
      padding: 6px 8px;
      border-radius: var(--v-backlink-area-border-radius);
    }
  }
}
</style>
