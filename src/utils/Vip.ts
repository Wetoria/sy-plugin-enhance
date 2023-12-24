import { usePlugin } from '@/main'
import { debounce } from '.'
import { SyDomNodeTypes, isSyNodeParagraphDom } from './Siyuan'
import { getBlockAttrs, request, setBlockAttrs } from '@/api'
import dayjs from 'dayjs'

const lifelogAttrKey = 'custom-lifelog-synced'

function autoCreateMemo() {
  const plugin = usePlugin()
  const data = []

  plugin.eventBus.on('ws-main', ({ detail }) => {
    if (detail.cmd === 'transactions') {
      data.push(...detail.data)
      run()
    }
  })

  const debounceTime = 3000
  const run = debounce(async () => {
    const updateOpts = []
    data.forEach((item) => {
      const { doOperations } = item
      doOperations.forEach((opt) => {
        if (opt.action == 'update') {
          updateOpts.push(opt)
        }
      })
    })

    updateOpts.reverse()

    const uniqueUpdateOpts = []

    updateOpts.forEach((opt) => {
      const exist = uniqueUpdateOpts.find(i => i.id === opt.id)
      if (!exist) {
        uniqueUpdateOpts.push(opt)
      }
    })

    const lastOpt = uniqueUpdateOpts[0]

    if (!lastOpt) {
      return
    }

    let dom = document.createElement('div')
    dom.innerHTML = lastOpt.data
    dom = dom.firstElementChild as HTMLDivElement
    if (isSyNodeParagraphDom(dom)) {
      const editDom = dom.firstElementChild


      const domInApp = document.querySelector(`[data-type="${SyDomNodeTypes.NodeParagraph}"][data-node-id="${lastOpt.id}"]`)
      if (!domInApp) {
        return
      }

      const blockAttrs = await getBlockAttrs(lastOpt.id)

      const synced = lifelogAttrKey in blockAttrs

      if (synced) {
        return
      }

      const content = editDom.textContent

      const isLifeLogParagraph = /^\d{2}:\d{2}/.test(content)
      if (!isLifeLogParagraph) {
        return
      }
      const time = (content.match(/^\d{2}:\d{2}/) || [])[0]
      const elseContent = content.replace(/^\d{2}:\d{2}\s+/, '')

      if (!elseContent) {
        return
      }

      const memoContent = `'${elseContent}@${time}\n\nsiyuan://blocks/${lastOpt.id}\n\n--synced by sy-plugin-enhance[${plugin.isMobile ? 'mobile' : 'desktop'}]'`

      if (plugin.isMobile) {
        const host = '';
        request(`${host}/shortcuts/createMemo?content=${encodeURIComponent(memoContent)}`, {
          content: memoContent
        })
      } else {
        const { exec } = require('child_process')
        const cmd = `echo ${memoContent} | shortcuts run LifeLog-Sy-自动创建备忘录`
        exec(cmd, (...args) => {
        })
      }
      setBlockAttrs(lastOpt.id, {
        [lifelogAttrKey]: dayjs().format('YYYY-MM-DD HH:mm:ss')
      })
    }

  }, debounceTime)

}

export function vip() {
  autoCreateMemo()
}
