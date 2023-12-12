<template>
    <div :class="filterSuccess ? '' : 'fn__none'">
        <div
            ref="renderRef"
            @mouseleave="onMouseLeave"
            @click="renderProtyle"
            :style="{
                height: docBacklinkFoldStatus ? '0px' : 'max-content',
                overflow: 'hidden',
            }"
        >
            <div class="protyle">
                <div class="protyle-content">
                    <div class="protyle-wysiwyg protyle-wysiwyg--attr">
                        <div ref="preBreadcrumb">

                        </div>
                        <div ref="preRenderRef">

                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import { hideGutterOnTarget } from '@/utils/DOM';
import { Protyle } from 'siyuan';
import { usePlugin } from '@/main';
import { ref, onMounted, watch } from 'vue';
const props = defineProps({
    parentData: Array<any>,
    filterList: Array<Object>,
    blockBacklinkData: Object,
    displayMap: Object,
    docBacklinkFoldStatus: Boolean,
    currentDocId: String
})
const renderRef = ref()
const preRenderRef = ref()
const preBreadcrumb = ref()
let blockID = ref()
const filterSuccess = ref(true)
let render = false
const onMouseLeave = (event) => {
    hideGutterOnTarget(event.target)
}
const plugin = usePlugin()
let blockPaths: any[] = props.blockBacklinkData.blockPaths
let length = blockPaths.length
console.log(111111)
blockID.value = blockPaths[length - 1].id
console.log(props.blockBacklinkData)
const renderProtyle = () => {
    if (render) {
        return
    }
    console.log("render")
    new Protyle(
        plugin.app,
        renderRef.value,
        {
            blockId: props.currentDocId,
            backlinkData: [props.blockBacklinkData],
            render: {
                background: false,
                title: false,
                gutter: true,
                scroll: false,
                breadcrumb: false,
            }
        }
    );
    ((renderRef.value as HTMLElement).querySelector('.protyle-wysiwyg.protyle-wysiwyg--attr div.protyle-breadcrumb__item[contenteditable="false"]') as HTMLElement)?.click()
    render = true
}

const getIconByType = (type: string, sub?: string) => {
    let iconName = "";
    switch (type) {
        case "NodeDocument":
            iconName = "iconFile";
            break;
        case "NodeThematicBreak":
            iconName = "iconLine";
            break;
        case "NodeParagraph":
            iconName = "iconParagraph";
            break;
        case "NodeHeading":
            if (sub) {
                iconName = "icon" + sub.toUpperCase();
            } else {
                iconName = "iconHeadings";
            }
            break;
        case "NodeBlockquote":
            iconName = "iconQuote";
            break;
        case "NodeList":
            if (sub === "t") {
                iconName = "iconCheck";
            } else if (sub === "o") {
                iconName = "iconOrderedList";
            } else {
                iconName = "iconList";
            }
            break;
        case "NodeListItem":
            iconName = "iconListItem";
            break;
        case "NodeCodeBlock":
        case "NodeYamlFrontMatter":
            iconName = "iconCode";
            break;
        case "NodeTable":
            iconName = "iconTable";
            break;
        case "NodeBlockQueryEmbed":
            iconName = "iconSQL";
            break;
        case "NodeSuperBlock":
            iconName = "iconSuper";
            break;
        case "NodeMathBlock":
            iconName = "iconMath";
            break;
        case "NodeHTMLBlock":
            iconName = "iconHTML5";
            break;
        case "NodeWidget":
            iconName = "iconBoth";
            break;
        case "NodeIFrame":
            iconName = "iconLanguage";
            break;
        case "NodeVideo":
            iconName = "iconVideo";
            break;
        case "NodeAudio":
            iconName = "iconRecord";
            break;
        case "NodeAttributeView":
            iconName = "iconDatabase";
            break;
    }
    return iconName;
};

// 传递型折叠处理
const foldPassiveType = (expand: boolean, element: HTMLElement | DocumentFragment) => {
    if (element.firstElementChild.classList.contains("li")) {
        if (expand) {
            element.querySelectorAll(".li .li").forEach(item => {
                if (item.childElementCount > 3) {
                    item.setAttribute("fold", "1");
                }
            });
        } else {
            element.firstElementChild.setAttribute("fold", "1");
        }
    } else if (element.firstElementChild.getAttribute("data-type") === "NodeHeading") {
        Array.from(element.children).forEach((item, index) => {
            if ((expand && index > 2) || (!expand && index > 1)) {
                if ((expand && index === 3) || (!expand && index === 2)) {
                    item.insertAdjacentHTML("beforebegin", '<div style="max-width: 100%;justify-content: center;" contenteditable="false" class="protyle-breadcrumb__item"><svg><use xlink:href="#iconMore"></use></svg></div>');
                }
                item.classList.add("fn__none");
            }
        });
    }
};

const setBacklinkFold = (html: string, expand: boolean) => {
    const tempDom = document.createElement("template");
    tempDom.innerHTML = html;
    foldPassiveType(expand, tempDom.content);
    return tempDom.innerHTML;
};

const genBreadcrumb = (blockPaths: IBreadcrumb[], renderFirst = false) => {
    let html = "";
    blockPaths.forEach((item, index) => {
        if (index === 0 && !renderFirst) {
            return;
        }
        html += `<span class="protyle-breadcrumb__item${index === blockPaths.length - 1 ? " protyle-breadcrumb__item--active" : ""}" data-id="${item.id}">
    <svg class="popover__block" data-id="${item.id}"><use xlink:href="#${getIconByType(item.type, item.subType)}"></use></svg>
    <span class="protyle-breadcrumb__text" title="${item.name}">${item.name}</span>
</span>`;
        if (index !== blockPaths.length - 1) {
            html += '<svg class="protyle-breadcrumb__arrow"><use xlink:href="#iconRight"></use></svg>';
        }
    });
    return `<div contenteditable="false" style="margin-bottom: 8px" class="protyle-breadcrumb__bar protyle-breadcrumb__bar--nowrap">${html}</div>`;
};

