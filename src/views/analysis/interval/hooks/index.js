/**
 * *************************************************
 * @file
 * @author fengsi<294068744@qq.com>
 * @date 2024-03-05 14:07:09
 * *************************************************
 **/

import { computed, reactive, shallowRef, watch, onMounted } from 'vue'
import { intervalCalculate } from '@/api/modules/analysis'
import {
  boxplotChartOptions,
  barChartOptions,
} from '@/views/analysis/interval/hooks/chart-options'
import dayjs from 'dayjs'
import { exportToExcel } from '@/utils/excel'
import useTimeZoneStore from '@/store/modules/time-zone.js'
import { cloneDeep, isObject, isString } from 'lodash-es'
import useCancelRequest from '@/hooks/useCancelRequest.js'
import { recordBehavior } from '@/utils/record-behavior.js'
import { ElMessage } from 'element-plus'
import { formatDateWithWeek } from '@/utils'
import { t } from '@/locales/i18n'
import { initRanges } from '../enum.js'

export const intervalUtils = {
  /**
   * @description 间隔时间秒数转化为：XX天XX小时XX分XX秒
   * @author fengsi<294068744@qq.com>
   * @date 2024-02-29 11:08:56
   */
  getDuration: (num, type = 'seconds') => {
    const types = [
      'seconds',
      'minutes',
      'hours',
      'days',
      'weeks',
      'months',
      'years',
    ]
    if (typeof num !== 'number' || types.indexOf(type) === -1) return num
    const time = dayjs.duration(num, type)
    const years = time.years()
    const months = time.months()
    const days = time.days()
    const hours = time.hours()
    const minutes = time.minutes()
    const seconds = time.seconds()
    const str =
      `${years ? years + t('analysis.interval.year') : ''}` +
      `${months ? months + t('analysis.interval.month') : ''}` +
      `${days ? days + t('analysis.interval.day') : ''}` +
      `${hours ? hours + t('analysis.interval.hour') : ''}` +
      `${minutes ? minutes + t('analysis.interval.minute') : ''}` +
      `${seconds ? seconds + t('analysis.interval.second') : ''}`
    return str || num
  },
}

