<template>
  <EnSettingsTeleportModule
    :name="moduleOptions.moduleName"
    :display="moduleOptions.moduleDisplayName"
    :module="module"
  >
    <EnSettingsItem>
      <div>
        显示段落块时间
      </div>
      <template #desc>
        <div>
          是否显示块的创建时间或编辑时间。（点击时间部分进行切换）
        </div>
      </template>
      <template #opt>
        <a-switch v-model="moduleOptions.enableBlockTime" />
      </template>
    </EnSettingsItem>
    <EnSettingsItem mode="vertical">
      <div>
        时间类型
      </div>
      <template #desc>
        <div>
          默认展示的时间类型，更新时间或创建时间。
        </div>
      </template>
      <template #opt>
        <a-select
          v-model="moduleOptions.defaultBlockType"
        >
          <a-option value="created">
            创建时间
          </a-option>
          <a-option value="updated">
            更新时间
          </a-option>
        </a-select>
      </template>
    </EnSettingsItem>
    <EnSettingsItem mode="vertical">
      <div>
        内容字体大小
      </div>
      <template #desc>
        <div>
          段落块右上角内容的字体大小。（仅限插件内容，如段落时间、段落锁）
        </div>
      </template>
      <template #opt>
        <a-input-number
          v-model="moduleOptions.blockTimeFontSize"
          class="input-demo"
          placeholder="Please Enter"
          mode="button"
          :readOnly="plugin.isMobile"
        />
      </template>
    </EnSettingsItem>

  </EnSettingsTeleportModule>
  <div>
    <EnParagraphBlockAttrContainer
      v-for="attrItem of paragraphBlockAttrContainerRefList"
      :key="attrItem.loopKey"
      :el="attrItem.paragraphEl"
      :toEl="attrItem.attrEl"
    >
      <template
        #default="{
          created,
          createdFormatted,
          updated,
          updatedFormatted,
          nodeId,
        }"
      >
        <EnParagraphBlockTimeDiff
          v-if="isVip"
          :nodeId="nodeId"
        />
        <EnParagraphBlockTime
          v-if="moduleOptions.enableBlockTime"
          :created="created"
          :createdFormatted="createdFormatted"
          :updated="updated"
          :updatedFormatted="updatedFormatted"
          :pDom="attrItem.paragraphEl"
          :defaultBlockType="moduleOptions.defaultBlockType"
        />
      </template>
    </EnParagraphBlockAttrContainer>
  </div>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main'
import {
  injectAuthStatus,
  useGlobalData,
  useModule,
} from '@/modules/EnModuleControl/ModuleProvide'
import EnParagraphBlockAttrContainer from '@/modules/ParagraphBlock/EnParagraphBlockAttrContainer.vue'
import EnParagraphBlockTime from '@/modules/ParagraphBlock/EnParagraphBlockTime.vue'
import EnParagraphBlockTimeDiff from '@/modules/ParagraphBlock/EnParagraphBlockTimeDiff.vue'
import EnSettingsItem from '@/modules/Settings/EnSettingsItem.vue'
import EnSettingsTeleportModule from '@/modules/Settings/EnSettingsTeleportModule.vue'
import {
  debounce,
  generateShortUUID,
  moduleEnableStatusSwitcher,
} from '@/utils'


import {
  EN_CONSTANTS,
  EN_MODULE_LIST,
  EN_STYLE_KEYS,
} from '@/utils/Constants'
import { queryAllByDom } from '@/utils/DOM'
import { useObserver } from '@/utils/elements/Observer'
import { SyDomNodeTypes } from '@/utils/Siyuan'
import {
  onBeforeUnmount,
  ref,
  watch,
} from 'vue'

const plugin = usePlugin()

const {
  module,
  moduleOptions,
} = useModule<EnModuleParagraphBlock>(EN_MODULE_LIST.EN_PARAGRAPH_BLOCK, {
  defaultData: {
    enabled: false,
    moduleName: EN_MODULE_LIST.EN_PARAGRAPH_BLOCK,
    moduleDisplayName: EN_CONSTANTS.EN_PARAGRAPH_BLOCK_DISPLAY,

    enableBlockTime: false,
    blockTimeFontSize: 9,
    defaultBlockType: 'created',

    enableBlockLock: false,
    autoLockTimeDiff: 5 * 60,
    autoCheckTime: 10,
  },
})

const {
  isVip,
} = injectAuthStatus()


useGlobalData(EN_CONSTANTS.PARAGRAPH_BLOCK_TIME_DIFF, {
  defaultData: {},
})


const paragraphListRef = ref<HTMLDivElement[]>([])
window.paragraphListRef = paragraphListRef
const removeRecordedParagraphList = () => {
  paragraphListRef.value = []
}

const paragraphBlockAttrContainerRefList = ref<{
  paragraphEl: HTMLDivElement
  attrEl: HTMLSpanElement
  loopKey: string
}[]>([])

const removeAllParagraphBlockAttrContainer = () => {
  paragraphBlockAttrContainerRefList.value.forEach((item) => {
    item.attrEl.remove()
  })
  paragraphBlockAttrContainerRefList.value = []
}

