<template>
  <slot></slot>
</template>

<script setup lang="ts">
import {
  provide,
  ref,
  watchEffect,
} from 'vue'

const auth = ref({
  auth: 'test',
})
provide('auth', auth)
watchEffect(() => {
  console.log('auth is ', auth.value)
})
</script>

<style lang="scss" scoped>

</style>
