<template>
  <div class="en-user-memo">
    <MemoInput
      v-model="newMemo"
      :is-editing="isEditing"
      @submit="addMemo"
      @cancel="cancelEdit"
    />
    <MemoToolbar />
    <MemoTimeline
      :memos="memos"
      @edit="editMemo"
      @delete="deleteMemo"
    />
  </div>
</template>

<script setup lang="ts">
import type { Memo } from './components/MemoTimeline.vue'
import { ref } from 'vue'
import MemoInput from './components/MemoInput.vue'
import MemoTimeline from './components/MemoTimeline.vue'
import MemoToolbar from './components/MemoToolbar.vue'

// 状态
const memos = ref<Memo[]>([])
const newMemo = ref('')
const isEditing = ref(false)
const editingIndex = ref(-1)

// 方法
const addMemo = () => {
  if (!newMemo.value.trim()) return

  if (isEditing.value && editingIndex.value !== -1) {
    // 更新现有备忘录
    memos.value[editingIndex.value] = {
      content: newMemo.value,
      time: `${new Date().toLocaleString()} (已编辑)`,
    }
    isEditing.value = false
    editingIndex.value = -1
  } else {
    // 添加新备忘录
    memos.value.unshift({
      content: newMemo.value,
      time: new Date().toLocaleString(),
    })
  }

  newMemo.value = ''
}

const editMemo = (index: number) => {
  isEditing.value = true
  editingIndex.value = index
  newMemo.value = memos.value[index].content
}

const deleteMemo = (index: number) => {
  memos.value.splice(index, 1)
}

const cancelEdit = () => {
  isEditing.value = false
  editingIndex.value = -1
  newMemo.value = ''
}
</script>

<style lang="scss">
.en-user-memo {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 8px;
  padding: 8px;
}
</style>
