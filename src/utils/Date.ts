import dayjs, { Dayjs } from 'dayjs';

const FORMAT = 'YYYY-MM-DD';

export function todayStr() {
  return dayjs().format(FORMAT)
}

export function getDiffFormat(day1: Dayjs, day2: Dayjs, gap = ' ') {
  if (!day1 || !day2) {
    return
  }
  const needSwitch = day1.isAfter(day2)
  const temp1 =  needSwitch ? day2 : day1
  const temp2 =  needSwitch ? day1 : day2
  const seconds = temp2.diff(temp1, 'second')

  const diffHour = Math.floor(seconds / 60 / 60);
  const diffMinute = Math.floor(seconds / 60 % 60);
  const diffSecond = Math.floor(seconds % 60);

  const formatted = [
    diffHour ? `${diffHour}时` : '',
    diffMinute ? `${diffMinute}分` : '',
    diffSecond ? `${diffSecond}秒` : '',
  ].filter(Boolean).join(gap)
  return formatted
}
