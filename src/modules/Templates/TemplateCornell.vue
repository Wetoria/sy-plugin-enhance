<!-- eslint-disable vue/valid-v-for -->
<template>
  <div>
    <a-modal
      v-model:visible="configModalVisible"
      :footer="false"
      :mask-style="{
        backgroundColor: 'rgba(0,0,0,0)'
      }"
      draggable
    >
      <template #title>
        设置康奈尔模板的配色
      </template>
      <a-space direction="vertical" fill>
        <div>
          设置康奈尔
        </div>
        <div>
          暂不支持分别设置日间/夜间模式的配色。
        </div>
        <div>
          设置康奈尔模板笔记区的颜色
        </div>
        <a-space>
          背景色：
          <EnColorPicker
            v-model="cornellOptions.noteBgColor"
            type="bgColor"
            defaultIndex="2"
          />
          标题色
          <EnColorPicker
            v-model="cornellOptions.noteTitleColor"
            type="color"
            defaultIndex="2"
          />
          字体色：
          <EnColorPicker
            v-model="cornellOptions.noteFontColor"
            type="color"
          />
        </a-space>
        <div>
          设置康奈尔模板线索区的颜色
        </div>
        <a-space>
          背景色：
          <EnColorPicker
            v-model="cornellOptions.clueBgColor"
            type="bgColor"
            defaultIndex="10"
          />
          标题色
          <EnColorPicker
            v-model="cornellOptions.clueTitleColor"
            type="color"
            defaultIndex="10"
          />
          字体色：
          <EnColorPicker
            v-model="cornellOptions.clueFontColor"
            type="color"
          />
        </a-space>
        <div>
          设置康奈尔模板总结区的颜色
        </div>
        <a-space>
          背景色：
          <EnColorPicker
            v-model="cornellOptions.summaryBgColor"
            type="bgColor"
            defaultIndex="12"
          />
          标题色
          <EnColorPicker
            v-model="cornellOptions.summaryTitleColor"
            type="color"
            defaultIndex="12"
          />
          字体色：
          <EnColorPicker
            v-model="cornellOptions.summaryFontColor"
            type="color"
          />
        </a-space>
        <div>
          <a-button
            @click="resetColors"
          >
            重置所有颜色
          </a-button>
        </div>
      </a-space>
    </a-modal>

    <template
      v-for="item of protyleAttrRef"
    >
      <Teleport
        v-if="getRef(item)"
        :disabled="!getRef(item)"
        :to="getRef(item)"
      >
        <a-button
          type="text"
          size="mini"
          shape="circle"
          @click="openModal"
        >
          <SyIcon
            name="iconTheme"
          />
        </a-button>
      </Teleport>
    </template>
  </div>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main';
import { Protyle } from 'siyuan';
import { moduleTamplatesName, ModuleTemplatesOptions } from './TemplateEntry.vue';
import { computed, onMounted, Ref, ref, watchEffect } from 'vue';
import { queryAllByDom } from '@/utils/DOM';
import { SyDomNodeTypes } from '@/utils/Siyuan';
import { debounce } from '@/utils';
import SyIcon from '@/components/SiyuanTheme/SyIcon.vue';
import EnColorPicker from '@/components/EnColorPicker.vue';
import { useSettingModule } from '../Settings/EnSettings.vue';

const plugin = usePlugin()

const module = useSettingModule(moduleTamplatesName)
const cornellOptions = computed(() => (module.value.data as ModuleTemplatesOptions).cornell)

const resetColors = () => {

  Object.keys(cornellOptions.value).forEach((key) => {
    cornellOptions.value[key] = (module.value.defaultValue as ModuleTemplatesOptions).cornell[key]
  })
}

watchEffect(() => {
  document.body.style.setProperty(`--en-cornell-note-bg-color`, cornellOptions.value.noteBgColor || `var(--b3-font-background2)`)
  document.body.style.setProperty(`--en-cornell-note-title-color`, cornellOptions.value.noteTitleColor || `var(--b3-font-color2)`)
  document.body.style.setProperty(`--en-cornell-note-font-color`, cornellOptions.value.noteFontColor || `var(--b3-theme-on-background)`)

  document.body.style.setProperty(`--en-cornell-clue-bg-color`, cornellOptions.value.clueBgColor || `var(--b3-font-background10)`)
  document.body.style.setProperty(`--en-cornell-clue-title-color`, cornellOptions.value.clueTitleColor || `var(--b3-font-color10)`)
  document.body.style.setProperty(`--en-cornell-clue-font-color`, cornellOptions.value.clueFontColor || `var(--b3-theme-on-background)`)

  document.body.style.setProperty(`--en-cornell-summary-bg-color`, cornellOptions.value.summaryBgColor || `var(--b3-font-background12)`)
  document.body.style.setProperty(`--en-cornell-summary-title-color`, cornellOptions.value.summaryTitleColor || `var(--b3-font-color12)`)
  document.body.style.setProperty(`--en-cornell-summary-font-color`, cornellOptions.value.summaryFontColor || `var(--b3-theme-on-background)`)
})


