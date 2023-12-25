import { usePlugin } from '@/main';

function querySelector(str) {
  return document.body.querySelector(str)
}

function hide(dom: HTMLElement) {
  dom.classList.toggle('fn__none', true)
}
function show(dom: HTMLElement) {
  dom.classList.toggle('fn__none', false)
}

export function hackSiyuanMobile() {
  const plugin = usePlugin()

  if (!plugin.isMobile) {
    return
  }

  const toolbarDom = querySelector('.toolbar')
  if (toolbarDom) {
    hide(toolbarDom)
  }

  // const editorDom = querySelector('#editor')
  // if (editorDom) {
  //   hide(editorDom)
  //   editorDom.style.display = 'none'
  // }

  document.documentElement.addEventListener('touchmove', (event) => {
    event.stopPropagation()
  }, true)

  const dom = document.createElement('div')
  dom.classList.toggle('enhance-hack-ui')
  document.body.append(dom)
}
