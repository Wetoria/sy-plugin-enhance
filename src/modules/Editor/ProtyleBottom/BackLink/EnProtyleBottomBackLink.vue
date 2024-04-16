<template>
  <a-collapse
    v-if="moduleOptions.enableBottomBacklink"
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
        v-if="enableBacklinkFilter"
        v-show="showFilterArea"
        :backlinkListDomRef="backlinkListDomRef"
        :backlinks="backlinkRes.backlinks"
        :blockBacklinks="blockBacklinks"
        :currentDocId="currentDocId"
      />
      <a-collapse
        class="backlinkDocsArea backlinkList"
        :bordered="false"
        v-model:activeKey="activedBacklinkKeys"
      >
        <!-- <a-empty v-if="!backlinks.length">
          <template #image>
            <icon-exclamation-circle-fill size="24" />
          </template>
          No data
        </a-empty> -->
        <template v-if="backlinks.length">
          <ul class="b3-list b3-list--background" ref="backlinkListDomRef">
            <template
              v-for="backlink of backlinkRes.backlinks"
            >
              <EnProtyleBottomBackLinkDoc
                :backlink="backlink"
                :blockBacklinks="blockBacklinks"
                :element="element"
                :activedBacklinkKeys="activedBacklinkKeys"
                :currentDocId="currentDocId"
              />
            </template>
          </ul>
        </template>
      </a-collapse>
    </a-collapse-item>
    <a-collapse-item
      class="backlinkAreaCollapse"
      :header="`提及 (${backlinkRes.mentionsCount})`"
      key="bottomBackMentionsArea"
    >
      <a-collapse
        class="backlinkDocsArea backlinkList"
        ref="mentionListDomRef"
        :bordered="false"
        v-model:activeKey="activedMentionsKeys"
      >
        <template v-if="backmentions.length">
          <ul class="b3-list b3-list--background">
            <template
              v-for="backmention of backlinkRes.backmentions"
            >
              <EnProtyleBottomBackMention
                :backmention="backmention"
                :element="element"
                :activedBacklinkKeys="activedMentionsKeys"
                :currentDocId="currentDocId"
              />
            </template>
          </ul>
        </template>
      </a-collapse>
    </a-collapse-item>
  </a-collapse>

  <EnSettingsTeleportModule
    :name="BottomBacklinkModuleName"
    :display="moduleDisplayName"
    :module="module"
  >
    <EnSettingsItem>
      <div>
        启用底部反链
      </div>
      <template #desc>
        <div>
          是否启用底部反链功能
        </div>
      </template>
      <template #opt>
        <a-switch v-model="moduleOptions.enableBottomBacklink" />
      </template>
    </EnSettingsItem>
    <EnSettingsItem>
      <div>
        启用反链过滤
      </div>
      <template #desc>
        <div>
          是否启用底部反链的过滤功能
        </div>
      </template>
      <template #opt>
        <a-switch v-model="moduleOptions.enableBacklinkFilter" />
      </template>
    </EnSettingsItem>
    <EnSettingsItem>
      <div>
        默认展开过滤区域
      </div>
      <template #desc>
        <div>
          是否默认展开底部反链的过滤区域。
        </div>
      </template>
      <template #opt>
        <a-switch v-model="moduleOptions.defaultShowBacklinkFilter" />
      </template>
    </EnSettingsItem>
    <EnSettingsItem mode="vertical">
      <div>
        反链筛选 SQL 查询上限
      </div>
      <template #desc>
        <div>
          与反链筛选功能有关。如果设置的太小，可能会导致数据不正确。<br />
          请输入正确的数字，否则会重置为默认的 999999999.
        </div>
      </template>
      <template #opt>
        <a-input-number
          class="input-demo"
          placeholder="Please Enter"
          mode="button"
          :min="1"
          :readOnly="plugin.isMobile"
          v-model="moduleOptions.sqlLimit"
        />
      </template>
    </EnSettingsItem>
  </EnSettingsTeleportModule>
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

export interface BottomBacklinkModuleOptions {
  enableBottomBacklink: boolean


  enableBacklinkFilter: boolean
  defaultShowBacklinkFilter: boolean
  sqlLimit: number
  docFilterProperties: {
    [id: string]: FilterProperties
  }
  docFilterPropertiesSaved: {
    [id: string]: {
      [name: string]: FilterProperties
    }
  }
}

export const BottomBacklinkModuleName = 'EnBottomBacklink'
const moduleDisplayName = '底部反链'

const defaultOptions: BottomBacklinkModuleOptions = {
  enableBottomBacklink: false,

  enableBacklinkFilter: false,
  defaultShowBacklinkFilter: false,
  sqlLimit: 999999999,
  docFilterProperties: {},
  docFilterPropertiesSaved: {},
}
</script>

<script setup lang="ts">
import { useModule, useSettings } from "@/modules/Settings/EnSettings.vue";
import EnProtyleBottomBackLinkFilterArea, { FilterProperties } from './EnProtyleBottomBackLinkFilterArea.vue';
import EnProtyleBottomBackLinkDoc from './EnProtyleBottomBackLinkDoc.vue';
import EnProtyleBottomBackMention from './EnProtyleBottomBackMention.vue';
import { request } from '@/api';
import { IProtyle } from 'siyuan';
import { computed, ref, watch, watchEffect } from 'vue';
import SyIcon from '@/components/SiyuanTheme/SyIcon.vue'
import EnSettingsTeleportModule from '@/modules/Settings/EnSettingsTeleportModule.vue';
import EnSettingsItem from '@/modules/Settings/EnSettingsItem.vue';
import { usePlugin } from '@/main';

const plugin = usePlugin()

const module = useModule(BottomBacklinkModuleName, defaultOptions)
const moduleOptions = computed(() => module.value.options as BottomBacklinkModuleOptions)

watch(() => moduleOptions.value.sqlLimit, () => {
  if (!moduleOptions.value.sqlLimit) {
    moduleOptions.value.sqlLimit = defaultOptions.sqlLimit
  }
}, { immediate: true })

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

const enableBacklinkFilter = computed(() => moduleOptions.value.enableBacklinkFilter)

const settings = useSettings();

// TODO 需要调整设置逻辑
const showFilterArea = ref(moduleOptions.value.defaultShowBacklinkFilter || settings.value.isDebugging)
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
const blockBacklinks = ref({})
watch(backlinks, () => {
  backlinks.value.forEach((item) => {
    blockBacklinks.value[item.id] = undefined
  })
}, { immediate: true })

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
const activedMentionsKeys = ref([])

const backlinkListDomRef = ref()
watchEffect(() => {
  console.log('backlinkListDomRef is ', backlinkListDomRef.value)
})
</script>

<style lang="scss" scoped>
.backlinkArea {
  :deep(.arco-collapse-item-header),
  :deep(.arco-collapse-item-content) {
    background-color: unset;
  }

  :deep(.arco-collapse-item),
  :deep(.arco-collapse-item-header) {
    border-bottom: unset;
  }

  &.arco-collapse {
    overflow: unset;

    :deep(.backlinkAreaCollapse) {
      & > .arco-collapse-item-header {
        padding: 4px 8px 4px 22px;
        position: sticky;
        top: 0px;
        z-index: 2;
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
        border-radius: 4px;

        .arco-icon-hover {
          left: 4px;
        }
      }
    }

    .backlinkList {
      background: var(--v-backlink-area-bg-color);
      padding: 6px 8px;
    }

    .protyle-breadcrumb__bar:not(:first-child) {
      margin-top: 8px;
    }

    .arco-collapse-item-header:hover {
      background-color: var(--color-fill-1);
    }
  }
}
</style>
