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
        <div>
          为避免遮挡段落内容，该选项将会影响到段落之间的间距。
        </div>
      </template>
      <template #opt>
        <a-switch v-model="moduleOptions.enableBlockTime" />
      </template>
    </EnSettingsItem>
    <EnSettingsItem>
      <div>
        是否一直显示年月日
      </div>
      <template #desc>
        <div>
          该选项关闭时，如果是日记中的块，当创建时间或更新时间的年月日与日记的日期相同，则不显示年月日。
        </div>
        <div>
          如果一篇日记绑定了多个日期，会一直显示年月日。
        </div>
      </template>
      <template #opt>
        <a-switch v-model="moduleOptions.alwaysShowYMD" />
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
          段落块右上角内容的字体大小。
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
  <div v-if="moduleOptions.enabled">
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
          content,
        }"
      >
        <template v-if="content">
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
            :alwaysShowYMD="moduleOptions.alwaysShowYMD"
          />
        </template>
      </template>
    </EnParagraphBlockAttrContainer>

    <EnParagraphLinkCard
      v-if="useCustomCard"
    />


    <!-- <template
      v-for="item of testTagListRef"
      :key="item.loopKey"
    >
      <EnParagraphSuperTagContainer
        :el="item.paragraphEl"
        :toEl="item.attrEl"
      />

    </template> -->
  </div>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main'
import {
  injectAuthStatus,
  useGlobalData,
  useModule,
} from '@/modules/EnModuleControl/ModuleProvide'
import { provideParagraphOnlyLink } from '@/modules/ParagraphBlock/EnParagraphBlock'
import EnParagraphBlockAttrContainer from '@/modules/ParagraphBlock/EnParagraphBlockAttrContainer.vue'
import EnParagraphBlockTime from '@/modules/ParagraphBlock/EnParagraphBlockTime.vue'
import EnParagraphBlockTimeDiff from '@/modules/ParagraphBlock/EnParagraphBlockTimeDiff.vue'
import EnParagraphLinkCard from '@/modules/ParagraphBlock/EnParagraphLinkCard.vue'

// import EnParagraphSuperTagContainer from '@/modules/ParagraphBlock/EnParagraphSuperTagContainer.vue'
import EnSettingsItem from '@/modules/Settings/EnSettingsItem.vue'
import EnSettingsTeleportModule from '@/modules/Settings/EnSettingsTeleportModule.vue'
import {
  debounce,
  generateUUIDWithTimestamp,
  moduleEnableStatusSwitcher,
} from '@/utils'


import {
  EN_CONSTANTS,
  EN_MODULE_LIST,
  EN_STYLE_KEYS,
} from '@/utils/Constants'
import { isSameDomList, queryAllByDom } from '@/utils/DOM'
import { useObserver } from '@/utils/elements/Observer'
import {
  SyDomNodeTypes,
  SyNodeTypes,
} from '@/utils/Siyuan'
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

    alwaysShowYMD: false,

    // enableBlockLock: false,
    // autoLockTimeDiff: 5 * 60,
    // autoCheckTime: 10,
  },
})

const {
  isVip,
} = injectAuthStatus()


useGlobalData(EN_CONSTANTS.PARAGRAPH_BLOCK_TIME_DIFF, {
  defaultData: {},
})


const paragraphListRef = ref<HTMLDivElement[]>([])
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

// TODO 如果加入 SuperTag 的功能的话，这个 ref 还需要像 paragraphBlockAttrContainerRefList 一样做清理
// const testTagListRef = ref<{
//   paragraphEl: HTMLDivElement
//   attrEl: HTMLSpanElement
//   loopKey: string
// }[]>([])

