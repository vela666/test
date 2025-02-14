import { unitCycleType } from '@/enumeration/date.js'
import { t } from '@/locales/i18n'

// ltv天数生成 当日、1日、2日...
export const getLtvDaycolumns = (unitCycle) => {
  const len = typeof unitCycle.uniNum === 'number' ? unitCycle.uniNum : 0
  // const dayArr = [`当${unitCycleType[unitCycle.type]}`]
  const dayArr = [
    t('analysis.ltv.thatDate', [unitCycleType[unitCycle.type]], 0),
  ]
  for (let i = 1; i <= len; i++) {
    // dayArr.push(`第${i}${unitCycleType[unitCycle.type]}`)
    dayArr.push(
      t('analysis.ltv.dateDynamic', [unitCycleType[unitCycle.type], i])
    )
  }
  return dayArr
}

// 获取关键天数据 source 数据源； keydays：关键天数数组
export const getKeyDaysData = (source, keydays) => {
  const len = source.length
  const data = []
  for (let i = 0; i < len; i++) {
    if (i === len - 1 || keydays.includes(i)) {
      data.push(source[i])
    }
  }
  return data
}

// 获取关键日期 dayArr: ltv日期数组['当日','1日'....], keydays:[0,1,3,7,14.....]
export const getKeyDay = (dayArr, keydays) => {
  const len = dayArr.length
  const result = []
  for (let k = 0; k < len; k++) {
    if (k === len - 1 || keydays.includes(k)) {
      result.push(dayArr[k])
    }
  }
  return result
}
