import dayjs from 'dayjs';

const FORMAT = 'YYYY-MM-DD';

export function todayStr() {
  return dayjs().format(FORMAT)
}
