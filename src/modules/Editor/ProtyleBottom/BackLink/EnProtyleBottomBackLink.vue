<template>
  <a-collapse
    v-if="enableBottomBacklink"
    class="backlinkArea"
    :defaultActiveKey="['bottomBackLinkArea']"
    :bordered="false"
  >
    <a-collapse-item
      class="backlinkAreaCollapse"
      header="反链"
      key="bottomBackLinkArea"
    >
      <template #extra>
        <div>
          <a-button @click.stop type="text" size="mini">
            <SyIcon name="iconExpand" />
          </a-button>
          <a-button @click.stop type="text" size="mini">
            <SyIcon name="iconContract" />
          </a-button>
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
                :activedBacklinkKeys="activedBacklinkKeys"
                :currentDocId="currentDocId"
              />
            </template>
          </ul>
        </template>
      </a-collapse>
    </a-collapse-item>
  </a-collapse>
  <!-- <div class="backlinkAreaTitleLine">
      <div
        class="backlinkAreaFolder"
        @click="switchBacklinkAreaFoldStatus"
        :style="{
          transform: `rotateZ(${backlinkAreaFolded ? '0' : '90'}deg)`,
        }"
      >
        <SyIcon name="iconPlay" size="10" />
      </div>
      <span class="backlinkTitle" @click="switchBacklinkAreaFoldStatus">
        反链
      </span>
      <div class="opts">
        <SyIcon
          v-if="enableBacklinkFilter"
          @click="switchBacklinkFilterPanelShownStatus"
          name="iconFilter"
          size="14"
        />
      </div>
    </div>
    <div
      v-if="enableBacklinkFilter"
      class="backlinkFilterContainer"
      :style="{
        display: backlinkFilterPanelShownStatus ? 'flex' : 'none',
      }"
    >
      <div>
        <h3>搜索/过滤</h3>
      </div>
      <div>单击左键来包含，或则 shift-单击左键来排除，再次点击取消选中。</div>
      <div class="backlinkRefListContainer" v-if="includeRefs.length">
        <span> include: </span>
        <BacklinkFilterOptionTag
          v-for="item of includeRefs"
          :key="'in-' + item.id"
          @click="(event) => handleClickFilterTag(event, item)"
          :title="item.name"
        >
          <span class="optionName">
            {{ item.name }}
          </span>
        </BacklinkFilterOptionTag>
      </div>
      <div class="backlinkRefListContainer" v-if="excludeRefs.length">
        <span> exclude: </span>
        <BacklinkFilterOptionTag
          v-for="item of excludeRefs"
          :key="'ex-' + item.id"
          @click="(event) => handleClickFilterTag(event, item)"
          :title="item.name"
        >
          <span class="optionName">
            {{ item.name }}
          </span>
        </BacklinkFilterOptionTag>
      </div>
      <div class="backlinkRefListContainer">
        <BacklinkFilterOptionTag
          v-for="item of remainRefs"
          :key="item.id"
          @click="(event) => handleClickFilterTag(event, item)"
          :title="item.name"
        >
          <span class="optionName">
            {{ item.name }}
          </span>
          <sup style="margin-left: 2px">
            {{ linkNumMap[item.id] }}
          </sup>
        </BacklinkFilterOptionTag>
      </div>
    </div> -->
  <!-- <div
      :style="{
        height: backlinkAreaFolded ? '0px' : 'max-content',
        overflow: 'hidden',
      }"
    >
      <div v-if="!docBacklinks.length">未找到相关内容</div>
      <template v-else>
        <div class="vBacklinkContainer backlinkList" ref="backlinkListDomRef">
          <ul class="b3-list b3-list--background">
            <div
              v-for="docBacklink of docBacklinks"
              :key="docBacklink.id"
              class="backlinkDocBlock"
            >
              <div
                class="backlinkDocBlockTitleLineSticky"
                :data-node-id="docBacklink.id"
              >
                <div
                  class="backlinkDocBlockTitleLine"
                  @click="switchBacklinkDocBlockFoldStatus(docBacklink)"
                >
                  <div
                    class="backlinkDocBlockFolder"
                    :style="{
                      transform: `rotateZ(${
                        docBacklinkFoldStatusMap[docBacklink.id] ? '0' : '90'
                      }deg)`,
                    }"
                  >
                    <SyIcon name="iconPlay" size="10" />
                  </div>

                </div>
              </div>
            </div>
          </ul>
        </div>
      </template>
    </div> -->
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
import { computed, ref, watchEffect } from 'vue';
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
const enableBottomBacklink = computed(
  () => settings.value.enableBottomBacklink,
);

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

const backlinkRes = ref<{
  backlinks: IBacklink[]
  backmentions: IBacklink[]
  box: string
  k: string
  mk: string
  linkRefsCount: number
  mentionsCount: number
}>({
  backlinks: [],
  backmentions: [],
  box: '',
  k: '',
  mk: '',
  linkRefsCount: 0,
  mentionsCount: 0
})

const backlinks = computed(() => backlinkRes.value.backlinks)
const backmentions = computed(() => backlinkRes.value.backmentions)

const getBacklinkData = async () => {
  const res = await request('/api/ref/getBacklink2', searchParams.value)
  backlinkRes.value = res;
}
watchEffect(() => {
  const currentDocId = protyle.value?.block?.id;
  if (!currentDocId) {
    return
  }
  getBacklinkData()
})

const activedBacklinkKeys = ref([])

watchEffect(() => {
  const keys = []
  // TODO 改成可配置
  for (let i = 0; i < 10; i++) {
    const item = backlinks.value[i]
    keys.push(item.id)
  }
  activedBacklinkKeys.value = keys
})
watchEffect(() => {
  console.log('activedBacklinkKeys is ', activedBacklinkKeys.value)
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
