<template>
  <div></div>
  <Teleport
    v-for="contentEl of contentElementList"
    :to="contentEl"
    :key="(contentEl?.firstElementChild?.firstElementChild as  HTMLDivElement)?.dataset?.nodeId"
  >
    <LineageView
      :nodeId="(contentEl?.firstElementChild?.firstElementChild as  HTMLDivElement)?.dataset?.nodeId"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main';
import { onMounted, ref, watch, watchEffect } from 'vue';
import LineageView from './LineageView.vue';

const plugin = usePlugin()

const contentElementList = ref<HTMLDivElement[]>([])

const switchContentRecord = (protyle, type: 'switch' | 'unregister' = 'switch') => {
  const contentElement = protyle.contentElement as HTMLDivElement

  const exist = contentElementList.value.find(i => i === contentElement)

  const unregister = () => {
    contentElementList.value = contentElementList.value.filter(i => i !== contentElement)
    protyle.element.dataset.en_lineage_view_enabled = 'false'
  }

  if (type == 'unregister') {
    unregister()
  } else {
    if (!exist) {
      contentElementList.value.push(contentElement)
      protyle.element.dataset.en_lineage_view_enabled = 'true'
    } else {
      unregister()
    }
  }
}

onMounted(() => {
  plugin.eventBus.on('loaded-protyle-static', ({detail = {} }) => {
    enLog('detail is ', detail)
    const {
      protyle
    } = detail
    if (!protyle) {
      return
    }

    const element = protyle.element as HTMLDivElement
    const breadcrumbDom = element.querySelector('.protyle-breadcrumb')
    const readonlyBtnDom = breadcrumbDom.querySelector('button[data-type="readonly"]')

    const lineagePreviewBtn = document.createElement('button')
    lineagePreviewBtn.className = `block__icon fn__flex-center ariaLabel`
    lineagePreviewBtn.ariaLabel = 'Lineage Preview'
    lineagePreviewBtn.dataset.type = 'lineage_preview'
    lineagePreviewBtn.innerHTML = `<svg><use xlink:href="#iconExact"></use></svg>`

    breadcrumbDom.insertBefore(lineagePreviewBtn, readonlyBtnDom)

    // switchContentRecord(protyle)
    lineagePreviewBtn.addEventListener('click', () => {
      switchContentRecord(protyle)
    })
  })

  plugin.eventBus.on('destroy-protyle', ({ detail = {} }) => {
    const {
      protyle
    } = detail
    if (!protyle) {
      return
    }
    switchContentRecord(protyle)
  })
})

watchEffect(() => {
  enLog('contentElementList.value is ', contentElementList.value)
})
</script>

<style lang="scss">
.protyle[data-en_lineage_view_enabled="true"] {
  .protyle-content {
    position: relative;
  }
}
</style>
