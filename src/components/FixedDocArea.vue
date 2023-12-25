<template>
  <Teleport
    :to='fixedDocAreaRef'
  >
    <div
      class="main"
      @dragover="onDragOver"
      @drop="onDrop"
    >
      <div
        class="scrollArea"
      >
        <template
          v-if="fixedDocsInfo.length"
        >
        <div
            v-for="item of fixedDocsInfo"
            :key="item.id"
            class="fixedDocItem"
          >
            <span>
              {{ item.content }}
            </span>
            <div class="removeIcon">
              <SyIcon
                name="iconMin"
                size="10"
              />
            </div>
          </div>
        </template>
        <template v-else>
          <span class="promptText">拖动文档至此处，将其固定在这</span>
        </template>
      </div>
    </div>
  </Teleport>
  <!-- <div class="fixedDocAreaMask"></div> -->
</template>

<script setup lang="ts">
import { getBlockByID } from '@/api';
import { debounce } from '@/utils';
import { queryAllByDom } from '@/utils/DOM';
import { computed, ref, watchEffect } from 'vue';
import SyIcon from './SiyuanTheme/SyIcon.vue';
import { useSettings } from '@/logic';

const settings = useSettings()

const containerClassName = 'enFixedDocArea'

const draggingNodeId = ref(null)

const fixedDocArea = document.createElement('div')
fixedDocArea.className = containerClassName
let fixedDocAreaRef = ref(fixedDocArea)

const onEachDragStart = (event) => {
  const nodeId = (event.target as HTMLElement).dataset.nodeId
  if (!nodeId) {
    return
  }

  draggingNodeId.value = nodeId
}
const handler = () => {
  const targetElement = document.querySelector('.layout__center .layout-tab-container')
  if (!targetElement) {
    return
  }
  const preDom = targetElement.previousElementSibling
  if (preDom.classList.contains(containerClassName)) {
    return
  }
  targetElement.parentNode.insertBefore(fixedDocArea, targetElement);
}
const bindDragStart = () => {
  const draggableDoms = queryAllByDom(document.body, '[draggable="true"]')
  // console.log('draggableDoms is ', draggableDoms)
  draggableDoms.forEach((drabbleDom: HTMLElement) => {
    if (drabbleDom.dataset.enBindedDragStart) {
      return
    }

    drabbleDom.addEventListener('dragstart', onEachDragStart)
  })
}


handler()
bindDragStart()
const observer = new MutationObserver(debounce(() => {
  handler()
  bindDragStart()
}, 100));
observer.observe(document.documentElement, {
  childList: true, // 观察目标子节点的变化，是否有添加或者删除
  subtree: true, // 观察后代节点，默认为 false
})



const onDragOver = (event: DragEvent) => {
  event.preventDefault()

  if (!draggingNodeId.value) {
    const dom: HTMLElement = document.body.querySelector('.protyle-wysiwyg--hl')
    if (dom) {
      const nodeId = dom.dataset.nodeId
      if (!nodeId) {
        return
      }
      draggingNodeId.value = nodeId
    }
  }
}

console.log('settings.value.fixedDocIds is ', settings.value.fixedDocIds)
const fixedDocInfoMap = ref({})
const fixedDocIds = computed(() => {
  const list = settings.value.fixedDocIds || []
  const initMap = {}
  list.forEach((i) => {
    initMap[i] = {}
  })
  fixedDocInfoMap.value = initMap
  return list
})
const saveDocId = (id) => {

  const exist = fixedDocInfoMap.value[id]
  if (exist) {
    return
  }
  fixedDocIds.value.push(id)
  fixedDocInfoMap.value[id] = {}
}

const removeDocId = (id) => {
  const exist = fixedDocInfoMap.value[id]
  if (!exist) {
    return
  }

  settings.value.fixedDocIds = fixedDocIds.value.filter(i => i != id)
  fixedDocInfoMap.value[id] = null
}
const onDrop = () => {

  const newNodeId = draggingNodeId.value
  draggingNodeId.value = null
  if (!newNodeId) {
    return
  }

  saveDocId(newNodeId)

}

const fixedDocsInfo = ref([])
watchEffect(async () => {
  let result = []

  console.log('test')
  for (let index = 0; index < fixedDocIds.value.length; index++) {
    const docId = fixedDocIds.value[index]
    const docInfo = fixedDocInfoMap.value[docId]

    const gotDocInfo = docInfo.id
    if (gotDocInfo) {
      result.push(docInfo)
      continue
    }

    result[index] = {}
    const data = await getBlockByID(docId)
    fixedDocInfoMap.value[docId] = data
    result[index] = data
  }

  fixedDocsInfo.value = result
})

</script>

<style lang="scss">
.enFixedDocArea {
  width: 100%;
  height: 34px;
  display: flex;
}
</style>

<style lang="scss" scoped>
.main {
  flex: 1;
  display: flex;
  overflow-y: hidden;
  overflow-x: auto;
  padding: 4px 8px;
  box-sizing: border-box;
  z-index: 1;

  .scrollArea {
    flex-wrap: nowrap;
    align-items: center;
    display: flex;
    gap: 8px;
  }

  .fixedDocItem {
    padding: 2px 8px;
    border: 1px solid var(--v-border-color);
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 6px;
    white-space: nowrap;
    position: relative;

    .removeIcon {
      width: 12px;
      height: 12px;
      border-radius: 100%;
      border: 1px solid;
      display: flex;
      justify-content: center;
      align-items: center;
      position: absolute;
      top: -6px;
      right: -6px;
      visibility: hidden;
      background-color: var(--b3-theme-background);
    }

    &:hover .removeIcon {
      visibility: visible;
    }
  }

  .promptText {
    color: #d1d1d1;
  }
}
.fixedDocAreaMask {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
}
</style>
