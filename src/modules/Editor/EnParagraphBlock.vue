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
        编辑时间字体大小
      </div>
      <template #desc>
        <div>
          段落块编辑时间的字体大小。
        </div>
      </template>
      <template #opt>
        <a-input-number class="input-demo" placeholder="Please Enter" mode="button" read-only
          v-model="moduleOptions.blockTimeFontSize" />
      </template>
    </EnSettingsItem>
  </EnSettingsTeleport>
  <div>
    <EnParagraphBlockAttrContainer
      v-for="paragraphBlock of paragraphListRef"
      :el="paragraphBlock"
    >
      <EnParagraphBlockTime :pDom="paragraphBlock" />
    </EnParagraphBlockAttrContainer>
  </div>
</template>

<script setup lang="ts">
  import EnSettingsItem from '@/modules/Settings/EnSettingsItem.vue';
  import EnSettingsTeleport from '@/modules/Settings/EnSettingsTeleport.vue';
  import { useModule } from '@/logic/Settings';
  import { computed, onMounted, ref, watchEffect } from 'vue';
  import { debounce } from '@/utils';
  import { queryAllByDom } from '@/utils/DOM';
  import { SyDomNodeTypes } from '@/utils/Siyuan';

  import EnParagraphBlockAttrContainer from './EnParagraphBlockAttrContainer.vue';
  import EnParagraphBlockTime from './EnParagraphBlockTime.vue';

  interface ModuleOptions {
    enableBlockTime: boolean
    blockTimeFontSize: number
  }

  const moduleName = 'EnParagraphBlock'
  const moduleDisplayName = '段落块相关功能'
  const defaultOptions: ModuleOptions = {
    enableBlockTime: false,
    blockTimeFontSize: 9,
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
  watchEffect(() => {
    const paragraphList = paragraphListRef.value

    paragraphList.forEach((dom: HTMLDivElement) => {
      appendEnProtyleAttrContainer(dom)
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

</script>

<style lang="scss">
  .enProtyleAttrContainer {
    display: none;
  }
  html[data-en-paragraph-block="true"] {
    --timeFontSize: 9px;

    .enProtyleAttrContainer {
      width: max-content;
      display: flex;
      font-size: var(--timeFontSize);
    }

    div[data-type="NodeListItem"] {

      .enProtyleAttrContainer {
        margin-right: -2px;
      }
    }
  }
</style>
