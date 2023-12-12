<template>
    <div>
        <div class="backlinkDocBlockTitleLineSticky">
            <div class="backlinkDocBlockTitleLine" @click="switchBacklinkDocBlockFoldStatus(docBacklink)">
                <div class="backlinkDocBlockFolder" :style="{
                    transform: `rotateZ(${docBacklinkFoldStatusMap[docBacklink.id] ? '0' : '90'}deg)`,
                }">
                    <SyIcon name="iconPlay" size="10" />
                </div>
                <li class="b3-list-item b3-list-item--hide-action">
                    <span class="b3-list-item__text">{{ docBacklink.name }}</span>
                </li>
            </div>
        </div>
        <ul>
            <div v-for="blockBacklinkData of backlinkData" :key="blockBacklinkData.dom">
                <backlinkDocBlock
                  :parent-data="[]"
                  :filter-list="filterList"
                  :block-backlink-data="blockBacklinkData"
                  :displayMap="displayMap"
                  :current-doc-id="currentDocId"
                  :docBacklinkFoldStatus="docBacklinkFoldStatusMap[docBacklink.id]"
                />
            </div>
        </ul>
    </div>
</template>
<script setup lang="ts">
import backlinkDocBlock from '@/components/Backlink/BacklinkDocBlock.vue';
import SyIcon from '@/components/SiyuanTheme/SyIcon.vue'
const props = defineProps({
    backlinkData: Object,
    displayMap: Object,
    docBacklinkFoldStatusMap: Object,
    docBacklink: Object,
    currentDocId: String,
    testNumber: Number,
    filterList: Array<{
      key: string;
      include: boolean;
    }>,
})
console.log(props.backlinkData)
const emit = defineEmits(['switchBacklinkDocBlockFoldStatus'])
const switchBacklinkDocBlockFoldStatus = (docBacklink) => {
    emit('switchBacklinkDocBlockFoldStatus', docBacklink)
}
</script>
<style scoped lang="scss">
.backlinkDocBlockTitleLineSticky {
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
}

.backlinkDocBlockTitleLine {
    width: 100%;
    align-items: center;
    cursor: pointer;
    display: flex;
    position: relative;
    background: var(--v-backlink-area-bg-color);
    // border-top-right-radius: var(--v-backlink-area-border-radius);
    // border-top-left-radius: var(--v-backlink-area-border-radius);
    padding: 2px 0px;

    .backlinkDocBlockFolder {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--b3-theme-on-surface-light);
        z-index: 1;
        transition: all 0.1s linear;
        visibility: hidden;
    }

    &:hover .backlinkDocBlockFolder,
    .backlinkDocBlockFolder:hover {
        visibility: visible;
    }
}
</style>
