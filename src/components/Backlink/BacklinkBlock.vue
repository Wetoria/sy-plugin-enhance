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
                  :parent-data="ParentData[getBlockID(blockBacklinkData)]"
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
import {fetchSyncPost} from "siyuan"
import { ref, watch } from 'vue'
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

const getBlockID = (blockBacklinkData)=>{
    let blockPaths = blockBacklinkData.blockPaths
    let lastItem = blockPaths[blockPaths.length - 1]
    // console.log(blockBacklinkData,lastItem)
    return lastItem.id
}

const ParentData = ref({})

console.log(props.backlinkData)
const emit = defineEmits(['switchBacklinkDocBlockFoldStatus'])
const switchBacklinkDocBlockFoldStatus = (docBacklink) => {
    emit('switchBacklinkDocBlockFoldStatus', docBacklink)
}

const isLeftBlock = (nodeType)=>{
    switch (nodeType) {
    case 'NodeHeading':
    case 'NodeParagraph':
    case 'NodeTable':
    case 'NodeMathBlock':
    case 'NodeCodeBlock':
    case 'NodeHTMLBlock':
        return true
    default:
        return false
    }
}


const getParentRefData = async (backlinkData) => {
    let blockPathsList = backlinkData.map(x => {
        let blockPaths = [...x.blockPaths]
        let lastItem = blockPaths.slice(blockPaths.length-1,blockPaths.length)
        let res = blockPaths.slice(0,blockPaths.length)
        return [lastItem[0].id, res]
    }
    )
    let refMap = {}
    let allLeft = []
    let allContainer = []
    blockPathsList.map(blockPaths => {
        let container = blockPaths[1].filter(x => { return !isLeftBlock(x.type) && x.type != 'NodeDocument' })
        let left = blockPaths[1].filter(x => isLeftBlock(x.type))
        blockPaths[1].map(x => {
            let temp = refMap[x.id]
            if (temp) {
                temp.push(blockPaths[0])
                refMap[x.id] = temp
            } else {
                refMap[x.id] = [blockPaths[0]]
            }
        }
        )
        container.map(x => allContainer.push(x.id))
        left.map(x => allLeft.push(x.id))
        // return [blockPaths[0], [container, left]]
    }
    )



    let sqlStmt = `
with refParent as (select id, parent_id, type from blocks where 
(parent_id in ('${allContainer.join('\',\'')}') and type = 'p')
 or id  in  ('${allLeft.join('\',\'')}')
)
select def_block_id, markdown, content,  refParent.id, refParent.parent_id, refParent.type as type, 'ref' as mark_type from refs, refParent
where refs.block_id = refParent.id
limit 1024
`



    let sqlData = await fetchSyncPost('/api/query/sql', {
        stmt: sqlStmt
    })
    let refParentMap = {}

    for (let item of sqlData.data) {
        let refID
        if (item.type == "p") {
            refID = item.parent_id
        } else {
            refID = item.id
        }
        let backlinkList = refMap[refID]
        for (let backlink of backlinkList) {
            let temp = refParentMap[backlink]
            if (temp) {
                // console.log("two", x, blockPaths[0])
                temp.push(item)
                refParentMap[backlink] = temp
            } else {
                refParentMap[backlink] = [item]
            }
        }
    }
    return refParentMap
}
const buildRefElement = (refParentData)=>{
    let refElementMap = {}
    let keys = Object.keys(refParentData)
    for (let key of keys){
        let blockParentData = refParentData[key]
        let refElementList = []
        for (let item of blockParentData){
            let elemContainer = document.createElement('div')
            let elem = document.createElement('div')
            elem.dataset.id = item['def_block_id']
            elem.dataset.type = "block-ref"
            elem.innerText = item['content']
            elemContainer.append(elem)
            refElementList.push(elemContainer)
        }
        refElementMap[key] = refElementList
    }
    return refElementMap
}
const buildDocmentElemMap = (docId)=>{
    let elemContainer = document.createElement('div')
    let elem = document.createElement('div')
    elem.dataset.type = "NodeDocument"
    elem.dataset.nodeId = docId
    elemContainer.append(elem)
    return elemContainer 
}
const computeParentData= async(backlinkData,docId)=>{
    let parentData = {}
    let docElem = buildDocmentElemMap(docId)
    let blockIdList =  backlinkData.map(x=>getBlockID(x))
    console.log(blockIdList)
    let refParentData = await getParentRefData(backlinkData)
    let refParentElemMap = buildRefElement(refParentData)
    
    for (let blockId of blockIdList){
        let refParentElemList = refParentElemMap[blockId] ? refParentElemMap[blockId] : []
        let domList = [...refParentElemList,docElem]
        parentData[blockId] = domList
    }
    return parentData
}

watch(props, async()=>{
    if (props.backlinkData && props.currentDocId){
        ParentData.value = await computeParentData(props.backlinkData,props.currentDocId)
    }
})
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
