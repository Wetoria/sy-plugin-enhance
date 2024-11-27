<template>
  <input
    class="b3-switch fn__flex-center"
    type="checkbox"
    :checked="modelValue"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
  />
</template>

<script setup lang="ts">
defineProps(['modelValue'])
defineEmits(['update:modelValue'])
</script>