const bindAttrContainer = () => {
  const paragraphList = paragraphListRef.value

  const attrList = paragraphBlockAttrContainerRefList.value
  paragraphBlockAttrContainerRefList.value = attrList.filter((item) => {
    const exist = paragraphList.includes(item.paragraphEl)
    if (!exist) {
      item.attrEl = null
      item.paragraphEl = null
    }
    return exist
  })

  paragraphList.forEach((dom: HTMLDivElement) => {
    const exist = dom.querySelector('.enProtyleAttrContainer') as HTMLElement
    if (exist) {
      return
    }
    const span = document.createElement('div')
    span.className = 'enProtyleAttrContainer protyle-custom'
    span.contentEditable = 'false'
    span.dataset.en_loop_key = generateUUIDWithTimestamp()

    const protyleAttr = Array.from(dom.children).find((i) => i.classList.contains('protyle-attr'))
    if (!protyleAttr) return

    dom.insertBefore(span, protyleAttr)
    paragraphBlockAttrContainerRefList.value.push({
      paragraphEl: dom,
      attrEl: span,
      loopKey: span.dataset.en_loop_key,
    })
  })


  // paragraphList.forEach((dom: HTMLDivElement) => {

  //   const target = dom
  //   const exist = target.querySelector('.enTestTag') as HTMLElement
  //   if (exist) {
  //     return
  //   }
  //   const span = document.createElement('div')
  //   span.className = 'enTestTag protyle-custom'
  //   span.contentEditable = 'false'
  //   span.dataset.en_loop_key = generateUUIDWithTimestamp()


  //   const protyleAttr = dom.querySelector('.protyle-attr')
  //   if (!protyleAttr) return
  //   dom.insertBefore(span, protyleAttr)

  //   testTagListRef.value.push({
  //     paragraphEl: dom,
  //     attrEl: span,
  //     loopKey: span.dataset.en_loop_key,
  //   })
  // })
}

watch(paragraphListRef, () => {
  bindAttrContainer()
}, {
  immediate: true,
})

// 👇 是否渲染自定义链接卡片 true 开启，false 关闭
const useCustomCard = false
const paragraphOnlyLinkList = ref<HTMLDivElement[]>([])

if (useCustomCard) {
  provideParagraphOnlyLink(paragraphOnlyLinkList)
}
const getParagraphOnlyLinkList = (paragraphList: HTMLDivElement[]) => {
  return paragraphList.filter((dom) => {
    const editDiv = dom.firstElementChild
    if (!editDiv) return false
    const childNodes = Array.from(editDiv.childNodes)
    const filterBlankTextNode = childNodes.filter((child) => child.textContent.trim() !== '')
    const childSpanNodes = childNodes.filter((i) => i.nodeName === 'SPAN')
    const linkSpanNodes = childSpanNodes.filter((i: HTMLSpanElement) => {
      const typeAttr = i.dataset.type
      const typelist = typeAttr.split(/\s+/g)
      return typelist.find((i) => i === SyNodeTypes.a)
    })
    const isSame = filterBlankTextNode.length === linkSpanNodes.length
    return linkSpanNodes.length && isSame
  })
}
const handler = debounce(() => {
  const targetParagraphList = queryAllByDom(document.body, `.protyle:not(.EnDisableProtyleEnhance) div[data-type="${SyDomNodeTypes.NodeParagraph}"]`) as HTMLDivElement[]

  if (useCustomCard) {
    const targetParagraphOnlyLinkList = getParagraphOnlyLinkList(targetParagraphList)

    if (!isSameDomList([...paragraphOnlyLinkList.value], targetParagraphOnlyLinkList)) {
      paragraphOnlyLinkList.value = targetParagraphOnlyLinkList
    }
  }

  if (!isSameDomList([...paragraphListRef.value], targetParagraphList)) {
    paragraphListRef.value = targetParagraphList
  }

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
html[data-en_enabled_module~="EnParagraphBlock"] {
  --enTimeFontSize: 9px;

  .enProtyleAttrContainer {
    width: auto;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 4px;
    height: calc(var(--enTimeFontSize) + var(--en-gap));
    line-height: calc(var(--enTimeFontSize) + var(--en-gap));
    font-size: var(--enTimeFontSize);
    color: var(--b3-theme-on-surface);
    box-sizing: border-box;


    position: absolute;
    right: 4px;
    bottom: -4px;
    z-index: 1;

    svg {
      height: var(--enTimeFontSize) !important;
      width: var(--enTimeFontSize) !important;
    }
  }

  div[data-type="NodeParagraph"] {

    margin-top: 4px;
    margin-bottom: 6px;
    // margin-bottom: calc(var(--enTimeFontSize) + var(--en-gap) - 4px);

    &[custom-lifelog-type] {
      .enProtyleAttrContainer {
        bottom: -2px;
      }
    }

    &.en-stickied {
      .protyle-attr {
        opacity: 0;
      }
    }
  }


  div[data-type="NodeListItem"] {

    div[data-type="NodeBlockquote"] {

      div[data-type="NodeParagraph"] {
        .enProtyleAttrContainer {
          right: 4px;
        }
      }
    }
  }

  div[data-type="NodeBlockquote"] {

    div[data-type="NodeParagraph"] {
      .enProtyleAttrContainer {
        right: 0px;
      }
    }
  }
}
</style>