const checkNodeListWithFilterInclude = (nodeList, filterList) => {
    let htmlStr = ''
    let ret = true
    for (let node of nodeList) {
        htmlStr += node.innerHTML
    }
    for (let filter of filterList) {
        if (filter.include) {
            if (htmlStr.includes(filter.key)) {
                continue
            } else {
                ret = false
                return ret
            }
        }
    }
    return ret
}

const checkNodeListWithFilterExclude = (nodeList, filterList) => {
    let htmlStr = ''
    let ret = false
    for (let node of nodeList) {
        htmlStr += node.innerHTML
    }
    for (let filter of filterList) {
        if (!filter.include) {
            if (htmlStr.includes(filter.key)) {
                ret = true
                return ret
            }
        }
    }
    return ret
}

const hiddenNode = (node) => {
    node.classList.add("fn__none")
    node.classList.add("backlink-query-hidden")
}
const showNode = (node)=>{
    console.log("show")
    let hiddenNodeList = node.querySelectorAll('.backlink-query-hidden')
    for (let hiddenNode of hiddenNodeList){
        hiddenNode.classList.remove('backlink-query-hidden')
        hiddenNode.classList.remove('fn__none')
    }
}

const isLeftBlock = (node) => {
    let nodeType = node.dataset.type
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

const exactSubNode = (node) => {
    return [...node.querySelectorAll(":scope > div[data-node-id]")]
}

const checkAllSubContainerBlock = (subContainerBlockList, filterList, parentNodeList) => {
    let ret = false
    if (subContainerBlockList.length === 0) {
        ret = true
    }
    for (let subContainerBlock of subContainerBlockList) {
        if (filterByString(subContainerBlock, filterList, parentNodeList)) {
            ret = true
        }
    }
    return ret
}

function filterByString(node, filterList, parentNodeList) {
    let road = [...parentNodeList]
    // console.log(node.innerText)
    if (!checkNodeListWithFilterInclude([...parentNodeList, node], filterList)) {
        hiddenNode(node)
        return false
    }
    if ((isLeftBlock(node) && checkNodeListWithFilterExclude([...parentNodeList, node], filterList)) ||
        (!isLeftBlock(node) && checkNodeListWithFilterExclude([...parentNodeList], filterList))) {
        hiddenNode(node)
        return false
    }

    if (isLeftBlock(node) ||
        (!checkNodeListWithFilterExclude([...parentNodeList, node], filterList)) &&
        checkNodeListWithFilterInclude([...parentNodeList], filterList)) {
        return true
    }
    let subNodeList = exactSubNode(node)
    let subContainerBlockList = []
    let subLeftBlockList = []
    let originRoad = [...road]
    for (let subNode of subNodeList) {
        if (isLeftBlock(subNode)) {
            road.push(subNode)
            subLeftBlockList.push(subNode)
        } else {
            subContainerBlockList.push(subNode)
        }
    }
    if (subContainerBlockList.length === 0) {
        if (!checkAllSubContainerBlock(subLeftBlockList, filterList, originRoad)) {
            hiddenNode(node)
            return false
        }
    }
    if (!checkAllSubContainerBlock(subContainerBlockList, filterList, road)) {
        hiddenNode(node)
        return false
    }
    return true
}

const checkAndFilter = (parentData, filterList) => {
    console.log("start Check")
    if (!parentData || !filterList) {
        return true
    }
    let nodeList
    if (render) {
        nodeList = renderRef.value.querySelectorAll('.protyle-wysiwyg.protyle-wysiwyg--attr > div[data-node-id]')
    }
    else {
        nodeList = renderRef.value.querySelectorAll('.protyle-wysiwyg.protyle-wysiwyg--attr > div > div[data-node-id]')
    }

    return checkAllSubContainerBlock([...nodeList], filterList, parentData)
}

watch(props, () => {
    showNode(renderRef.value)
    filterSuccess.value = checkAndFilter(props.parentData, props.filterList)
})


onMounted(() => {
    preBreadcrumb.value.innerHTML = genBreadcrumb(props.blockBacklinkData.blockPaths)
    preRenderRef.value.innerHTML = setBacklinkFold(props.blockBacklinkData.dom, props.blockBacklinkData.expand)
    filterSuccess.value = checkAndFilter(props.parentData, props.filterList)
})

</script>

<style scoped lang="scss">
.protyle {
    background: unset;
    min-height: unset;

    :deep(.protyle-wysiwyg) {
        padding: 0px 36px;

        .protyle-breadcrumb__bar {
            min-height: unset;
            margin-bottom: unset !important;
            flex-wrap: wrap;

            .protyle-breadcrumb__item:only-child {
                display: none;
            }

            .protyle-breadcrumb__item.protyle-breadcrumb__item--active {
                // display: none;

                .protyle-breadcrumb__text {
                    display: none;
                }

                &~.protyle-breadcrumb__item .protyle-breadcrumb__text {
                    display: none;
                }
            }
        }

        .protyle-breadcrumb__bar:not(:first-child) {
            border-top: 1px solid var(--v-border-color);
        }

        .img:not([style]) {
            display: inline-block;
        }
    }
}
</style>
