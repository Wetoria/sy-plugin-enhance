<template>
  <a-collapse
    v-if="moduleOptions.enableBottomBacklink"
    class="backlinkArea"
    :defaultActiveKey="['bottomBackLinkArea']"
    :bordered="false"
  >
    <a-collapse-item
      key="bottomBackLinkArea"
      class="backlinkAreaCollapse"
      :header="`反链 (${backlinkRes.linkRefsCount})`"
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
            type="text"
            size="mini"
            @click.stop="refresh"
          >
            <SyIcon name="iconRefresh" />
          </a-button>
          <a-button
            v-if="enableBacklinkFilter"
            type="text"
            size="mini"
            @click.stop="switchFilterShown"
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
        v-model:activeKey="activedBacklinkKeys"
        class="backlinkDocsArea backlinkList"
        :bordered="false"
      >
        <!-- <a-empty v-if="!backlinks.length">
          <template #image>
            <icon-exclamation-circle-fill size="24" />
          </template>
          No data
        </a-empty> -->
        <template v-if="backlinks.length">
          <ul
            ref="backlinkListDomRef"
            class="b3-list b3-list--background"
          >
            <template
              v-for="backlink of backlinkRes.backlinks"
              :key="backlink.id"
            >
              <EnProtyleBottomBackLinkDoc
                :backlink="backlink"
                :blockBacklinks="blockBacklinks"
                :activedBacklinkKeys="activedBacklinkKeys"
                :currentDocId="currentDocId"
              />
            </template>
          </ul>
        </template>
      </a-collapse>
    </a-collapse-item>
    <a-collapse-item
      key="bottomBackMentionsArea"
      class="backlinkAreaCollapse"
      :header="`提及 (${backlinkRes.mentionsCount})`"
    >
      <a-collapse
        v-model:activeKey="activedMentionsKeys"
        class="backlinkDocsArea backlinkList"
        :bordered="false"
      >
        <template v-if="backmentions.length">
          <ul class="b3-list b3-list--background">
            <template
              v-for="backmention of backlinkRes.backmentions"
              :key="backmention.id"
            >
              <EnProtyleBottomBackMention
                :backmention="backmention"
                :activedBacklinkKeys="activedMentionsKeys"
                :currentDocId="currentDocId"
              />
            </template>
          </ul>
        </template>
      </a-collapse>
    </a-collapse-item>
  </a-collapse>
</template>

<script setup lang="ts">
import { request } from '@/api'
import SyIcon from '@/components/SiyuanTheme/SyIcon.vue'
import {
  injectSettings,
  useModule,
} from '@/modules/EnModuleControl/ModuleProvide'
import { EN_MODULE_LIST } from '@/utils/Constants'
import {
  computed,
  ref,
  watch,
  watchEffect,
} from 'vue'
import EnProtyleBottomBackLinkDoc from './EnProtyleBottomBackLinkDoc.vue'
import EnProtyleBottomBackLinkFilterArea from './EnProtyleBottomBackLinkFilterArea.vue'
import EnProtyleBottomBackMention from './EnProtyleBottomBackMention.vue'

const props = defineProps<{
  targetBlockId: string
}>()

const {
  moduleOptions,
} = useModule<BottomBacklinkModuleOptions>(EN_MODULE_LIST.EN_BOTTOM_BACKLINK)

const currentDocId = computed(() => props.targetBlockId)

const enableBacklinkFilter = computed(() => moduleOptions.value.enableBacklinkFilter)

const settings = injectSettings()

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
  mentionsCount: 0,
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

const getData = async () => {
  // backlinkRes.value = Object.assign({}, defaultRes)
  const res = await request('/api/ref/getBacklink2', searchParams.value)
  // IMP 如果性能有问题了，考虑在 id 相同的情况下，不进行更新
  backlinkRes.value = res
}

watch(searchParams, async () => {
  getData()
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

const refresh = () => {
  getData()
}
defineExpose({
  refresh,
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
