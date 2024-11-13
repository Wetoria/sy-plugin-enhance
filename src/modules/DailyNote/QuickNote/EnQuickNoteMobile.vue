<template>
  <Teleport to="body">
    <a-modal
    v-model:visible="quickNoteModalVisible"
    class="enQuickNoteModal"
    modal-class="enQuickNoteContainer"
    :mask="false"
    :alignCenter="false"
    :closable="false"
  >
    <template #title>
      添加日记
    </template>
    <div
      class="enCommentContainerContent"
    >
      <a-spin dot :loading="isCreatingDailyNote">
        <EnProtyle
          :blockId="currentBlockId"
          :options="{
            action: ['cb-get-html', 'cb-get-all'],
          }"
          @after="onAfterRender"
          disableEnhance
        />
      </a-spin>
    </div>

    <template #footer>
      <a-button
        type="primary"
        size="small"
        @click="quickNoteModalVisible = false"
      >
        关闭
      </a-button>
    </template>
    </a-modal>
  </Teleport>
</template>

<script setup lang="ts">
import { deleteBlock } from '@/api';
import { useEnhancer } from '@/modules/GlobalStatus';
import { Protyle, showMessage } from 'siyuan';
import { ref, watch } from 'vue';
import { getNewDailyNoteBlockId } from '@/modules/DailyNote/DailyNote.vue';
import EnProtyle from '@/components/EnProtyle.vue';

const protyleRef = ref<Protyle>()
const onAfterRender = (protyle: Protyle) => {
  const flag = setInterval(() => {
    const target = protyle.protyle.contentElement.querySelector(`[data-node-id="${currentBlockId.value}"]`) as HTMLElement
    enLog('target', target, target.dataset.nodeId)
    if (target) {
      clearInterval(flag)
      const editableDom = target.firstElementChild as HTMLElement

      editableDom.dispatchEvent(new MouseEvent('click'))
      editableDom.setAttribute("placeholder", '写点什么');

      protyle.focusBlock(target, false)
      isCreatingDailyNote.value = false
    }
  }, 0)
  enLog('onAfterRender', protyle)
  protyleRef.value = protyle
}


const destoryProtyle = () => {
  if (!protyleRef.value) {
    return
  }
  const protyle = protyleRef.value.protyle
  if (!protyle.updated && currentBlockId.value) {
    deleteBlock(currentBlockId.value)
  }
  currentBlockId.value = ''
}

watch(quickNoteModalVisible, (visible) => {
  if (!visible) {
    destoryProtyle()
  }
})
</script>

<script lang="ts">
const isCreatingDailyNote = ref(false)
const quickNoteModalVisible = ref(false)
const currentBlockId = ref()


export async function createTodayDailyNote() {
  const enhancer = useEnhancer()
  if (enhancer.value.isSync) {
    showMessage('正在同步中，请等待同步完成再创建笔记', 1000)
    return
  }

  if (quickNoteModalVisible.value) {
    return
  }
  isCreatingDailyNote.value = true

  const blockId = await getNewDailyNoteBlockId()

  quickNoteModalVisible.value = true

  currentBlockId.value = blockId
}
</script>

<style lang="scss" scoped>

</style>
