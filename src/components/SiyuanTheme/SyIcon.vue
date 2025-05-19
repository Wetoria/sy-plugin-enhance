<template>
  <svg
    :style="{
      fontSize: `${size}px`,
      width: `${size}px`,
      height: `${size}px`,
      color: disabled ? 'var(--b3-empty-color)' : undefined,
    }"
    class="enSyIcon"
  >
    <use :xlink:href="`#${name}`"></use>
  </svg>
</template>

<script setup lang="ts">
defineProps({
  name: String,
  size: {
    type: [Number, String],
    default: 12,
  },
  disabled: Boolean,
})
</script>

<style lang="scss" scoped>

</style>
