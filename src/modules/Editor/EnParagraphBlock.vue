<template>
  <EnSettingsTeleport :name="moduleName" :display="moduleDisplayName" :module="module">
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
          <a-option value="created">创建时间</a-option>
          <a-option value="updated">更新时间</a-option>
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
        <a-input-number class="input-demo" placeholder="Please Enter" mode="button"
          :readOnly="plugin.isMobile"
          v-model="moduleOptions.blockTimeFontSize" />
      </template>
    </EnSettingsItem>

    <EnSettingsItem>
      <div>
        段落锁
      </div>
      <template #desc>
        <div>
          是否启用段落锁 <icon-font type="en-lock" /> 功能。
        </div>
      </template>
      <template #opt>
        <a-switch v-model="moduleOptions.enableBlockLock" />
      </template>
    </EnSettingsItem>
    <EnSettingsItem mode="vertical">
      <div>
        段落锁定的时间
      </div>
      <template #desc>
        <div>
          段落的更新时间如果早于设定的时间，将会被自动锁定。可点击 <icon-font type="en-lock" /> 进行解锁。
        </div>
        <div>
          单位：秒，最短 1 秒，最长 120 分钟（7200 秒）。
        </div>
      </template>
      <template #opt>
        <a-input-number
          class="input-demo"
          placeholder="Please Enter"
          mode="button"
          :max="120 * 60"
          :min="1"
          :readOnly="plugin.isMobile"
          v-model="moduleOptions.autoLockTimeDiff"
          @change="onAutoLockTimeDiff"
        />
      </template>
    </EnSettingsItem>
  </EnSettingsTeleport>
  <div>
    <EnParagraphBlockAttrContainer
      v-for="paragraphBlock of paragraphListRef"
      :el="paragraphBlock"
    >
      <EnParagraphBlockLock
        :pDom="paragraphBlock"
        :enabled="moduleOptions.enableBlockLock"
        :autoLockTimeDiff="moduleOptions.autoLockTimeDiff"
      />
      <EnParagraphBlockTime
        :pDom="paragraphBlock"
        :defaultBlockType="moduleOptions.defaultBlockType"
        v-if="moduleOptions.enableBlockTime"
      />
    </EnParagraphBlockAttrContainer>
  </div>
</template>

<script setup lang="ts">
  import EnSettingsItem from '@/modules/Settings/EnSettingsItem.vue';
  import EnSettingsTeleport from '@/modules/Settings/EnSettingsTeleport.vue';
  import { computed, onMounted, ref, watchEffect } from 'vue';
  import { debounce } from '@/utils';
  import { queryAllByDom } from '@/utils/DOM';
  import { SyDomNodeTypes } from '@/utils/Siyuan';


  import EnParagraphBlockAttrContainer from './EnParagraphBlockAttrContainer.vue';
  import EnParagraphBlockTime from './EnParagraphBlockTime.vue';
  import EnParagraphBlockLock from './EnParagraphBlockLock.vue';
  import { usePlugin } from '@/main';
import { useModule } from '../Settings/EnSettings.vue';

  interface ModuleOptions {
    enableBlockTime: boolean
    blockTimeFontSize: number
    defaultBlockType: 'created' | 'updated'

    enableBlockLock: boolean
    autoLockTimeDiff: number
  }

  const plugin = usePlugin()

  const moduleName = 'EnParagraphBlock'
  const moduleDisplayName = '段落块相关功能'
  const defaultOptions: ModuleOptions = {
    enableBlockTime: false,
    blockTimeFontSize: 9,
    defaultBlockType: 'created',

    enableBlockLock: false,
    autoLockTimeDiff: 5 * 60,
  }
  const module = useModule(moduleName, defaultOptions)
  const moduleOptions = computed(() => module.value.options as ModuleOptions)

  watchEffect(() => {
    document.documentElement.dataset.enParagraphBlock = `${module.value.enabled}`
    document.documentElement.style.setProperty('--timeFontSize', `${moduleOptions.value.blockTimeFontSize}px`)
  })

  const paragraphListRef = ref([])

  const appendEnProtyleAttrContainer = (dom: HTMLDivElement) => {
    if (dom.dataset.enModified) {
      return
    }
    const span = document.createElement('span')
    span.className = 'enProtyleAttrContainer'
    span.contentEditable = 'false'
    const protyleAttr = dom.querySelector('.protyle-attr')
    if (!protyleAttr) return

    protyleAttr.appendChild(span)
    dom.dataset.enModified = 'true'

  }

  const FOCUS_CLASS_NAME = 'block-focus'
  const lasFocusDom = ref<HTMLDivElement>()
  const bindClickFocusEvent = (dom: HTMLDivElement) => {
    // @ts-ignore
    if (dom.bindedFocusEvent) {
      return
    }
    dom.addEventListener('click', () => {
      if (lasFocusDom.value) {
        lasFocusDom.value.classList.toggle(FOCUS_CLASS_NAME, false)
      }
      dom.classList.toggle(FOCUS_CLASS_NAME, true)
      lasFocusDom.value = dom
    })
    // @ts-ignore
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
      const paragraphList = queryAllByDom(document.body, `[data-type="${SyDomNodeTypes.NodeParagraph}"]`)
      paragraphListRef.value = paragraphList
    }

    handler()
    const observer = new MutationObserver(debounce(handler, 300));
    observer.observe(document.documentElement, {
      childList: true, // 观察目标子节点的变化，是否有添加或者删除
      subtree: true, // 观察后代节点，默认为 false
      attributes: true,
    })
  }
  onMounted(() => {
    insertBlockTime();
  })

  const onAutoLockTimeDiff = (value) => {
    if (!value) {
      moduleOptions.value.autoLockTimeDiff = 60
    }
  }

</script>

<style lang="scss">
  .enProtyleAttrContainer {
    display: none;
  }
  html[data-en-paragraph-block="true"] {
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
        margin-right: -2px;
      }
    }
  }
  html[data-en-paragraph-block-lock="true"] {
    .block-focus {
      border-right: 1px solid var(--sky-blue);
    }
  }
</style>
