<template>
  <input
    class="b3-switch fn__flex-center"
    type="checkbox"
    :checked="modelValue"
    @input="$emit('update:modelValue', $event.target.checked)"
  />
</template>

<script setup lang="ts">
defineProps(['modelValue'])
defineEmits(['update:modelValue'])
</script>
