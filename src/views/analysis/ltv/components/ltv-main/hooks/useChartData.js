import {
  setWeekEndMark,
  ltvToolTipFormatter as toolTipFormatter,
} from '@/views/analysis/hooks/utils.js'
import { cloneDeep, isString } from 'lodash-es'
import { getLtvDaycolumns, getKeyDaysData, getKeyDay } from './util.js'
import { t } from '@/locales/i18n'

export default function (state, dataCache, qpCache, groupDataMap) {
  const setChart = () => {
    state.options.yAxis.axisLabel.formatter = '{value}'
    state.options.tooltip.formatter = (params) =>
      toolTipFormatter(params, false)
    if (state.graphType === 12) {
      nDayLtvChart()
    } else if (state.graphType === 13) {
      dailyLtvChart()
    }
  }

  // 第N日LTV
  const nDayLtvChart = () => {
    const cacheData = cloneDeep(dataCache.value)
    if (!cacheData?.items?.length || !Array.isArray(cacheData?.items)) return
    const qpData = qpCache.value
    // 是否有同时展示
    const hasSameTime = cacheData.same_time_data === true
    // 是否是只看同时展示
    const onlyUserAction = state.onlyUserAction === true && hasSameTime
    // 是展示回访指标数据还是同时展示的数据
    const showDataKey = onlyUserAction ? 'same_time_data' : 'return_visit_data'
    // 判断回访用户指标是否为百分比
    let returnVisitPercent = false
    if (showDataKey === 'return_visit_data') {
      const returnVisit = qpData.events.find((el) =>
        ['return_visit'].includes(el.type)
      )
      if (returnVisit && returnVisit.round === 2) {
        returnVisitPercent = true
      }
    }
    // 是否有分组
    const hasGroup =
      cacheData?.group_column && isString(cacheData?.group_column)
    // 判断同时展示为指标计算为百分比时
    let showPercent = false
    if (onlyUserAction) {
      const sameTimeArithmetic = qpData.events.find((el) =>
        ['same_time_arithmetic', 'same_time'].includes(el.type)
      )
      if (sameTimeArithmetic && sameTimeArithmetic.round === 2) {
        showPercent = true
      }
    }

    if (hasGroup) {
      nDayLtvChartByGroup(
        cacheData,
        showDataKey,
        showPercent,
        onlyUserAction,
        returnVisitPercent
      )
    } else {
      const xAxisData = []
      const seriesData = []
      const percentage = (onlyUserAction && showPercent) || returnVisitPercent

      for (const item of cacheData.items) {
        const len = Array.isArray(item[showDataKey])
          ? item[showDataKey].length
          : 0
        if (len > 0) {
          xAxisData.push(item.on_date)
          let res = item[showDataKey][len - 1]
          if ((onlyUserAction && showPercent) || returnVisitPercent) {
            res =
              res && !isNaN(res) ? `${parseFloat((res * 100).toFixed(2))}` : res
          }
          seriesData.push(res)
        }
      }

      const tempSeriesItem = {
        type: 'line',
        data: seriesData.map((item) => {
          return {
            value: item,
            percentage,
          }
        }),
        emphasis: {
          focus: 'series',
        },
        label: {
          show: state.showChartLabel,
          position: 'top',
        },
      }
      let series = [tempSeriesItem]
      series = setWeekEndMark(xAxisData, series)
      state.options.series = [...series]
      state.options.xAxis.data = xAxisData
      state.options.legend.data = []
      if (percentage) {
        state.options.yAxis.axisLabel.formatter = '{value}%'
        state.options.tooltip.formatter = (params) =>
          toolTipFormatter(params, true)
      }
    }
  }
  // 第N日LTV有分组情况处理
  const nDayLtvChartByGroup = (
    cacheData,
    showDataKey,
    showPercent = false,
    onlyUserAction = false,
    returnVisitPercent = false
  ) => {
    if (!Array.isArray(cacheData.items)) return
    const day = Array.isArray(cacheData.analysis_date)
      ? cacheData.analysis_date.length
      : 0
    // 选中分组
    const checkedGroups = state.groupOptions.groupCheckList
    const percentage = (onlyUserAction && showPercent) || returnVisitPercent
    const tempSeries = new Map()
    // 创建数据
    for (const item of checkedGroups) {
      tempSeries.set(item, {
        name: item,
        type: 'line',
        data: new Array(day).fill('-'),
        emphasis: {
          focus: 'series',
        },
      })
    }

    cacheData.items.forEach((items, index) => {
      // 分组中是否有总体
      if (checkedGroups.includes(t('analysis.ltv.total'))) {
        const length = items[showDataKey].length
        let res = items[showDataKey][length - 1]
        if ((onlyUserAction && showPercent) || returnVisitPercent) {
          res =
            res && !isNaN(res) ? `${parseFloat((res * 100).toFixed(2))}` : res
        }

        const itemSeries = tempSeries.get(t('analysis.ltv.total'))
        if (itemSeries !== undefined) {
          itemSeries.data[index] = res
          tempSeries.set(t('analysis.ltv.total'), itemSeries)
        }
      }

      const groupData = cloneDeep(groupDataMap.value.get(items?.on_date) ?? [])
      for (let i = 0, len = groupData.length; i < len; i++) {
        if (checkedGroups.includes(groupData[i].group_column)) {
          const length = groupData[i][showDataKey].length
          let tempres = groupData[i][showDataKey][length - 1]
          if ((onlyUserAction && showPercent) || returnVisitPercent) {
            tempres =
              tempres && !isNaN(tempres)
                ? `${parseFloat((tempres * 100).toFixed(2))}`
                : tempres
          }

          const itemData = tempSeries.get(groupData[i].group_column)
          if (itemData !== undefined) {
            itemData.data[index] = tempres
            tempSeries.set(groupData[i].group_column, itemData)
          }
        }
      }
    })

    let series = []
    for (const [key, value] of tempSeries) {
      series.push({
        ...value,
        data: value.data.map((item) => {
          return {
            value: item,
            percentage,
          }
        }),
        tooltip: {
          formatter: (params) => {
            return toolTipFormatter(params, percentage, true)
          },
        },
        label: {
          show: state.showChartLabel,
          position: 'top',
        },
      })
    }

    series = setWeekEndMark(cacheData.analysis_date, series)
    state.options.xAxis.data = cacheData.analysis_date
    state.options.series = series
    state.options.legend.data = checkedGroups
    if (percentage) {
      state.options.yAxis.axisLabel.formatter = '{value}%'
      state.options.tooltip.formatter = (params) =>
        toolTipFormatter(params, true)
    }
  }
  // 每日LTV
  const dailyLtvChart = () => {
    const cacheData = cloneDeep(dataCache.value)
    if (!cacheData?.items?.length || !Array.isArray(cacheData?.items)) return
    const qpData = qpCache.value
    let dayArr = getLtvDaycolumns(state.unitCycle)
    // 判断是否只展示关键日期
    const keydays = state.keyDays.days
    let isKeyDays = false
    if (state.keyDays.apply === 2 && keydays.length > 0) {
      isKeyDays = true
      dayArr = getKeyDay(dayArr, keydays)
    }
    // 选中日期
    const checkedGroups = state.groupOptions.groupCheckList
    const series = []
    const hasSameTime = cacheData.same_time_data === true
    // 是否是只看同时展示
    const onlyUserAction = state.onlyUserAction === true && hasSameTime
    // 第一行是展示回访指标数据还是同时展示的数据
    const showDataKey = onlyUserAction ? 'same_time_data' : 'return_visit_data'
    // 判断回访用户指标是否为百分比
    let returnVisitPercent = false
    if (showDataKey === 'return_visit_data') {
      const returnVisit = qpData?.events?.find((el) =>
        ['return_visit'].includes(el.type)
      )
      if (returnVisit && returnVisit.round === 2) {
        returnVisitPercent = true
      }
    }
    // 判断同时展示为指标计算为百分比时
    let showPercent = false
    if (onlyUserAction) {
      const sameTimeArithmetic = qpData?.events?.find((el) =>
        ['same_time_arithmetic', 'same_time'].includes(el.type)
      )
      if (sameTimeArithmetic && sameTimeArithmetic.round === 2) {
        showPercent = true
      }
    }

    const percentage = (onlyUserAction && showPercent) || returnVisitPercent
    cacheData.items.forEach((item) => {
      if (checkedGroups.includes(item.on_date)) {
        // 展示回访用户指标
        let res = isKeyDays
          ? getKeyDaysData(item[showDataKey], keydays)
          : item[showDataKey]
        if ((onlyUserAction && showPercent) || returnVisitPercent) {
          res = res.map((el) => {
            if (el && !isNaN(el)) {
              return `${parseFloat((el * 100).toFixed(2))}`
            }
            return el
          })
        }
        series.push({
          name: item.on_date,
          type: 'line',
          data: res.map((item) => {
            return {
              value: item,
              percentage,
            }
          }),
          emphasis: {
            focus: 'series',
          },
          tooltip: {
            formatter: (params) => {
              return toolTipFormatter(params, percentage, true)
            },
          },
          label: {
            show: state.showChartLabel,
            position: 'top',
          },
        })
      }
    })

    state.options.xAxis.data = dayArr
    state.options.series = series
    state.options.legend.data = checkedGroups
    if (percentage) {
      state.options.yAxis.axisLabel.formatter = '{value}%'
      state.options.tooltip.formatter = (params) =>
        toolTipFormatter(params, true)
    }
  }
  return { setChart }
}
