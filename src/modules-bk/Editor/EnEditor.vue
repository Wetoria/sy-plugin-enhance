<template>
  <EnParagraphBlock />
  <Teleport
    v-for="protyleBottom of protyleBottomMap.values()"
    :key="protyleBottom.element"
    :to="protyleBottom.enArea"
  >
    <EnProtyleBottomContainer :protyleBottom="protyleBottom" />
  </Teleport>
</template>

<script setup lang="ts">
import { protyleBottomMap } from "@/utils/DOM"
import EnParagraphBlock from "./EnParagraphBlock.vue"
import EnProtyleBottomContainer from "./ProtyleBottom/EnProtyleBottomContainer.vue"
</script>

<script lang="ts"></script>

<style lang="scss"></style>