export default function userIntervalHook(props = {}, { emits }) {
  const cancelRequest = useCancelRequest()

  const { getDuration } = intervalUtils
  const timeZoneStore = useTimeZoneStore()
  const state = reactive({
    loading: false,
    qp: {},
    groupDetailRef: null,
    graphTypeSelectorRef: null,
    errMessage: '',
  })
  const requestParams = reactive({
    affinity: 2, // 近似计算 1 是, 2 否
    analysisType: 8, // 分析类型：1 事件分析，2 留存分析，3 漏斗分析，4 用户分析，5 路径分析，6 分布分析，7 sql查询，8 间隔分析，9 LTV分析
    timeZone: timeZoneStore.timeZone, // 时区偏移量，例如：0 零时区、 8 东八区
    timeParticle: {
      particle: 'day',
    }, // 时间粒度：hour 按小时、 day 按天、 week 按周、 month 按月、 summary 合计
    graphType: 8, // 图表类型
    dateRange: {
      diff: '1-7',
      recentDay: '1-7',
      mainName: '过去7天',
      shortcutType: 'past7Day',
    },
    groupCheck: {
      chartNumVisible: false,
      barChecked: null, // 直方图分组
      boxplotChecked: [], // 盒须图分组
      checkedTime: null, // 时间
      intervalType: 1, // 人数userNumData-1、次数numData-2
    },
    // 表格排序
    sortArr: {
      boxplot: [],
      bar: [],
    },
    intervalSplit: initRanges(),
  })
  const intervalTypeProp = computed(() =>
    requestParams.groupCheck.intervalType === 1 ? 'userNumData' : 'numData'
  )

  const dayOptions = shallowRef([])
  const groupOptions = shallowRef([])
  const boxDataKeys = [
    'userNum',
    'num',
    'avgNum',
    'minNum',
    'downFourNum',
    'midNum',
    'upFourNum',
    'maxNum',
  ]

  const analysedResult = reactive({
    tableColumns: {
      12: [
        { prop: 'date', title: t('common.date'), minWidth: 160 },
        {
          prop: 'userNum',
          title: t('analysis.numberOfUsers'),
          minWidth: 120,
          align: 'right',
        },
        {
          prop: 'num',
          title: t('analysis.interval.numberOfIntervals'),
          minWidth: 120,
          align: 'right',
        },
        {
          prop: 'avgNum',
          title: t('analysis.interval.averageValue'),
          minWidth: 120,
          align: 'right',
        },
        {
          prop: 'minNum',
          title: t('analysis.interval.minimumValue'),
          minWidth: 120,
          align: 'right',
        },
        {
          prop: 'downFourNum',
          title: t('analysis.interval.lowerQuartile'),
          minWidth: 120,
          align: 'right',
        },
        {
          prop: 'midNum',
          title: t('analysis.interval.median'),
          minWidth: 120,
          align: 'right',
        },
        {
          prop: 'upFourNum',
          title: t('analysis.interval.upperQuartile'),
          minWidth: 120,
          align: 'right',
        },
        {
          prop: 'maxNum',
          title: t('analysis.interval.maximumValue'),
          minWidth: 120,
          align: 'right',
        },
      ],
      13: [],
    },
    tableData: {
      12: [],
      13: [],
    },
    tableRef: null,
    chartOption: {
      8: boxplotChartOptions(),
      3: barChartOptions(),
    },
    chartRef: null,
  })

  /**
   * @description 图表是否显示值
   * @author fengsi<294068744@qq.com>
   * @date 2024-03-06 11:29:35
   */
  const handleChartNumVisibleChange = (value) => {
    analysedResult.chartOption[3].series.forEach((item) => {
      item.label.show = value
    })
  }

  /**
   * @description 盒须图分组变化
   * @author fengsi<294068744@qq.com>
   * @date 2024-03-06 12:11:34
   */
  const handleGroup8Change = () => {
    analysedResult.chartOption[8].legend.data =
      requestParams.groupCheck.boxplotChecked
    analysedResult.chartOption[8].series =
      requestParams.groupCheck.boxplotChecked.map((group, groupIndex) => {
        const data = []

        analysedResult.tableData[12]
          .slice(requestParams.timeParticle.particle === 'summary' ? 0 : 1)
          .forEach((row) => {
            if (group === t('analysis.total')) {
              data.push({
                ...row,
                groupName: group,
                name: row.date,
                value: [
                  row.minNum,
                  row.downFourNum,
                  row.minNum,
                  row.upFourNum,
                  row.maxNum,
                ],
              })
            } else {
              const groupBoxItem = row.groupBox.find(
                (item) => item.groupCols === group
              )

              data.push({
                ...(groupBoxItem || {}),
                groupName: group,
                name: row.date,
                value: groupBoxItem
                  ? [
                      groupBoxItem.minNum,
                      groupBoxItem.downFourNum,
                      groupBoxItem.minNum,
                      groupBoxItem.upFourNum,
                      groupBoxItem.maxNum,
                    ]
                  : [],
              })
            }
          })

        return {
          name: group,
          type: 'boxplot',
          itemStyle: {
            color: analysedResult.chartOption[8].color[groupIndex],
          },
          data,
        }
      })
  }

  /**
   * @description 直方图 日期、分组变化
   * @author fengsi<294068744@qq.com>
   * @date 2024-03-06 11:41:45
   */
  const handleDayGroup3NumChange = () => {
    const { days, timeInterval, groupValue, value } =
      analysedData.value.analysis

    analysedResult.chartOption[8].xAxis.data = days.slice(
      requestParams.timeParticle.particle === 'summary' ? 0 : 1
    )
    analysedResult.chartOption[3].xAxis.data = timeInterval

    if (groupValue) {
      const tableDataByDate = analysedResult.tableData[13].find(
        (item) => item.date === requestParams.groupCheck.checkedTime
      )
      const series = {
        type: 'bar',
        name: requestParams.groupCheck.barChecked,
        label: {
          show: requestParams.groupCheck.chartNumVisible,
          position: 'top',
          formatter: (params) => params.data._value,
        },
        data: [],
      }
      if (requestParams.groupCheck.barChecked === t('analysis.total')) {
        series.data = timeInterval.map((item) => ({
          name: item,
          date: tableDataByDate.date,
          value: tableDataByDate[item][intervalTypeProp.value],
          _value: tableDataByDate[item][`_${intervalTypeProp.value}`],
        }))
      } else {
        const groupIntervalItem = tableDataByDate.groupInterval.find(
          (item) => item.groupCols === requestParams.groupCheck.barChecked
        )

        if (groupIntervalItem) {
          series.data = timeInterval.map((item) => ({
            name: item,
            date: tableDataByDate.date,
            value: groupIntervalItem[item][intervalTypeProp.value],
            _value: groupIntervalItem[item][`_${intervalTypeProp.value}`],
          }))
        }
      }
      analysedResult.chartOption[3].series = [series]
    } else if (value) {
      const tableDataByDate = analysedResult.tableData[13].find(
        (item) => item.date === requestParams.groupCheck.checkedTime
      )
      if (tableDataByDate) {
        analysedResult.chartOption[3].series = [
          {
            type: 'bar',
            label: {
              show: requestParams.groupCheck.chartNumVisible,
              position: 'top',
              formatter: (params) => params.data._value,
            },
            data: timeInterval.map((item) => ({
              name: item,
              date: tableDataByDate?.date,
              value: tableDataByDate?.[item][intervalTypeProp.value],
              _value: tableDataByDate?.[item][`_${intervalTypeProp.value}`],
            })),
          },
        ]
      }
    }
  }

  /**
   * @description 分析结果
   * @author fengsi<294068744@qq.com>
   * @date 2024-02-27 16:22:33
   */
  const initRequestData = () => ({
    analysis: {},
    cache: false,
    resultClusterSql: null,
    resultGenerateTime: null,
    sql: null,
  })
  const analysedData = shallowRef(initRequestData())

  const formatDataZoom = (days = [], gridBottom = 50) => {
    if (days.length <= 3) {
      analysedResult.chartOption[8].dataZoom[0].disabled = true
      analysedResult.chartOption[8].dataZoom[0].end = 100
      analysedResult.chartOption[8].dataZoom[1].show = false
      analysedResult.chartOption[8].dataZoom[1].end = 100
      analysedResult.chartOption[8].legend.bottom = 10
      analysedResult.chartOption[8].grid.bottom = 50
    } else {
      analysedResult.chartOption[8].dataZoom[0].disabled = false
      analysedResult.chartOption[8].dataZoom[0].end = 40
      analysedResult.chartOption[8].dataZoom[1].show = true
      analysedResult.chartOption[8].dataZoom[1].end = 40
      analysedResult.chartOption[8].legend.bottom = 50
      analysedResult.chartOption[8].grid.bottom = gridBottom
    }
  }

  /**
   * @description
   * @author fengsi<294068744@qq.com>
   * @date 2024-03-05 16:57:34
   */
  const handleValueFormat = () => {
    const {
      days,
      timeInterval,
      value: { boxData, intervalData },
    } = analysedData.value.analysis

    dayOptions.value = days.map((item) => ({
      label: item,
      value: item,
    }))
    if (requestParams.groupCheck.checkedTime) {
      requestParams.groupCheck.checkedTime =
        dayOptions.value.find(
          (day) => day.value === requestParams.groupCheck.checkedTime
        )?.value || dayOptions.value[0].value
    } else {
      requestParams.groupCheck.checkedTime = dayOptions.value[0].value
    }

    analysedResult.tableData[12] = boxData.map((item, index) => {
      const row = {
        date: days[index],
        ...item,
      }

      boxDataKeys.forEach((key, index) => {
        row[`_${key}`] = index > 1 ? getDuration(row[key]) : row[key]

        if (key === 'num')
          row[`_${key}`] =
            row[`_${key}`]?.toLocaleString() + t('analysis.interval.times')
      })

      return row
    })

    analysedResult.tableColumns[13] = [
      { prop: 'date', title: t('common.date'), minWidth: 150 },
    ].concat(
      timeInterval.map((item) => ({
        prop: item,
        title: item,
        minWidth: 140,
        align: 'center',
      }))
    )
    analysedResult.tableData[13] = days.map((date, dateIndex) => {
      const row = {
        date,
      }

      timeInterval.forEach((interval, intervalIndex) => {
        row[interval] = {
          date,
          numData: intervalData[dateIndex].numData[intervalIndex],
          userNumData: intervalData[dateIndex].userNumData[intervalIndex],
          _numData: intervalData[dateIndex].numData[intervalIndex],
          _userNumData: intervalData[dateIndex].userNumData[intervalIndex],
        }
      })

      return row
    })

    analysedResult.chartOption[8].series = [
      {
        type: 'boxplot',
        itemStyle: {
          color: analysedResult.chartOption[8].color[0],
        },
        data: analysedResult.tableData[12]
          .slice(requestParams.timeParticle.particle === 'summary' ? 0 : 1)
          .map((item) => {
            return {
              ...item,
              name: item.date,
              value: [
                item.minNum,
                item.downFourNum,
                item.minNum,
                item.upFourNum,
                item.maxNum,
              ],
            }
          }),
      },
    ]

    formatDataZoom(days, 50)
    handleDayGroup3NumChange()
  }

  /**
   * @description
   * @author fengsi<294068744@qq.com>
   * @date 2024-03-05 16:57:44
   */
  const handleGroupValueFormat = () => {
    const {
      days,
      timeInterval,
      groupValue: { boxDataGroup, groupColumn, intervalDataGroup, unionGroups },
    } = analysedData.value.analysis

    dayOptions.value = days.map((item) => ({
      label: item,
      value: item,
    }))
    if (requestParams.groupCheck.checkedTime) {
      requestParams.groupCheck.checkedTime =
        dayOptions.value.find(
          (day) => day.value === requestParams.groupCheck.checkedTime
        )?.value || dayOptions.value[0].value
    } else {
      requestParams.groupCheck.checkedTime = dayOptions.value[0].value
    }
    groupOptions.value = [
      { label: t('analysis.total'), value: t('analysis.total') },
    ].concat(
      unionGroups.map((item) => ({
        label: item,
        value: item,
      }))
    )

    requestParams.groupCheck.boxplotChecked =
      requestParams.groupCheck.boxplotChecked.filter((item) =>
        groupOptions.value.find((group) => group.value === item)
      )
    if (requestParams.groupCheck.boxplotChecked.length === 0)
      requestParams.groupCheck.boxplotChecked = groupOptions.value
        .slice(0, 4)
        .map((item) => item.value)
    if (requestParams.groupCheck.barChecked) {
      requestParams.groupCheck.barChecked =
        groupOptions.value.find(
          (group) => group.value === requestParams.groupCheck.barChecked
        )?.value || groupOptions.value[0].value
    } else {
      requestParams.groupCheck.barChecked = groupOptions.value[0].value
    }

    analysedResult.tableData[12] = boxDataGroup.map((item, index) => {
      const row = {
        date: days[index],
        ...item,
      }

      boxDataKeys.forEach((key, index) => {
        row[`_${key}`] = index > 1 ? getDuration(row[key]) : row[key]

        if (key === 'num')
          row[`_${key}`] =
            row[`_${key}`]?.toLocaleString() + t('analysis.interval.times')
      })

      if (row.groupBox) {
        row.groupBox.forEach((item) => {
          item.date = row.date
          boxDataKeys.forEach((key, index) => {
            item[`_${key}`] = index > 1 ? getDuration(item[key]) : item[key]

            if (key === 'num')
              item[`_${key}`] =
                item[`_${key}`]?.toLocaleString() + t('analysis.interval.times')
          })
        })
      }

      return row
    })

    analysedResult.tableColumns[12][0].minWidth = 170
    analysedResult.tableColumns[13] = [
      { prop: 'date', title: t('common.date'), minWidth: 170 },
    ].concat(
      timeInterval.map((item) => ({
        prop: item,
        title: item,
        minWidth: 140,
        align: 'center',
      }))
    )
    analysedResult.tableData[13] = days.map((date, dateIndex) => {
      const row = {
        date,
        groupInterval: intervalDataGroup[dateIndex].groupInterval.map(
          (item) => {
            const row = {
              date,
              groupCols: item.groupCols,
            }

            timeInterval.forEach((interval, intervalIndex) => {
              row[interval] = {
                date,
                numData: item.numData[intervalIndex],
                userNumData: item.userNumData[intervalIndex],
                _numData: item.numData[intervalIndex],
                _userNumData: item.userNumData[intervalIndex],
              }
            })

            return row
          }
        ),
      }

      timeInterval.forEach((interval, intervalIndex) => {
        row[interval] = {
          numData: intervalDataGroup[dateIndex].numData[intervalIndex],
          userNumData: intervalDataGroup[dateIndex].userNumData[intervalIndex],
          _numData: intervalDataGroup[dateIndex].numData[intervalIndex],
          _userNumData: intervalDataGroup[dateIndex].userNumData[intervalIndex],
        }
      })

      return row
    })

    formatDataZoom(days, 90)
    handleGroup8Change()
    handleDayGroup3NumChange()
  }

  /**
   * @description 获取分析请求参数 if (conditionFilts) requestParams.conditionFilts = conditionFilts
   * @author fengsi<294068744@qq.com>
   * @date 2024-03-06 15:15:23
   */
  const getRequestParams = () => ({
    ...state.qp,
    eventView: {
      ...state.qp.eventView,
      timeZone: timeZoneStore.timeZone,
      recentDay: requestParams.dateRange.recentDay,
      shortcutType: requestParams.dateRange.shortcutType,
      startTime: requestParams.dateRange.startTime,
      endTime: requestParams.dateRange.endTime,
      timeParticle: requestParams.timeParticle.particle,
      graphType: requestParams.graphType,
    },
    intervalSplit: requestParams.intervalSplit,
  })

  /**
   * @description: 处理日期格式转为日期(星期)
   * @return {*}
   */
  const formatDataSource = (data) => {
    const dataSource = cloneDeep(data)
    if (dataSource.analysis?.days) {
      dataSource.analysis.days = dataSource.analysis?.days.map((item) =>
        formatDateWithWeek(item)
      )
    }
    return dataSource
  }

  /**
   * @description 获取分析数据
   * @author fengsi<294068744@qq.com>
   * @date 2024-03-05 16:29:01
   */
  const handleIntervalCalculate = (refresh = false) => {
    const params = getRequestParams()
    if (
      requestParams.timeParticle.particle === 'hour' &&
      dayjs(requestParams.dateRange.endTime).diff(
        dayjs(requestParams.dateRange.startTime),
        'day'
      ) > 3
    ) {
      state.errMessage = t('common.noData')
      Object.assign(analysedData, initRequestData())
      ElMessage.warning(t('analysis.interval.checkHourly'))
      return Promise.reject(null)
    }

    if (Object.keys(params).length === 0) return Promise.reject(null)

    return new Promise((resolve, reject) => {
      state.loading = true
      state.errMessage = ''

      const _params = { ...params }
      Reflect.deleteProperty(_params, 'groupCheck')
      Reflect.deleteProperty(_params, 'sortArr')

      intervalCalculate({
        analysisType: state.analysisType,
        appId: props?.params?.appId,
        qp: _params,
        selectData: refresh,
        callback: cancelRequest.cancelCallBack,
      })
        .then((response) => {
          if (response.code === 200) {
            analysedData.value = formatDataSource(response.data)

            analysedData.value.analysis._timeInterval = {}
            analysedData.value.analysis.timeInterval.forEach((interval) => {
              analysedData.value.analysis._timeInterval[interval] = interval
                .substring(1, interval.length - 1)
                .split('~')
                .map((item) => getDuration(parseInt(item)))
            })

            if (analysedData.value.analysis.value) handleValueFormat()
            if (analysedData.value.analysis.groupValue) {
              handleGroupValueFormat()
              analysedData.value.analysis.groupValue._groupColumn =
                analysedData.value.analysis.groupValue.groupColumn.split(',')
            }

            if ([12, 13].includes(requestParams.graphType)) {
              handleGraphTypeChange(requestParams.graphType)
            }

            resolve(response)
          } else {
            state.errMessage = response.message
            reject(response)
          }
          cancelRequest.cancelReset()
        })
        .catch((error) => {
          Object.assign(analysedData, initRequestData())
          reject(error)
        })
        .finally(() => {
          state.loading = false
        })
    })
  }

  /**
   * @description 取消计算
   */
  const cancelCalculate = () => {
    cancelRequest.cancelCalculate(() => {
      state.loading = false
      state.errMessage = t('analysis.reportCalcCanceled')
    })
  }

  /**
   * @description 填充报表参数
   * @author fengsi<294068744@qq.com>
   * @date 2024-03-05 16:15:00
   */
  const handleRequestParamsPadding = (qp = {}) => {
    if (Object.keys(qp).length === 0) return

    const {
      conditionFilts,
      affinity,
      eventView = {},
      groupCheck,
      sortArr,
      intervalSplit,
    } = qp

    if (conditionFilts) requestParams.conditionFilts = conditionFilts
    requestParams.affinity = affinity
    // requestParams.timeZone = eventView.timeZone // 使用全局时区
    requestParams.timeParticle = {
      particle: eventView.timeParticle,
    }
    // requestParams.graphType = eventView.graphType // 使用报表配置的
    requestParams.dateRange.diff = eventView.recentDay
    requestParams.dateRange.recentDay = eventView.recentDay
    requestParams.dateRange.shortcutType = eventView.shortcutType
    requestParams.dateRange.startTime = eventView.startTime
    requestParams.dateRange.endTime = eventView.endTime
    console.log(intervalSplit, 'intervalSplit')
    if (intervalSplit) {
      requestParams.intervalSplit = intervalSplit
    }
    if (groupCheck) requestParams.groupCheck = groupCheck
    if (sortArr) requestParams.sortArr = sortArr
  }

  /**
   * @description 导出 数据看板
   * @author fengsi<294068744@qq.com>
   * @date 2024-03-07 14:52:02
   */
  const handleExport = () => {
    recordBehavior({
      moduleName: '分析',
      submoduleName: '间隔分析',
      operate: '导出报表数据',
      businessId: props.info?.businessId,
    })
    const { groupValue, timeInterval, value } = analysedData.value.analysis
    const { tableColumns, tableData } = analysedResult
    const sheetData = []
    const sheets = {
      sheetData: [],
    }

    if ([8, 12].includes(requestParams.graphType)) {
      if (groupValue) {
        const { _groupColumn } = groupValue

        sheetData.push([
          t('common.date'),
          ..._groupColumn,
          ...tableColumns[12].slice(1).map((item) => item.title),
        ])
        tableData[12].forEach((item) => {
          sheetData.push([
            item.date,
            ..._groupColumn.map((column) => t('analysis.interval.summaryData')),
            ...tableColumns[12]
              .slice(1)
              .map((column) => item[`_${column.prop}`]),
          ])

          item.groupBox.forEach((group) => {
            sheetData.push([
              item.date,
              ...group.groupCols.split(','),
              ...tableColumns[12]
                .slice(1)
                .map((column) => group[`_${column.prop}`]),
            ])
          })
        })
      } else if (value) {
        sheetData.push(tableColumns[12].map((column) => column.title))
        tableData[12].forEach((item) => {
          sheetData.push(
            tableColumns[12].map(
              (column) =>
                item[column.prop === 'date' ? column.prop : `_${column.prop}`]
            )
          )
        })
      }
    } else if ([3, 13].includes(requestParams.graphType)) {
      const indicators = [
        { label: t('analysis.numPeople'), value: '_userNumData' },
        { label: t('analysis.interval.numTimes'), value: '_numData' },
      ]

      if (groupValue) {
        const { _groupColumn } = groupValue

        sheetData.push([
          t('common.date'),
          ..._groupColumn,
          t('analysis.indicators'),
          ...tableColumns[13].slice(1).map((item) => item.title),
        ])

        tableData[13].forEach((item) => {
          indicators.forEach((indicator) => {
            sheetData.push([
              item.date,
              ..._groupColumn.map((column) =>
                t('analysis.interval.summaryData')
              ),
              indicator.label,
              ...tableColumns[13]
                .slice(1)
                .map((column) => item[column.prop][indicator.value]),
            ])
          })

          item.groupInterval.forEach((group) => {
            indicators.forEach((indicator) => {
              sheetData.push([
                item.date,
                ...group.groupCols.split(','),
                indicator.label,
                ...tableColumns[13]
                  .slice(1)
                  .map((column) => group[column.prop][indicator.value]),
              ])
            })
          })
        })
      } else if (value) {
        sheetData.push([
          t('common.date'),
          t('analysis.indicators'),
          ...tableColumns[13].slice(1).map((item) => item.title),
        ])

        tableData[13].forEach((item) => {
          indicators.forEach((indicator) => {
            sheetData.push([
              item.date,
              indicator.label,
              ...tableColumns[13]
                .slice(1)
                .map((column) => item[column.prop][indicator.value]),
            ])
          })
        })
      }
    }

    sheets.sheetData = sheetData
    exportToExcel({
      sheets,
      fileName: `间隔分析_${dayjs().format('YYYYMMDD')}_${dayjs().valueOf()}`,
    })
  }

  /**
   * @description
   * @author fengsi<294068744@qq.com>
   * @date 2024-03-06 15:12:13
   */
  const handleChange = () => {
    handleIntervalCalculate()
  }

  /**
   * @description 聚合数据表提示内容
   * @author fengsi<294068744@qq.com>
   * @date 2024-03-06 16:22:22
   */
  const getTable12Tooltip = ({ row, item, index }, analysedData) => {
    const { days, eventNames } = analysedData.analysis

    if (item.prop === 'userNum')
      // return `${row.date === t('analysis.total') ? days[1] + ' 至 ' + days[days.length - 1] : row.date} 有 ${row._userNum} 个用户进行了 ${eventNames[0]} 之后，又进行了 ${eventNames[1]}`
      return `${
        row.date === t('analysis.total')
          ? t('analysis.interval.userNumTotalTips', {
              startDate: days[1],
              endDate: days[days.length - 1],
              num: row._userNum,
              eventNames: eventNames[0],
              eventNames1: eventNames[1],
            })
          : t('analysis.interval.userNumTips', {
              date: row.date,
              num: row._userNum,
              eventNames: eventNames[0],
              eventNames1: eventNames[1],
            })
      }`
    if (item.prop === 'num')
      // return `${row.date === t('analysis.total') ? days[1] + ' 至 ' + days[days.length - 1] : row.date} 由用户产生的从 ${eventNames[0]} 到 ${eventNames[1]} 时间间隔有 ${row._num} 次`
      return `${
        row.date === t('analysis.total')
          ? t('analysis.interval.intervalTotalTips', {
              startDate: days[1],
              endDate: days[days.length - 1],
              num: row._num,
              eventNames: eventNames[0],
              eventNames1: eventNames[1],
            })
          : t('analysis.interval.intervalTips', {
              date: row.date,
              num: row._num,
              eventNames: eventNames[0],
              eventNames1: eventNames[1],
            })
      }`

    // return `${row.date === t('analysis.total') ? days[1] + ' 至 ' + days[days.length - 1] : row.date} 中用户产生的从 ${eventNames[0]} 到 ${eventNames[1]} 的时间间隔的 ${item.title} 为 ${row['_' + item.prop]}`
    return `${
      row.date === t('analysis.total')
        ? t('analysis.interval.dynamicTotalTooltip', {
            startDate: days[1],
            endDate: days[days.length - 1],
            num: row['_' + item.prop],
            type: item.title,
            eventNames: eventNames[0],
            eventNames1: eventNames[1],
          })
        : t('analysis.interval.dynamicTooltip', {
            date: row.date,
            num: row['_' + item.prop],
            type: item.title,
            eventNames: eventNames[0],
            eventNames1: eventNames[1],
          })
    }`
  }

  /**
   * @description 分布数据表提示内容
   * @author fengsi<294068744@qq.com>
   * @date 2024-03-06 16:00:06
   */
  const getTable13Tooltip = ({ row, item, index }, analysedData) => {
    const { days, eventNames, _timeInterval } = analysedData.analysis
    const propItem = row[item.prop]
    const propArr = _timeInterval[item.prop]

    // return `${row.date === t('analysis.total') ? days[1] + ' 至 ' + days[days.length - 1] : row.date} 中，
    // 有 ${propItem?._userNumData} 个用户进行 ${eventNames[0]} 到 ${eventNames[1]} 的间隔大于等于 ${propArr[0]} 且小于 ${propArr[1]}，
    // 共产生 ${propItem?._numData} 次时间间隔`
    return `${
      row.date === t('analysis.total')
        ? t('analysis.interval.boxplotTotalTooltip', {
            startDate: days[1],
            endDate: days[days.length - 1],
            userNum: propItem?._userNumData,
            eventNames: eventNames[0],
            eventNames1: eventNames[1],
            min: propArr[0],
            max: propArr[1],
            num: propItem?._numDat,
          })
        : t('analysis.interval.boxplotTooltip', {
            date: row.date,
            userNum: propItem?._userNumData,
            eventNames: eventNames[0],
            eventNames1: eventNames[1],
            min: propArr[0],
            max: propArr[1],
            num: row[item.prop]?.[1],
          })
    }`
  }

  /**
   * @description 表格排序
   * @author fengsi<294068744@qq.com>
   * @date 2024-03-11 19:20:07
   */
  const handleTableSort = (sortArr = []) => {
    if (requestParams.graphType === 12) requestParams.sortArr.boxplot = sortArr
    else if (requestParams.graphType === 13) requestParams.sortArr.bar = sortArr
  }

  /**
   * @description 图表类型变更
   * @author fengsi<294068744@qq.com>
   * @date 2024-03-11 19:20:18
   */
  const handleGraphTypeChange = (value) => {
    setTimeout(() => {
      analysedResult.tableRef
        ?.getTableRef()
        ?.sortEvent(
          requestParams.sortArr[value === 12 ? 'boxplot' : 'bar'] || []
        )
    })
  }

  const getInfo = () => {
    const info = cloneDeep(props.info)

    info.graphType = requestParams.graphType
    info.qp = JSON.stringify(getRequestParams())

    return info
  }

  onMounted(() => {
    try {
      state.qp = JSON.parse(props.info.qp || '{}')
      handleRequestParamsPadding(state.qp)
    } catch (e) {
      state.qp = {}
    }
  })

  watch(
    () => props.info,
    (info) => {
      if (info) {
        requestParams.graphType = info.graphType
      }
    },
    { immediate: true, deep: true }
  )
  // 看板获取全局筛选数据源的事件 eventNames 和分组数据源的事件 eventNames
  const getSetting = () => {
    let info = isObject(props.info) ? cloneDeep(props.info) : {}
    const qpData = isString(info.qp) ? JSON.parse(info.qp) : {}
    const startEvent = qpData.startEvent.eventName
    const endEvent = qpData.endEvent.eventName
    const allEvents = [...new Set([startEvent, endEvent])]
    return {
      // 用于探索里获取条件的请求参数
      conditionEventNames: allEvents.join(','),
      // 用于探索里获取分组的请求参数
      groupEventNames: allEvents.join(','),
      // 用于删除条件分组如事件/用户属性等
      groupLimit: [],
      conditionLimit: [],
    }
  }

  return {
    state,
    timeZoneStore,
    requestParams,
    dayOptions,
    groupOptions,
    analysedData,
    analysedResult,
    getRequestParams,
    handleIntervalCalculate,
    handleChange,
    handleExport,
    handleChartNumVisibleChange,
    handleDayGroup3NumChange,
    handleGroup8Change,
    getTable12Tooltip,
    getTable13Tooltip,
    handleTableSort,
    handleGraphTypeChange,
    handleRequestParamsPadding,
    getInfo,
    cancelCalculate,
    cancelRequest,
    getSetting,
  }
}
