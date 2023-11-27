import { onMounted, ref } from 'vue';
import { openDocById } from './Note';

let lastEditShownStatus
let lastDocId
export function useDocHistory() {
  const docHistory = ref([])
  const currentDocIndex = ref(-1);
  let byInner = false
  const goBack = () => {
    currentDocIndex.value -= 1
    if (currentDocIndex.value < 0) {
      currentDocIndex.value = 0
    }
    byInner = true
    openDocById(docHistory.value[currentDocIndex.value])
  }
  const goForward = () => {
    currentDocIndex.value += 1
    if (currentDocIndex.value > docHistory.value.length - 1) {
      currentDocIndex.value = docHistory.value.length - 1
    }
    byInner = true
    openDocById(docHistory.value[currentDocIndex.value])
  }

  onMounted(() => {
    let flag
    const ob = new MutationObserver(() => {
      if (flag) {
        clearTimeout(flag)
      }
      setTimeout(() => {
        const dom = document.querySelector('#editor')
        if (dom) {
          const editorIsHidden = dom.classList.contains('fn__none')
          if (lastEditShownStatus !== editorIsHidden) {

            if (editorIsHidden) {
              docHistory.value = []
              currentDocIndex.value = docHistory.value.length - 1;
            }
          }
          lastEditShownStatus = editorIsHidden;

          const d = dom.querySelector('.protyle-background')
          if (d && d.dataset.nodeId) {
            const currentDocId = d.dataset.nodeId;
            if (lastDocId !== currentDocId) {
              if (byInner) {
                byInner = false
              } else {
                docHistory.value.splice(currentDocIndex.value + 1)
                docHistory.value = [...docHistory.value, currentDocId]
                currentDocIndex.value = docHistory.value.length - 1
              }
            }
            lastDocId = currentDocId;
          }
        } else {
          console.log('oops')
        }
      }, 500)
    })
    ob.observe(document.body, {
      childList: true, // 观察目标子节点的变化，是否有添加或者删除
      subtree: true, // 观察后代节点，默认为 false
    })
  })

  return {
    goBack,
    goForward,
  }
}
