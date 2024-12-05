<template>
  <EnSettingsTeleportModule
    :name="moduleName"
    :display="moduleDisplayName"
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
      v-for="paragraphBlock of paragraphListRef"
      :key="paragraphBlock.dataset.nodeId"
      :el="paragraphBlock"
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
        <!-- <EnParagraphBlockLock
          :pDom="paragraphBlock"
          :updated="updated"
          :enabled="moduleOptions.enableBlockLock"
          :autoLockTimeDiff="moduleOptions.autoLockTimeDiff"
          :autoCheckTime="moduleOptions.autoCheckTime"
        /> -->
        <EnParagraphBlockTime
          v-if="moduleOptions.enableBlockTime"
          :created="created"
          :createdFormatted="createdFormatted"
          :updated="updated"
          :updatedFormatted="updatedFormatted"
          :pDom="paragraphBlock"
          :defaultBlockType="moduleOptions.defaultBlockType"
        />
      </template>
    </EnParagraphBlockAttrContainer>
  </div>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main'
import {
  EnModule,
  isVip,
  useSettingModule,
  useSettingModuleData,
} from '@/modules/Settings/EnSettings.vue'
import EnSettingsItem from '@/modules/Settings/EnSettingsItem.vue'
import EnSettingsTeleportModule from '@/modules/Settings/EnSettingsTeleportModule.vue'
import {
  debounce,
  moduleEnableStatusSwitcher,
} from '@/utils'
import { queryAllByDom } from '@/utils/DOM'


import { SyDomNodeTypes } from '@/utils/Siyuan'
import { updateModuleDataByNamespaceWithLoadFile } from '@/utils/SyncData'
import {
  onMounted,
  ref,
  watchEffect,
} from 'vue'
import EnParagraphBlockAttrContainer from './EnParagraphBlockAttrContainer.vue'
import EnParagraphBlockTime from './EnParagraphBlockTime.vue'
import EnParagraphBlockTimeDiff from './EnParagraphBlockTimeDiff.vue'

const plugin = usePlugin()

interface ModuleOptions extends EnModule {
  enableBlockTime: boolean
  blockTimeFontSize: number
  defaultBlockType: 'created' | 'updated'

  enableBlockLock: boolean
  autoLockTimeDiff: number
  autoCheckTime: number
}

const moduleName = 'EnParagraphBlock'
const moduleDisplayName = '段落块相关功能'

const defaultData: ModuleOptions = {
  enabled: true,
  moduleName,
  moduleDisplayName,

  enableBlockTime: false,
  blockTimeFontSize: 9,
  defaultBlockType: 'created',

  enableBlockLock: false,
  autoLockTimeDiff: 5 * 60,
  autoCheckTime: 10,
}
const module = useSettingModule<ModuleOptions>(moduleName, {
  defaultData,
})
const moduleOptions = useSettingModuleData<ModuleOptions>(moduleName)

updateModuleDataByNamespaceWithLoadFile(moduleName)

const paragraphListRef = ref<HTMLDivElement[]>([])

const appendEnProtyleAttrContainer = (dom: HTMLDivElement) => {
  const exist = !!dom.querySelector('.enProtyleAttrContainer')
  if (exist) {
    return
  }
  const span = document.createElement('span')
  span.className = 'enProtyleAttrContainer'
  span.contentEditable = 'false'
  const protyleAttr = dom.querySelector('.protyle-attr')
  if (!protyleAttr) return

  protyleAttr.appendChild(span)
}

const FOCUS_CLASS_NAME = 'block-focus'
const lasFocusDom = ref<HTMLDivElement>()
const bindClickFocusEvent = (dom: HTMLDivElement) => {
  // @ts-expect-error bindedFocusEvent
  if (dom.bindedFocusEvent) {
    return
  }
  dom.addEventListener('click', () => {
    if (lasFocusDom.value) {
      lasFocusDom.value.classList.toggle(FOCUS_CLASS_NAME, false)
    }
    if (dom.dataset.enBlockLocked == 'locked') {
      dom.classList.toggle(FOCUS_CLASS_NAME, true)
    }
    lasFocusDom.value = dom
  })
  // @ts-expect-error bindedFocusEvent
  dom.bindedFocusEvent = true
}

watchEffect(() => {
  const paragraphList = paragraphListRef.value

  paragraphList.forEach((dom: HTMLDivElement) => {
    appendEnProtyleAttrContainer(dom)

    bindClickFocusEvent(dom)
  })
})

function insertBlockTime() {
  const handler = () => {
    const paragraphList = queryAllByDom(document.body, `.protyle:not(.EnDisableProtyleEnhance) [data-type="${SyDomNodeTypes.NodeParagraph}"]`) as HTMLDivElement[]
    paragraphListRef.value = paragraphList
  }

  handler()
  const observer = new MutationObserver(debounce(handler, 300))
  observer.observe(document.documentElement, {
    childList: true, // 观察目标子节点的变化，是否有添加或者删除
    subtree: true, // 观察后代节点，默认为 false
    attributes: true,
  })
}
onMounted(() => {
  insertBlockTime()
})


watchEffect(() => {
  moduleEnableStatusSwitcher('EnParagraphBlock', moduleOptions.value.enabled)
  document.documentElement.style.setProperty('--timeFontSize', `${moduleOptions.value.blockTimeFontSize}px`)
})
</script>

<style lang="scss">
  .enProtyleAttrContainer {
    display: none;
  }
  html[data-en_enabled_module~="EnParagraphBlock"] {
    --timeFontSize: 9px;

    div[data-type="NodeParagraph"] {
      margin-top: var(--timeFontSize);
    }

    .enProtyleAttrContainer {
      width: max-content;
      display: flex;
      gap: 4px;
      font-size: var(--timeFontSize);
    }

    div[data-type="NodeListItem"] {

      .enProtyleAttrContainer {
        margin-right: -4px;
      }
    }
  }
  html[data-en-paragraph-block-lock="true"] {
    .block-focus {
      border-right: 1px solid var(--sky-blue);
    }
  }
</style>
