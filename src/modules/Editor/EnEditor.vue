<template>
  <EnParagraphBlock />
  <Teleport
    v-for="protyleBottom of protyleBottomMap.values()"
    :to="protyleBottom.enArea"
  >
    <EnProtyleBottomContainer :protyleBottom="protyleBottom" />
  </Teleport>
</template>

<script setup lang="ts">
import EnParagraphBlock from "./EnParagraphBlock.vue";
import EnProtyleBottomContainer from "./ProtyleBottom/EnProtyleBottomContainer.vue";
import { protyleBottomMap } from "@/utils/DOM";
</script>
<script lang="ts"></script>

<style lang="scss"></style>