const bindAttrContainer = () => {
  const paragraphList = paragraphListRef.value
  console.log('paragraphList', paragraphList)

  const attrList = paragraphBlockAttrContainerRefList.value
  paragraphBlockAttrContainerRefList.value = attrList.filter((item) => {
    return paragraphList.includes(item.paragraphEl)
  })

  paragraphList.forEach((dom: HTMLDivElement) => {
    const exist = dom.querySelector('.enProtyleAttrContainer') as HTMLElement
    if (exist) {
      return
    }
    const span = document.createElement('div')
    span.className = 'enProtyleAttrContainer protyle-custom'
    span.contentEditable = 'false'
    span.dataset.en_loop_key = generateShortUUID()
    const protyleAttr = dom.querySelector('.protyle-attr')
    if (!protyleAttr) return

    dom.insertBefore(span, protyleAttr)
    paragraphBlockAttrContainerRefList.value.push({
      paragraphEl: dom,
      attrEl: span,
      loopKey: span.dataset.en_loop_key,
    })
  })
}

watch(paragraphListRef, () => {
  bindAttrContainer()
}, {
  immediate: true,
})

const handler = debounce(() => {
  const targetParagraphList = queryAllByDom(document.body, `.protyle:not(.EnDisableProtyleEnhance) div[data-type="${SyDomNodeTypes.NodeParagraph}"]`) as HTMLDivElement[]

  const currentSet = new Set(paragraphListRef.value)

  if (currentSet.size === targetParagraphList.length
    && targetParagraphList.every((dom) => currentSet.has(dom))) {
    return
  }

  paragraphListRef.value = targetParagraphList
}, 200)

const {
  observe,
  unobserve,
} = useObserver({
  target: document.documentElement,
  callback: handler,
})

const unwatchEnableParagraphBlock = watch(() => moduleOptions.value.enabled, () => {
  moduleEnableStatusSwitcher(EN_MODULE_LIST.EN_PARAGRAPH_BLOCK, moduleOptions.value.enabled)
  if (moduleOptions.value.enabled) {
    observe()
  } else {
    unobserve()
    removeRecordedParagraphList()
    removeAllParagraphBlockAttrContainer()
  }
}, {
  immediate: true,
})
const unwatchBlockTimeFontSize = watch(() => moduleOptions.value.blockTimeFontSize, () => {
  document.documentElement.style.setProperty(EN_STYLE_KEYS.enTimeFontSize, `${moduleOptions.value.blockTimeFontSize}px`)
}, {
  immediate: true,
})

const disableAll = () => {
  unwatchEnableParagraphBlock()
  unwatchBlockTimeFontSize()

  removeRecordedParagraphList()
  removeAllParagraphBlockAttrContainer()

  document.documentElement.style.removeProperty(EN_STYLE_KEYS.enTimeFontSize)
  moduleEnableStatusSwitcher(EN_MODULE_LIST.EN_PARAGRAPH_BLOCK)
}
onBeforeUnmount(() => {
  disableAll()
})
</script>

<style lang="scss">
  .enProtyleAttrContainer {
    display: none;
  }
  html[data-en_enabled_module~="EnParagraphBlock"] {
    --enTimeFontSize: 9px;

    .enProtyleAttrContainer {
      width: max-content;
      display: flex;
      gap: 4px;
      height: calc(var(--enTimeFontSize) + var(--en-gap));
      line-height: calc(var(--enTimeFontSize) + var(--en-gap));
      font-size: var(--enTimeFontSize);
      color: var(--b3-theme-on-surface);
      box-sizing: border-box;
      position: absolute;
      top: 0;
      transform: translateY(calc(-100% + 4px));
      right: 0;

      svg {
        height: var(--enTimeFontSize) !important;
        width: var(--enTimeFontSize) !important;
      }
    }

    div[data-type="NodeParagraph"] {

      margin-bottom: var(--enTimeFontSize);
      --enAttrContainerWidth: 64px;

      .protyle-attr {
        font-size: var(--enTimeFontSize) !important;
        height: calc(var(--enTimeFontSize) + var(--en-gap)) !important;
        line-height: calc(var(--enTimeFontSize) + var(--en-gap)) !important;
        right: var(--enAttrContainerWidth);
        top: 0;
        transform: translateY(calc(-100% + 4px));

        & > div {
          display: flex !important;
          align-items: center;
          gap: var(--en-gap);
        }

        svg {
          margin: unset !important;
          height: var(--enTimeFontSize) !important;
          width: var(--enTimeFontSize) !important;
        }
      }

      &.en-stickied {
        .enProtyleAttrContainer,
        .protyle-attr {
          opacity: 0;
        }
      }
    }


    div[data-type="NodeListItem"] {

      .enProtyleAttrContainer {
        // padding-right: 4px;
      }
    }
  }
  html[data-en-paragraph-block-lock="true"] {
    .block-focus {
      border-right: 1px solid var(--sky-blue);
    }
  }
</style>
