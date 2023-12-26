
import { EnhanceIOperation, SyDomNodeTypes, onEditorUpdate } from '../../utils/Siyuan'
import { getBlockAttrs, request, setBlockAttrs } from '@/api'
import { useSettings } from '@/logic'
import { usePlugin } from '@/main'
import { getFrontend } from 'siyuan'

const lifelogPrefix = 'custom-lifelog-'
const lifelogAttrTime = `${lifelogPrefix}time`
const lifelogAttrType = `${lifelogPrefix}type`
const lifelogAttrContent = `${lifelogPrefix}content`

export function markLifeLogBlock() {
  const settings = useSettings()

  const plugin = usePlugin()

  onEditorUpdate(async (operations: EnhanceIOperation[]) => {
    let optList = operations.filter(i => i.text)
    optList.sort((a, b) => a.timestamp - b.timestamp)

    const optMap = {}

    optList.forEach((opt: EnhanceIOperation) => {
      optMap[opt.id] = opt
    })

    optList = Object.values(optMap)
    optList = optList.filter(i => i.nodeType === SyDomNodeTypes.NodeParagraph)


    const records: LifeLogItem[] = []
    for (const opt of optList) {
      const blockAttrs = await getBlockAttrs(opt.id)

      const synced = lifelogAttrType in blockAttrs

      const content = opt.text

      // const isLifeLogParagraph = /^\d{2}:\d{2}\s+/.test(content)
      const isLifeLogParagraph = /^\d{2}:\d{2}\s+.*?🫧$/.test(content)
      if (!isLifeLogParagraph) {
        return
      }
      const time = (content.match(/^\d{2}:\d{2}/) || [])[0]
      const elseContent = content.replace(/^\d{2}:\d{2}\s+/, '').replace('🫧', '')

      if (!elseContent) {
        return
      }
      let colonIndex = elseContent.indexOf('：')
      colonIndex = colonIndex < 0 ? elseContent.length : colonIndex
      const logType = elseContent.substring(0, colonIndex)
      const logContent = elseContent.substring(colonIndex + 1, elseContent.length)

      if (!synced) {
        records.push({
          time,
          type: logType,
          content: logContent,
          syBlockId: opt.id,
          isMobile: plugin.isMobile,
        })
      }

      setBlockAttrs(opt.id, {
        [lifelogAttrTime]: time,
        [lifelogAttrType]: logType,
        [lifelogAttrContent]: logContent,
      })
    }

    const settings = useSettings()
    const lifelogPostUrl = settings.value.lifelogPostUrl
    if (!lifelogPostUrl) {
      return
    }

    const frontEnd = getFrontend();

    if (!plugin.isMobile || frontEnd === "mobile") {
      request(
        lifelogPostUrl + `?data=${encodeURIComponent(JSON.stringify(records))}`,
        {
          data: records,
        }
      ).catch((err) => {
        console.error('[Enhance]| LifeLog Post Error: ', err)
      })
    }

  }, settings.value.lifelogTriggerTime * 1000)
}
