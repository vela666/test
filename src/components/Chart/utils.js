import dayjs from 'dayjs'
import { cloneDeep } from 'lodash-es'
import { chartColor } from '@/enumeration/chart'
import { dateFormat1 } from '@/enumeration/date'
/**
 * @description: 添加周六、周日标注线
 * @param dateArr {Array} x轴日期列表 [
 *     "2023-11-07",
 * ]
 * @param series {Array} echarts配置项 series [
 *     {
 *       type: state.chartType,
 *       barGap: 0,
 *       label: {
 *         show: false,
 *       },
 *       emphasis: {
 *         focus: 'series',
 *       },
 *       // 设置柱子最大宽度为 30
 *       barMaxWidth: 30,
 *       itemStyle: {
 *         color: chartColor[0],
 *       },
 *       data: state.chartData.yAxisDataList,
 *     },
 *   ]
 * @param xAxisData {Array} vs时的日期(事件分析) [
 *     "2023-11-07\n2023-11-30",
 *     "2023-11-14\n-",
 * ]
 * @returns {{length}|*}
 */
const weekendEnum = [6, 7]
export const setWeekEndMark = (dateArr = [], series, xAxisData) => {
  const len = dateArr.length
  if (!len) return series
  const cloneSeries = cloneDeep(series)
  const weekEndDate = []
  for (let i = 0; i < len; i++) {
    const item = dateArr[i]
    // isValid() 只检查传入的值能否被解析成一个时间日期
    const weekday = dayjs(item, dateFormat1).isoWeekday()
    if (
      dayjs(item, dateFormat1, true).isValid() &&
      weekendEnum.includes(weekday)
    ) {
      const title = weekday === 6 ? '周六' : '周日'
      weekEndDate.push({
        title,
        date: xAxisData ? xAxisData[i] : item,
      })
    }
  }

  if (weekEndDate.length && cloneSeries.length) {
    cloneSeries.forEach((item) => {
      // 周末的显示竖线
      item.markLine = {
        silent: true,
        symbol: ['none', 'none'],
        lineStyle: {
          type: 'solid',
          color: '#e5e5e5',
          width: 2,
        },
        label: {
          color: chartColor[0],
          formatter: '',
        },
        data: weekEndDate.map((el) => ({ name: el.title, xAxis: el.date })),
      }
    })
  }
  return cloneSeries
}
