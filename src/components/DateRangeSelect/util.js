import { cloneDeep, isObject } from 'lodash-es'
import {
  dateFormat1,
  past7DayStart,
  past7DayEnd,
  currentDate,
} from '@/enumeration/date'
import dayjs from 'dayjs'

export function setDateValue(val) {
  if (!isObject(val)) return
  const dateVal = {
    ...val,
    date: val.date
      ? val.date
      : [
          dayjs(val.startTime).format(dateFormat1),
          dayjs(val.endTime).format(dateFormat1),
        ],
    diff: (val.diff ? val.diff : val.recentDay) || '',
  }
  let date = val.date
  // start是记录结束日期的  end是记录开始日期的
  const [start, end] = val.diff.split('-')
  // 处理动态时间
  if (start || end) {
    // 有快捷选项
    if (val.shortcutType) {
      date = setDateByStr(val.shortcutType, true, val.startTime)
    } else {
      const startDate = end
        ? dayjs().subtract(end, 'day').format(dateFormat1)
        : val.date[0]
      const endDate = start
        ? dayjs().subtract(start, 'day').format(dateFormat1)
        : val.date[1]
      date = [startDate, endDate]
    }
  }

  return {
    ...val,
    date: [date[0], date[1]],
    startTime: `${date[0]} 00:00:00`,
    endTime: `${date[1]} 23:59:59`,
  }
}

// 字符快捷日期设置 '昨日'、'今日'、'上周'、'本周'、'上月'、'本月'
export function setDateByStr(type, needReturnValue = false, startTime) {
  let start = ''
  let end = ''
  const fn = {
    yesterday() {
      start = end = currentDate().subtract(1, 'day')
    },
    today() {
      start = end = currentDate()
    },
    lastWeek() {
      // 获取上周一的日期
      start = currentDate().subtract(1, 'week').startOf('isoWeek')
      // 获取上周日的日期
      end = currentDate().subtract(1, 'week').endOf('isoWeek')
    },
    currentWeek() {
      // 获取本周开始的日期
      start = currentDate().startOf('isoWeek')
      end = currentDate()
    },
    lastMonth() {
      start = currentDate().subtract(1, 'month').startOf('month')
      end = currentDate().subtract(1, 'month').endOf('month')
    },
    currentMonth() {
      start = currentDate().startOf('month')
      end = currentDate()
    },
    past7Day() {
      start = currentDate().subtract(7, 'day')
      end = currentDate().subtract(1, 'day')
    },
    past8Day() {
      start = currentDate().subtract(8, 'day')
      end = currentDate().subtract(1, 'day')
    },
    past30Day() {
      start = currentDate().subtract(30, 'day')
      end = currentDate().subtract(1, 'day')
    },
    certainDayToYesterday() {
      start = dayjs(startTime).format(dateFormat1)
      end = currentDate().subtract(1, 'day')
      // 针对开始在结束日期前
      if (dayjs(end).isBefore(dayjs(start))) {
        this.yesterday()
      }
    },
    certainDayToToday() {
      start = dayjs(startTime).format(dateFormat1)
      end = currentDate()
    },
  }[type]()
  start = dayjs(start).format(dateFormat1)
  end = dayjs(end).format(dateFormat1)
  if (needReturnValue) {
    return [start, end]
  }
}
