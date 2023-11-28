import { request } from '@/api';
import { usePlugin } from '@/main';

let added = false
const indicator = document.createElement('div')
indicator.className = 'indicator'
const dom = document.createElement('div')
dom.className = 'vBacklinkContainer'
dom.style.width = '100%';
dom.style.minHeight = '10px'
dom.style.padding = '10px 20px'
dom.style.display = 'flex'
dom.style.boxSizing = 'border-box'
dom.style.flexDirection = 'column'


const t = document.createElement('h2')
t.style.padding = '8px 0px'
t.style.marginBottom = '8px'
t.style.borderBottom = '1px solid var(--b3-list-hover, #363636)'
t.innerText = '反链'
dom.appendChild(t)

const blArea = document.createElement('div')
dom.appendChild(blArea)

export function renderDocBacklinks() {
  const plugin = usePlugin()

  console.warn('test')
  plugin.eventBus.on('loaded-protyle-static', ({ detail }) => {
    blArea.innerHTML = ''

    const contentArea = document.querySelector('.protyle-content')
    if (!contentArea) {
      return
    }

    if (!added) {
      contentArea.appendChild(indicator)
      contentArea.appendChild(dom)
      added = true
    }

    const currentDocId = detail?.protyle?.block?.id;
    console.log('currentDocId is ', currentDocId)
    if (currentDocId) {
      request('/api/ref/getBacklink2', {
        id: currentDocId,
        sort: '3',
        mSort: '3',
        k: '',
        mk: '',
      }).then((res) => {
        console.log('res is ', res)
        const { backlinks } = res;

        if (!backlinks.length) {
          blArea.innerHTML = '无'
          return
        }

        Promise.all(backlinks.map((item) => {
          return request('/api/ref/getBacklinkDoc', {
            defID: currentDocId,
            refTreeID: item.id,
            keyword: '',
          })
        })).then((results) => {

          console.log('result is ', results)

          const dom1 = document.createElement('div')
          dom1.className = 'vBacklinkContainer backlinkList'
          dom1.style.width = '100%';
          dom1.style.minHeight = '10px'
          dom1.style.padding = '10px 20px'
          dom1.style.display = 'flex'
          dom1.style.boxSizing = 'border-box'
          dom1.style.backgroundColor = 'var(--b3-list-hover, #363636)'
          dom1.style.borderRadius = 'var(--b3-border-radius)'

          const ul = document.createElement('ul')
          ul.className = 'b3-list b3-list--background'
          backlinks.forEach((item, index) => {
            const li = document.createElement('li')
            li.className = 'b3-list-item b3-list-item--hide-action'
            li.dataset.treetype = 'backlink'
            li.dataset.type = 'NodeDocument'
            li.dataset.subtype = ''

            const span = document.createElement('span')
            span.className = 'b3-list-item__text'
            span.innerText = item.name

            li.appendChild(span)
            ul.appendChild(li)


            const temp = results[index]
            const childBacklinks = temp.backlinks
            const div = document.createElement('div')
            div.className = 'protyle'

            const div2 = document.createElement('div')
            div2.className = 'protyle-content'
            div.appendChild(div2)

            const div3 = document.createElement('div')
            div3.className = 'protyle-wysiwyg protyle-wysiwyg--attr'
            div2.appendChild(div3)

            childBacklinks.forEach((child) => {
              div3.innerHTML += child.dom.replaceAll('contenteditable="true"', 'contenteditable="false"')
            })
            ul.appendChild(div)

            dom1.appendChild(ul)
            blArea.appendChild(dom1)
          })
        })
      })
    }
  })
}
