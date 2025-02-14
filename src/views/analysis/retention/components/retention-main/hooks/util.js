import { unitCycleType } from '@/enumeration/date.js'
import { t } from '@/locales/i18n'

/*// 留存天数生成 当日、1日、2日...
export const getRetentionDaycolumns = (showType = 1, uniNum = 0) => {
  // state.unitCycle.uniNum
  const len = typeof uniNum === 'number' ? uniNum : 0
  const dayArr = showType === 1 ? ['当日'] : []
  for (let i = 1; i <= len; i++) {
    dayArr.push(`第${i}日`)
  }
  return dayArr
}*/

// 留存天数生成 当日、1日、2日...
export const getRetentionDaycolumns = (showType = 1, unitCycle) => {
  // state.unitCycle.uniNum
  const len = typeof unitCycle.uniNum === 'number' ? unitCycle.uniNum : 0
  const dayArr =
    showType === 1
      ? [t('analysis.retention.thatDate', [unitCycleType[unitCycle.type]], 0)]
      : []
  for (let i = 1; i <= len; i++) {
    // dayArr.push(`第${i}${unitCycleType[unitCycle.type]}`)
    dayArr.push(
      t('analysis.retention.dateDynamic', [unitCycleType[unitCycle.type], i])
    )
  }
  return dayArr
}

// 获取关键天数据 source 数据源； keydays：关键天数数组, showType: 1,留存；2,流失
export const getKeyDaysData = (source, keydays, showType = 1) => {
  const len = source.length
  const data = []
  for (let i = 0; i < len; i++) {
    let flg = i
    if (showType === 2) {
      flg = i + 1
    }
    if (i === len - 1 || keydays.includes(flg)) {
      data.push(source[i])
    }
  }
  return data
}

// 获取关键日期 dayArr: 日期数组['当日','1日'....], keydays:[0,1,3,7,14.....]  showType:  1,留存；2,流失
export const getKeyDay = (dayArr, keydays, showType = 1) => {
  const len = dayArr.length
  const result = []
  for (let k = 0; k < len; k++) {
    let flg = k
    if (showType === 2) {
      flg = k + 1
    }
    if (k === len - 1 || keydays.includes(flg)) {
      result.push(dayArr[k])
    }
  }
  return result
}
