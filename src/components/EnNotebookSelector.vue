<template>
  <a-select
    placeholder="选择笔记本"
    v-model="notebookId"
    v-bind="$attrs"
  >
    <a-option
      v-for="notebook of notebookList"
      :key="notebook.id"
      :value="notebook.id"
      :label="notebook.name"
    >
    </a-option>
  </a-select>
</template>

<script setup lang="ts">
defineProps<{
  notebookList: Notebook[]
}>()
const notebookId = defineModel<string>()
</script>

<style lang="scss" scoped>

</style>
