<template>
  <svg
    :style="{
      fontSize: size,
      width: size,
      height: size,
    }"
  >
    <use :xlink:href="`#${name}`"></use>
  </svg>
</template>

<script setup lang="ts">
defineProps({
  name: String,
  size: {
    type: [Number, String],
    default: 12
  },
})
</script>
