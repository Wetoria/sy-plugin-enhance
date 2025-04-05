import { showMessage } from 'siyuan'

export const getEVAParamsByUrl = (url) => {
  const urlObj = new URL(url)
  const urlSP = urlObj.searchParams
  const time = urlSP.get('t')
  const bid = urlSP.get('bid')
  return {
    time,
    bid,
  }
}


const convertTimeStrToSeconds = (str: string = '') => {
  const parts = str.split('.')
  const msPart = parts[1] || 0
  const hmsParts = parts[0].split(':').reverse()
  const secondPart = Number(hmsParts[0] || 0)
  const minutePart = Number(hmsParts[1] || 0)
  const hourPart = Number(hmsParts[2] || 0)

  const currentTimeValue = `${(hourPart * 60 + minutePart) * 60 + secondPart}.${msPart}`
  return Number(currentTimeValue)
}

export const getTimeResultByTimeStr = (timeStr: string) => {
  const isTimeBlock = timeStr.includes('~') || timeStr.includes('-')
  const splitSymbol = timeStr.includes('~') ? '~' : '-'
  const isLoop = isTimeBlock && splitSymbol == '~'

  const timeStrParts = timeStr.split(splitSymbol)
  const startTimeStr = timeStrParts[0]
  const endTimeStr = timeStrParts[1]

  const startTime = convertTimeStrToSeconds(startTimeStr)
  const endTime = convertTimeStrToSeconds(endTimeStr)

  return {
    startTime,
    endTime,
    isTimeBlock,
    isLoop,
  }
}



let setVNATimeflag
export const setVideoTime = ({
  bid,
  time,
}) => {
  const node = document.body.querySelector(`div[data-node-id="${bid}"]`)

  if (!node) {
    return
  }

  if (setVNATimeflag) {
    clearInterval(setVNATimeflag)
  }

  const allSyNodes = document.body.querySelectorAll(`div[data-node-id="${bid}"]`)

  allSyNodes.forEach((node) => {
    const videoNode = node.querySelector('video')
    const audioNode = node.querySelector('audio')
    if (!videoNode && !audioNode) {
      return
    }

    const videoOrAudioNode = videoNode || audioNode

    // eslint-disable-next-line regexp/no-unused-capturing-group
    const validTimeStrReg = /^(\d+(\.\d+)?(:\d+(\.\d+)?)?(:\d+(\.\d+)?)?)((~|-)(\d+(\.\d+)?(:\d+(\.\d+)?)?(:\d+(\.\d+)?)?))?$/
    const isValidTimeStr = validTimeStrReg.test(time)

    if (!isValidTimeStr) {
      showMessage('叶归｜时间格式有误，将不会设置视频时间。支持的格式请看<a href="https://simplest-frontend.feishu.cn/docx/B3NndXHi7oLLXJxnxQmcczRsnse#NHKddhyDqow7I8xSxsEcnKoAn8c">这里</a>')
      return
    }

    const {
      startTime,
      endTime,
      isTimeBlock,
      isLoop,
    } = getTimeResultByTimeStr(time)


    videoOrAudioNode.currentTime = startTime
    videoOrAudioNode.dataset.en_isTimeBlock = `${isTimeBlock}`
    videoOrAudioNode.dataset.en_enabledBlockPlay = `${isTimeBlock}`
    videoOrAudioNode.dataset.en_enabledLoopPlay = `${isLoop}`
    videoOrAudioNode.dataset.en_timeBlock_startTime = `${startTime}`
    videoOrAudioNode.dataset.en_timeBlock_endTime = `${endTime}`
  })
}


export const jumpToVNABlock = (url) => {
  const {
    bid,
    time,
  } = getEVAParamsByUrl(url)
  if (!bid || !time) {
    return
  }
  setVNATimeflag = setInterval(() => {
    setVideoTime({
      bid,
      time,
    })
  }, 100)

  // @ts-expect-error openFileByURL
  window.openFileByURL(`siyuan://blocks/${bid}`)

}

export const waitKey = 'enWaitToSetTime'
