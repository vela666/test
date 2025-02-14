import {
  initOptions,
  setWeekEndMark,
  ltvToolTipFormatter as toolTipFormatter,
  dataZoomOption,
} from '@/views/analysis/hooks/utils.js'
import { getRetentionDaycolumns, getKeyDaysData, getKeyDay } from './util.js'
import { cloneDeep, isString, omit } from 'lodash-es'
import { thousandsFilter } from '@/utils/index.js'
import { t } from '@/locales/i18n'

export default function (
  state,
  dataCache,
  groupDataMap,
  hasGroup,
  shoWSameTime
) {
  // 设置展示echart图表
  const setChart = () => {
    if (state.graphType === 11 && hasGroup.value) {
      state.valueType = 1
    }

    // 只看同时展示数据时 每日留存图表不展示;展示流失数据时 每日流失图表不展示
    const onlyUserAction = state.onlyUserAction === true && shoWSameTime.value
    if (
      (onlyUserAction || (state.showType === 2 && hasGroup.value)) &&
      state.graphType === 11
    ) {
      state.graphType = 10
    }
    state.options = initOptions()
    state.options['animation'] = !state.showChartLabel
    if (state.graphType === 10) {
      setRetentionNChart()
    } else if (state.graphType === 11) {
      setRetentionDailyChart()
    }
  }

  // 第N日留存/流失处理
  const setRetentionNChart = () => {
    const cacheData = cloneDeep(dataCache.value)
    if (!cacheData?.items?.length || !Array.isArray(cacheData?.items)) return
    // 是否有分组
    const hasGroup =
      cacheData?.group_column && isString(cacheData?.group_column)
    const showType = state.showType // 1,留存；2,流失
    const valueType = state.valueType // 1,比例；2,人数
    const dataKey = showType === 1 ? 'return_visit_data' : 'lose_user_data'
    // 展示的是比例还是人数
    let percentage = valueType === 1
    // 是否有同时展示
    const hasSameTime = cacheData.same_time_data === true
    // 是否是只看同时展示
    const onlyUserAction = state.onlyUserAction === true && hasSameTime
    if (onlyUserAction) {
      percentage = false
    }
    if (hasGroup) {
      retentionNChartGroup(
        cacheData,
        dataKey,
        percentage,
        onlyUserAction,
        showType
      )
    } else {
      const xAxisData = []
      const seriesData = []
      for (const item of cacheData.items) {
        if (item.on_date === '-') {
          continue
        }
        const source_data = isNaN(item.source_data)
          ? item.source_data
          : parseFloat(item.source_data)
        // 同时展示数据
        let showSameTimeData = []
        let sameTimeData = Array.isArray(item.same_time_data)
          ? item.same_time_data
          : []
        //展示的内容是 同时展示数据还是留存/流失
        let showDataSource =
          onlyUserAction && showType === 1 ? sameTimeData : item[dataKey]
        const len = Array.isArray(showDataSource) ? showDataSource.length : 0
        if (len > 0) {
          xAxisData.push(item.on_date)
          let res = showDataSource?.[len - 1] ?? '-'
          if (percentage) {
            if (res !== '-') {
              res = Math.round((res / source_data) * 10000) / 100
            }
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
          formatter: ({ value }) =>
            percentage ? `${value}%` : thousandsFilter(value),
        },
      }
      let series = [tempSeriesItem]
      // 周六周日标记
      series = setWeekEndMark(xAxisData, series)
      state.options.series = [...series]
      state.options.xAxis.data = xAxisData
      state.options.legend.data = []
      state.options.tooltip.formatter = (params) =>
        toolTipFormatter(params, percentage)
      state.options.yAxis.axisLabel.formatter = percentage
        ? '{value}%'
        : '{value}'
      if (xAxisData.length > 10) {
        state.options['dataZoom'] = {
          ...dataZoomOption,
        }
      }
    }
  }

  // 第N日留存/流失分组处理
  const retentionNChartGroup = (
    cacheData,
    dataKey,
    percentage,
    onlyUserAction,
    showType
  ) => {
    if (!Array.isArray(cacheData.items)) return
    const day = Array.isArray(cacheData.analysis_date)
      ? cacheData.analysis_date.length
      : 0
    // 选中分组
    const checkedGroups = state.groupOptions.groupCheckList
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
    const sourceData = cacheData.items.filter((el) => el.on_date !== '-')
    sourceData.forEach((items, index) => {
      const groupData = cloneDeep(groupDataMap.value.get(items?.on_date) ?? [])
      groupData.unshift({
        ...omit(items, ['group_data', 'on_date']),
        group_column: t('analysis.retention.total'),
      })
      for (let i = 0, len = groupData.length; i < len; i++) {
        if (checkedGroups.includes(groupData[i].group_column)) {
          // 同时展示数据
          let sameTimeData = Array.isArray(groupData[i].same_time_data)
            ? groupData[i].same_time_data
            : []
          let showDataSource =
            onlyUserAction && showType === 1
              ? sameTimeData
              : groupData[i][dataKey]
          const length = showDataSource.length
          let tempres = showDataSource[length - 1]
          const group_source_data = isNaN(groupData[i].source_data)
            ? groupData[i].source_data
            : parseFloat(groupData[i].source_data)
          if (percentage) {
            if (tempres !== '-') {
              tempres = Math.round((tempres / group_source_data) * 10000) / 100
            }
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
          formatter: ({ value }) =>
            percentage ? `${value}%` : thousandsFilter(value),
        },
      })
    }

    series = setWeekEndMark(cacheData.analysis_date, series)
    state.options.xAxis.data = cacheData.analysis_date
    state.options.series = series
    state.options.legend.data = checkedGroups
    state.options.yAxis.axisLabel.formatter = percentage
      ? '{value}%'
      : '{value}'
    state.options.tooltip.formatter = (params) =>
      toolTipFormatter(params, percentage)
    if (state.options.xAxis.data.length > 10) {
      state.options['dataZoom'] = {
        ...dataZoomOption,
      }
      state.options.legend.bottom = '4%'
    }
  }

  // 每日留存/流失
  const setRetentionDailyChart = () => {
    const cacheData = cloneDeep(dataCache.value)
    if (!cacheData?.items?.length || !Array.isArray(cacheData?.items)) return
    const showType = state.showType
    let dayArr = getRetentionDaycolumns(showType, state.unitCycle)
    //判断是否只展示关键日期
    let isKeyDays = false
    if (state.keyDays.apply === 2 && state.keyDays.days.length > 0) {
      isKeyDays = true
      dayArr = getKeyDay(dayArr, state.keyDays.days, showType)
    }
    // 是否有分组
    const hasGroup =
      cacheData?.group_column && isString(cacheData?.group_column)

    const hasSameTime = cacheData.same_time_data === true
    // 是否是只看同时展示
    const onlyUserAction = state.onlyUserAction === true && hasSameTime
    const dataKey = showType === 1 ? 'return_visit_data' : 'lose_user_data'
    let percentage = state.valueType === 1 // 展示比例还是人数
    // 是否展示阶段值（阶段值中没有同时展示和流失的数据，这两种情况不展示阶段值）
    const showStageAvg = showType === 1 && !onlyUserAction

    if (onlyUserAction) {
      percentage = false
    }
    if (hasGroup) {
      if (onlyUserAction || showType === 2) return
      retentionDailyChartGroup(
        cacheData,
        dataKey,
        percentage,
        showType,
        dayArr,
        isKeyDays
      )
    } else {
      // 选中日期
      const checkedGroups = showStageAvg
        ? state.groupOptions.groupCheckList
        : state.loseGroupOptions.groupCheckList
      const series = []
      const sourceData = showStageAvg
        ? cacheData.items
        : cacheData.items.filter((el) => el.on_date !== '-')
      sourceData.forEach((item) => {
        let key =
          item.on_date === '-'
            ? t('analysis.retention.stageValue')
            : item.on_date
        if (checkedGroups.includes(key)) {
          // 同时展示数据
          let sameTimeData = Array.isArray(item.same_time_data)
            ? item.same_time_data
            : []
          let showDataSource =
            onlyUserAction && showType === 1 ? sameTimeData : item[dataKey]
          // 展示回访用户指标
          let res = showType === 2 ? showDataSource.slice(1) : showDataSource
          // 只展示关键日期处理
          if (isKeyDays) {
            res = getKeyDaysData(res, state.keyDays.days, showType)
          }
          if (percentage) {
            const source_data = isNaN(item.source_data)
              ? item.source_data
              : parseFloat(item.source_data)
            res = res.map((el) => {
              if (el && !isNaN(el)) {
                return Math.round((el / source_data) * 10000) / 100
              }
              return el
            })
          }
          const seriesItem = {
            name: key,
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
              formatter: ({ value }) =>
                percentage ? `${value}%` : thousandsFilter(value),
            },
          }
          if (item.on_date === '-') {
            series.unshift(seriesItem)
          } else {
            series.push(seriesItem)
          }
        }
      })
      state.options.xAxis.data = dayArr
      state.options.series = series
      state.options.legend.data = checkedGroups
      state.options.yAxis.axisLabel.formatter = percentage
        ? '{value}%'
        : '{value}'
      state.options.tooltip.formatter = (params) =>
        toolTipFormatter(params, percentage)
      if (state.options.xAxis.data.length > 10) {
        state.options['dataZoom'] = {
          ...dataZoomOption,
        }
        state.options.legend.bottom = '4%'
      }
    }
  }

  // 每日留存/流失 分组处理
  const retentionDailyChartGroup = (
    cacheData,
    dataKey,
    percentage,
    showType,
    dayArr,
    isKeyDays
  ) => {
    if (
      !cacheData?.items?.length ||
      !Array.isArray(cacheData?.items) ||
      showType === 2
    )
      return
    //分组时每日留存（流失）数据源为阶段值数据
    const datas = cacheData.items.find((el) => el.on_date === '-')
    if (!datas) return
    // 选中分组
    const checkedGroups = state.groupOptions.groupCheckList
    const series = []
    const groupData = cloneDeep(groupDataMap.value.get(datas?.on_date) ?? [])
    groupData.unshift({
      ...omit(datas, ['group_data', 'on_date']),
      group_column: t('analysis.retention.total'),
    })
    groupData.forEach((item) => {
      if (checkedGroups.includes(item.group_column)) {
        //留存为 return_visit_data 阶段值没有流失数据不展示
        let resData = showType === 2 ? [] : item.return_visit_data
        // 只展示关键日期处理
        if (isKeyDays) {
          resData = getKeyDaysData(resData, state.keyDays.days, showType)
        }
        if (percentage) {
          const source_data = isNaN(item.source_data)
            ? item.source_data
            : parseFloat(item.source_data)
          resData = resData.map((el) => {
            return el !== '-'
              ? Math.round((el / source_data) * 10000) / 100
              : el
          })
        }
        series.push({
          name: item.group_column,
          type: 'line',
          data: resData.map((item) => {
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
            formatter: ({ value }) =>
              percentage ? `${value}%` : thousandsFilter(value),
          },
        })
      }
    })
    state.options.xAxis.data = dayArr
    state.options.series = series
    state.options.legend.data = checkedGroups
    state.options.yAxis.axisLabel.formatter = percentage
      ? '{value}%'
      : '{value}'
    state.options.tooltip.formatter = (params) =>
      toolTipFormatter(params, percentage)

    if (state.options.xAxis.data.length > 10) {
      state.options['dataZoom'] = {
        ...dataZoomOption,
      }
      state.options.legend.bottom = '4%'
    }
  }
  return { setChart }
}
