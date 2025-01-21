<template>
  <Teleport
    :to="protyleContentEl"
  >
    <div
      ref="EnBottomBacklinkRenderArea"
      class="EnBottomBacklinkRenderArea"
    >
      <div class="titleArea">
        <div class="title">
          <a-typography-title
            :heading="6"
            style="
              margin: 0;
              line-height: unset;
              color: var(--b3-theme-on-surface);
            "
          >
            引用
          </a-typography-title>
        </div>
        <div class="optArea">
          <a-tooltip>
            <template #content>
              <div>
                显示反链和提及
              </div>
              <div>
                双击切换为默认展示当前块的反链
              </div>
              <div>
                当前：{{ isBacklinkShownDefault ? '默认显示' : '默认隐藏' }}
              </div>
            </template>
            <a-button
              type="text"
              :style="{
                color: isBacklinkShownDefault ? 'var(--b3-theme-primary)' : undefined,
              }"
              @click="onBacklinkShownSwitch"
            >
              <template #icon>
                <SyIcon name="iconLink" />
              </template>
            </a-button>
          </a-tooltip>
          <a-tooltip>
            <template #content>
              <div>
                刷新反链数据
              </div>
            </template>
            <a-button
              type="text"
              @click="refreshData"
            >
              <template #icon>
                <SyIcon name="iconRefresh" />
              </template>
            </a-button>
          </a-tooltip>
          <a-tooltip>
            <template #content>
              <div>
                筛选反链
              </div>
            </template>
            <a-button
              v-if="moduleOptions.enableBacklinkFilter"
              type="text"
              @click.stop="switchFilterShown"
            >
              <template #icon>
                <SyIcon name="iconFilter" />
              </template>
            </a-button>
          </a-tooltip>
        </div>
      </div>
      <div v-if="isBacklinkShown">
        <RenderBottomBacklink
          ref="backlinkRenderRef"
          :targetBlockId="blockId"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import RenderBottomBacklink from '@/modules/BottomBacklink/RenderBottomBacklink.vue'
import { useModule } from '@/modules/EnModuleControl/ModuleProvide'
import {
  EN_MODULE_LIST,
  EN_STYLE_KEYS,
} from '@/utils/Constants'
import { onCountClick } from '@/utils/DOM'
import { hideHelperByTarget } from '@/utils/Siyuan'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watchEffect,
} from 'vue'

const props = defineProps<{
  protyleContentEl: HTMLElement
  blockId: string
}>()

const {
  moduleOptions,
} = useModule<BottomBacklinkModuleOptions>(EN_MODULE_LIST.EN_BOTTOM_BACKLINK)
watchEffect(() => {
  document.documentElement.style.setProperty(EN_STYLE_KEYS.enBottomBacklinkTopDistance, `${moduleOptions.value.bottomBacklinkTopDistance}px`)
})
onBeforeUnmount(() => {
  document.documentElement.style.removeProperty(EN_STYLE_KEYS.enBottomBacklinkTopDistance)
})

const EnBottomBacklinkRenderArea = ref()
const bindPadding = () => {
  const wysiwygEl: HTMLDivElement = props.protyleContentEl.querySelector('.protyle-wysiwyg')
  if (!wysiwygEl) {
    return
  }
  const leftPadding = Number(wysiwygEl.style.paddingLeft.replace('px', ''))
  const rightPadding = Number(wysiwygEl.style.paddingRight.replace('px', ''))
  EnBottomBacklinkRenderArea.value.style.paddingLeft = `${leftPadding}px`
  EnBottomBacklinkRenderArea.value.style.paddingRight = `${rightPadding}px`
}

const resizeObserver = new ResizeObserver(bindPadding)

onMounted(() => {
  props.protyleContentEl.dataset.en_with_bottom_backlink = 'true'
  bindPadding()
  const wysiwygEl: HTMLDivElement = props.protyleContentEl.querySelector('.protyle-wysiwyg')
  resizeObserver.observe(wysiwygEl)
})
onBeforeUnmount(() => {
  resizeObserver.disconnect()
  delete props.protyleContentEl.dataset.en_with_bottom_backlink
})

const isBacklinkShownDefault = computed(() => {
  return moduleOptions.value.autoRenderBacklinkMap[props.blockId]
})

const isBacklinkShown = ref(isBacklinkShownDefault.value)
watchEffect(() => {
  if (isBacklinkShownDefault.value) {
    isBacklinkShown.value = isBacklinkShownDefault.value
  }
})
const onBacklinkShownSwitch = onCountClick((count) => {
  if (count > 1) {
    const newDefaultShown = !isBacklinkShownDefault.value
    moduleOptions.value.autoRenderBacklinkMap[props.blockId] = newDefaultShown
  } else {
    isBacklinkShown.value = !isBacklinkShown.value
  }
})

const backlinkRenderRef = ref()
const refreshData = () => {
  backlinkRenderRef.value.refresh()
}
const switchFilterShown = () => {
  backlinkRenderRef.value.switchFilterShown()
}

const hideHelpers = () => {
  hideHelperByTarget(EnBottomBacklinkRenderArea.value)
}
onMounted(() => {
  props.protyleContentEl.addEventListener('scroll', hideHelpers)
})
onBeforeUnmount(() => {
  props.protyleContentEl.removeEventListener('scroll', hideHelpers)
})
</script>

<style lang="scss" scoped>
.EnBottomBacklinkRenderArea {
  transition: padding 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0ms;

  display: flex;
  flex-direction: column;

  .titleArea {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;


    .optArea {
      .arco-btn-text {
        color: var(--b3-theme-on-surface);
      }
    }
  }
}
</style>

<style lang="scss">
.protyle-content[data-en_with_bottom_backlink='true'] {
  .protyle-wysiwyg {
    // IMP 改成可以配置的
    padding-bottom: var(--enBottomBacklinkTopDistance) !important;
  }
}
</style>