const configModalVisible = ref(false)
const openModal = () => {
  configModalVisible.value = true
}

const paragraphListRef = ref([])
const protyleAttrRef = ref([])

const getRef = (dom) => {
  return dom.querySelector('.enProtyleAttrContainer')
}

const appendEnProtyleAttrContainer = (dom: HTMLDivElement) => {
  const children = dom.children as any as HTMLDivElement[]
  const protyleAttr = Array.prototype.find.call(children, i => i.classList.contains('protyle-attr'))
  if (!protyleAttr) {
    return
  }
  const exist = !!protyleAttr.querySelector('.enProtyleAttrContainer')
  if (exist) {
    return
  }
  const span = document.createElement('span')
  span.className = 'enProtyleAttrContainer'
  span.contentEditable = 'false'

  protyleAttr.appendChild(span)
  protyleAttrRef.value.push(protyleAttr)
}
watchEffect(() => {
  const paragraphList = paragraphListRef.value

  paragraphList.forEach((dom: HTMLDivElement) => {
    appendEnProtyleAttrContainer(dom)
  })
})

function insertBlockTime() {
  const handler = () => {
    const paragraphList = queryAllByDom(document.body, `.protyle [data-type="${SyDomNodeTypes.NodeSuperBlock}"][custom-iscornell="true"]`) as HTMLDivElement[]
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

plugin.protyleSlash.push({
  filter: [
    "add template cornell",
    'atc',
    "插入模板 - 康奈尔",
  ],
  html: `<div class="b3-list-item__first"><span class="b3-list-item__text">${'插入模板 - 康奈尔'}</span></div>`,
  id: "enTemplateInsertCornell",
  callback(protyle: Protyle) {
    const iProtyle = protyle.protyle
    enLog('id is ', iProtyle.selectElement)
    protyle.insert(`{{{row\n{{{col\n{{{row\n线索\n{: style="" }\n{: style="" }\n}}}\n{{{row\n笔记\n{: style="" }\n{: style="" }\n}}}\n}}}\n{{{row\n总结\n{: style="" }\n{: style="" }\n}}}\n}}}\n{: custom-iscornell="true" }`);
  }
})
</script>

<style lang="scss">
[custom-iscornell="true"] {
  & > [data-type="NodeSuperBlock"] {
    // border: 1px solid var(--b3-border-color);
    margin: unset !important;

    // 上面
    &:first-child {
      border-bottom-left-radius: unset;
      border-bottom-right-radius: unset;

      // 左侧 线索区
      & [data-type="NodeSuperBlock"]:first-child {
        width: 33%;
        flex: 0 0 auto;
        margin: 0;
        margin-right: var(--en-gap);
        padding: var(--en-gap);
        background-color: var(--en-cornell-clue-bg-color);
        margin-bottom: var(--en-gap);
        border-top-right-radius: unset;
        border-bottom-left-radius: unset;
        border-bottom-right-radius: unset;
        border-radius: unset;
        flex: unset;
        height: auto;

        & > div {
          color: var(--en-cornell-clue-font-color);
        }
        & > div:first-child {
          color: var(--en-cornell-clue-title-color);
        }
      }

      // 右侧 笔记区
      & [data-type="NodeSuperBlock"]:not(:first-child) {
        border-left: unset;
        margin: 0;
        padding: var(--en-gap);
        background-color: var(--en-cornell-note-bg-color);
        margin-bottom: var(--en-gap);
        border-top-left-radius: unset;
        border-bottom-left-radius: unset;
        border-bottom-right-radius: unset;
        border-radius: unset;
        flex: 1;
        height: auto;

        & > div {
          color: var(--en-cornell-note-font-color);
        }
        & > div:first-child {
          color: var(--en-cornell-note-title-color);
        }
      }
    }


    // 下面 总结区
    &:not(:first-child) {
      border-top-left-radius: unset;
      border-top-right-radius: unset;
      border-radius: unset;
      background-color: var(--en-cornell-summary-bg-color);
      margin: 0;
      padding: var(--en-gap);

      & > div {
        color: var(--en-cornell-summary-font-color);
      }
      & > div:first-child {
        color: var(--en-cornell-summary-title-color);
      }
    }
  }
}
</style>
