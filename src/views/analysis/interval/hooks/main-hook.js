import { computed, reactive, watch, inject, nextTick } from 'vue'
import {
  boxplotChartOptions,
  barChartOptions,
} from '@/views/analysis/interval/hooks/chart-options'
import { intervalUtils } from '@/views/analysis/interval/hooks'
import { recordBehavior } from '@/utils/record-behavior.js'
import { t } from '@/locales/i18n'

const useMainHook = (props, { emits }) => {
  const { getDuration } = intervalUtils
  const {
    state: intervalState,
    requestData,
    reportInfo,
  } = inject('intervalState')
  const state = reactive({
    loading: false,
    status: -1,
    selectedDay: null,
    days: [],
    numType: computed(() =>
      intervalState.groupCheck.intervalType === 1 ? 'userNumData' : 'numData'
    ),
    selectedGroups: intervalState.graphType === 8 ? [] : null,
    unionGroups: [],
  })
  const particleType = reactive({
    value: computed({
      get() {
        return { particle: intervalState.timeParticle }
      },
      set(value) {
        intervalState.timeParticle = value.particle
      },
    }),
    options: ['day', 'hour', 'month', 'summary'],
  })
  const analysisResult = reactive({
    tableColumns: [],
    tableData: [],
    tableDataQP: {},
    tableRef: null,
    chartOption: {},
    chartRef: null,
  })

  /**
   * @description 日期、时间粒度
   * @author fengsi<294068744@qq.com>
   * @date 2024-02-29 09:52:22
   */
  const handleChange = (value) => {
    if (state.status > -1) emits('calculate')
  }

  /**
   * @description 图表类型
   * @author fengsi<294068744@qq.com>
   * @date 2024-02-29 09:52:35
   */
  const handleChartTypeChange = (value) => {
    handleDataFormat()
  }

  /**
   * @description 格式化图表、表格的数据
   * @author fengsi<294068744@qq.com>
   * @date 2024-02-29 09:51:36
   */
  const handleDataFormat = () => {
    analysisResult.tableColumns = []
    analysisResult.tableData = []
    analysisResult.tableDataQP = {}
    analysisResult.chartOption = {}
    state.days = []
    state.unionGroups = []

    if (state.status < 1) return

    const SPECIFIC_PROPS = [
      ['userNum', 'num'],
      ['avgNum', 'minNum', 'downFourNum', 'midNum', 'upFourNum', 'maxNum'],
    ]
    const {
      analysis: { days, eventNames, groupValue, timeInterval, value },
    } = requestData.value

    if (groupValue) {
      state.unionGroups = groupValue.unionGroups?.map((item) => ({
        label: item,
        value: item,
      }))
      state.unionGroups.unshift({
        label: t('analysis.total'),
        value: t('analysis.total'),
      })
    }

    if (intervalState.graphType === 8) {
      analysisResult.chartOption = boxplotChartOptions()
      analysisResult.tableColumns = [
        { prop: 'date', title: t('common.date') },
        {
          prop: 'userNum',
          title: t('analysis.numberOfUsers'),
          align: 'right',
          tooltip: (item, row, groups = '') =>
            // `${row.index === 1 && intervalState.timeParticle !== 'summary' ? days[1] + '至' + days[days.length - 1] : row.date}有${row.userNum}个${groups}用户进行了${eventNames[0]}之后，又进行了${eventNames[1]}`,
            `${
              row.index === 1 && intervalState.timeParticle !== 'summary'
                ? t('analysis.interval.userNumTotalTips', {
                    startDate: days[1],
                    endDate: days[days.length - 1],
                    num: row.userNum,
                    groups,
                    eventNames: eventNames[0],
                    eventNames1: eventNames[1],
                  })
                : t('analysis.interval.userNumTips', {
                    date: row.date,
                    num: row.userNum,
                    groups,
                    eventNames: eventNames[0],
                    eventNames1: eventNames[1],
                  })
            }`,
        },
        {
          prop: 'num',
          title: t('analysis.interval.numberOfIntervals'),
          align: 'right',
          tooltip: (item, row, groups = '') =>
            // `${row.index === 1 && intervalState.timeParticle !== 'summary' ? days[1] + '至' + days[days.length - 1] : row.date}由${groups}用户产生的从${eventNames[0]}到${eventNames[1]}时间间隔有${row.num}次`,
            `${
              row.index === 1 && intervalState.timeParticle !== 'summary'
                ? t('analysis.interval.intervalTotalTips', {
                    startDate: days[1],
                    endDate: days[days.length - 1],
                    num: row.num,
                    groups,
                    eventNames: eventNames[0],
                    eventNames1: eventNames[1],
                  })
                : t('analysis.interval.intervalTips', {
                    date: row.date,
                    num: row.num,
                    groups,
                    eventNames: eventNames[0],
                    eventNames1: eventNames[1],
                  })
            }
            `,
        },
        {
          prop: 'avgNum',
          title: t('analysis.interval.averageValue'),
          align: 'right',
          tooltip: (item, row, groups = '') =>
            // `${row.index === 1 && intervalState.timeParticle !== 'summary' ? days[1] + '至' + days[days.length - 1] : row.date}中${groups}用户产生的从${eventNames[0]}到${eventNames[1]}的时间间隔的平均值为${row._avgNum}`,
            `${
              row.index === 1 && intervalState.timeParticle !== 'summary'
                ? t('analysis.interval.dynamicTotalTooltip', {
                    startDate: days[1],
                    endDate: days[days.length - 1],
                    num: row._avgNum,
                    groups,
                    type: t('analysis.interval.averageValue'),
                    eventNames: eventNames[0],
                    eventNames1: eventNames[1],
                  })
                : t('analysis.interval.dynamicTooltip', {
                    date: row.date,
                    num: row._avgNum,
                    groups,
                    type: t('analysis.interval.averageValue'),
                    eventNames: eventNames[0],
                    eventNames1: eventNames[1],
                  })
            }
            `,
        },
        {
          prop: 'minNum',
          title: t('analysis.interval.minimumValue'),
          align: 'right',
          tooltip: (item, row, groups = '') =>
            // `${row.index === 1 && intervalState.timeParticle !== 'summary' ? days[1] + '至' + days[days.length - 1] : row.date}中${groups}用户产生的从${eventNames[0]}到${eventNames[1]}的时间间隔的最小值为${row._minNum}`,
            `${
              row.index === 1 && intervalState.timeParticle !== 'summary'
                ? t('analysis.interval.dynamicTotalTooltip', {
                    startDate: days[1],
                    endDate: days[days.length - 1],
                    num: row._minNum,
                    groups,
                    type: t('analysis.interval.minimumValue'),
                    eventNames: eventNames[0],
                    eventNames1: eventNames[1],
                  })
                : t('analysis.interval.dynamicTooltip', {
                    date: row.date,
                    num: row._minNum,
                    groups,
                    type: t('analysis.interval.minimumValue'),
                    eventNames: eventNames[0],
                    eventNames1: eventNames[1],
                  })
            }
            `,
        },
        {
          prop: 'downFourNum',
          title: t('analysis.interval.lowerQuartile'),
          align: 'right',
          tooltip: (item, row, groups = '') =>
            // `${row.index === 1 && intervalState.timeParticle !== 'summary' ? days[1] + '至' + days[days.length - 1] : row.date}中${groups}用户产生的从${eventNames[0]}到${eventNames[1]}的时间间隔的下四分位为${row._downFourNum}`,
            `${
              row.index === 1 && intervalState.timeParticle !== 'summary'
                ? t('analysis.interval.dynamicTotalTooltip', {
                    startDate: days[1],
                    endDate: days[days.length - 1],
                    num: row._downFourNum,
                    groups,
                    type: t('analysis.interval.lowerQuartile'),
                    eventNames: eventNames[0],
                    eventNames1: eventNames[1],
                  })
                : t('analysis.interval.dynamicTooltip', {
                    date: row.date,
                    num: row._downFourNum,
                    groups,
                    type: t('analysis.interval.lowerQuartile'),
                    eventNames: eventNames[0],
                    eventNames1: eventNames[1],
                  })
            }
            `,
        },
        {
          prop: 'midNum',
          title: t('analysis.interval.median'),
          align: 'right',
          tooltip: (item, row, groups = '') =>
            // `${row.index === 1 && intervalState.timeParticle !== 'summary' ? days[1] + '至' + days[days.length - 1] : row.date}中${groups}用户产生的从${eventNames[0]}到${eventNames[1]}的时间间隔的中位数为${row._midNum}`,
            `${
              row.index === 1 && intervalState.timeParticle !== 'summary'
                ? t('analysis.interval.dynamicTotalTooltip', {
                    startDate: days[1],
                    endDate: days[days.length - 1],
                    num: row._midNum,
                    groups,
                    type: t('analysis.interval.median'),
                    eventNames: eventNames[0],
                    eventNames1: eventNames[1],
                  })
                : t('analysis.interval.dynamicTooltip', {
                    date: row.date,
                    num: row._midNum,
                    groups,
                    type: t('analysis.interval.median'),
                    eventNames: eventNames[0],
                    eventNames1: eventNames[1],
                  })
            }
            `,
        },
        {
          prop: 'upFourNum',
          title: t('analysis.interval.upperQuartile'),
          align: 'right',
          tooltip: (item, row, groups = '') =>
            // `${row.index === 1 && intervalState.timeParticle !== 'summary' ? days[1] + '至' + days[days.length - 1] : row.date}中${groups}用户产生的从${eventNames[0]}到${eventNames[1]}的时间间隔的上四分位为${row._upFourNum}`,
            `${
              row.index === 1 && intervalState.timeParticle !== 'summary'
                ? t('analysis.interval.dynamicTotalTooltip', {
                    startDate: days[1],
                    endDate: days[days.length - 1],
                    num: row._upFourNum,
                    groups,
                    type: t('analysis.interval.upperQuartile'),
                    eventNames: eventNames[0],
                    eventNames1: eventNames[1],
                  })
                : t('analysis.interval.dynamicTooltip', {
                    date: row.date,
                    num: row._upFourNum,
                    groups,
                    type: t('analysis.interval.upperQuartile'),
                    eventNames: eventNames[0],
                    eventNames1: eventNames[1],
                  })
            }
            `,
        },
        {
          prop: 'maxNum',
          title: t('analysis.interval.maximumValue'),
          align: 'right',
          tooltip: (item, row, groups = '') =>
            // `${row.index === 1 && intervalState.timeParticle !== 'summary' ? days[1] + '至' + days[days.length - 1] : row.date}中${groups}用户产生的从${eventNames[0]}到${eventNames[1]}的时间间隔的最大值为${row._maxNum}`,
            `${
              row.index === 1 && intervalState.timeParticle !== 'summary'
                ? t('analysis.interval.dynamicTotalTooltip', {
                    startDate: days[1],
                    endDate: days[days.length - 1],
                    num: row._maxNum,
                    groups,
                    type: t('analysis.interval.maximumValue'),
                    eventNames: eventNames[0],
                    eventNames1: eventNames[1],
                  })
                : t('analysis.interval.dynamicTooltip', {
                    date: row.date,
                    num: row._maxNum,
                    groups,
                    type: t('analysis.interval.maximumValue'),
                    eventNames: eventNames[0],
                    eventNames1: eventNames[1],
                  })
            }
            `,
        },
      ]

      const boxData = value ? value?.boxData : groupValue?.boxDataGroup
      if ((value || groupValue) && boxData) {
        analysisResult.tableData = boxData.map((item, index) => {
          const _item = {
            date: days[index],
            ...item,
          }

          SPECIFIC_PROPS[0].forEach((key) => {
            _item[`_${key}`] = _item[key]

            if (key === 'num')
              _item[`_${key}`] =
                _item[key]?.toLocaleString() + t('analysis.interval.times')
          })

          SPECIFIC_PROPS[1].forEach((key) => {
            _item[`_${key}`] = getDuration(_item[key])
          })

          if (_item.groupBox && _item.groupBox.length > 0) {
            _item.groupBox.forEach((item) => {
              item.date =
                days[index] === t('analysis.total')
                  ? `${days[1]}${t('common.to')}${days[days.length - 1]}`
                  : days[index]
              item._groupCols = item.groupCols.split(',')

              SPECIFIC_PROPS[0].forEach((key) => {
                item[`_${key}`] = item[key]
                if (key === 'num')
                  item[`_${key}`] =
                    item[key].toLocaleString() + t('analysis.interval.times')
              })

              SPECIFIC_PROPS[1].forEach((key) => {
                item[`_${key}`] = getDuration(item[key])
              })
            })
          }

          return _item
        })
      }

      analysisResult.chartOption.yAxis.axisLabel.formatter = (value) =>
        getDuration(value)
      analysisResult.chartOption.tooltip.formatter = (params) => {
        return `
					<div>${params.data.groupName || ''}</div>
					<div>${params.name}</div>
					<div>
						<div>
							<span>${params.marker}</span>
							<span>${t('analysis.interval.minimumValue')}：${params.data._minNum}</span>
						</div>
						<div>
							<span>${params.marker}</span>
							<span>${t('analysis.interval.lowerQuartile')}：${params.data._downFourNum}</span>
						</div>
						<div>
							<span>${params.marker}</span>
							<span>${t('analysis.interval.median')}：${params.data._midNum}</span>
						</div>
						<div>
							<span>${params.marker}</span>
							<span>${t('analysis.interval.upperQuartile')}：${params.data._upFourNum}</span>
						</div>
						<div>
							<span>${params.marker}</span>
							<span>${t('analysis.interval.maximumValue')}：${params.data._maxNum}</span>
						</div>
					</div>
				`
      }
      analysisResult.chartOption.xAxis.data = days.slice(
        particleType.value.particle === 'summary' ? 0 : 1
      )

      if (days.length <= 3) {
        analysisResult.chartOption.dataZoom[0].disabled = true
        analysisResult.chartOption.dataZoom[0].end = 100
        analysisResult.chartOption.dataZoom[1].show = false
        analysisResult.chartOption.dataZoom[1].end = 100
        analysisResult.chartOption.legend.bottom = 10
      } else {
        analysisResult.chartOption.dataZoom[0].disabled = false
        analysisResult.chartOption.dataZoom[0].end = 40
        analysisResult.chartOption.dataZoom[1].show = true
        analysisResult.chartOption.dataZoom[1].end = 40
        analysisResult.chartOption.legend.bottom = 50
      }

      if (value) {
        analysisResult.chartOption.grid.bottom = days.length <= 3 ? 20 : 50

        analysisResult.chartOption.series.push({
          type: 'boxplot',
          itemStyle: {
            color:
              analysisResult.chartOption.color[
                analysisResult.chartOption.series.length
              ],
          },
          data: analysisResult.tableData
            .slice(particleType.value.particle === 'summary' ? 0 : 1)
            .map((item) => ({
              ...item,
              name: item.date,
              value: [
                item.minNum,
                item.downFourNum,
                item.midNum,
                item.upFourNum,
                item.maxNum,
              ],
            })),
        })
      } else if (groupValue) {
        analysisResult.chartOption.grid.bottom = days.length <= 3 ? 50 : 90

        intervalState.groupCheck.boxplotChecked =
          intervalState.groupCheck.boxplotChecked.filter((item) =>
            state.unionGroups.find((group) => group.value === item)
          )

        if (intervalState.groupCheck.boxplotChecked.length === 0) {
          intervalState.groupCheck.boxplotChecked = state.unionGroups
            .slice(0, 4)
            .map((item) => item.value)
        }

        analysisResult.chartOption.legend.data =
          intervalState.groupCheck.boxplotChecked
        intervalState.groupCheck.boxplotChecked.forEach((group) => {
          const data = []

          if (group === t('analysis.total')) {
            analysisResult.tableData
              .slice(particleType.value.particle === 'summary' ? 0 : 1)
              .forEach((item) => {
                data.push({
                  ...item,
                  groupName: group,
                  name: item.date,
                  value: [
                    item.minNum,
                    item.downFourNum,
                    item.midNum,
                    item.upFourNum,
                    item.maxNum,
                  ],
                })
              })
          } else {
            analysisResult.tableData
              .slice(particleType.value.particle === 'summary' ? 0 : 1)
              .forEach((item) => {
                const _item = item.groupBox.find(
                  (item) => item.groupCols === group
                )

                if (_item) {
                  data.push({
                    ..._item,
                    groupName: group,
                    name: _item.date,
                    value: [
                      _item.minNum,
                      _item.downFourNum,
                      _item.midNum,
                      _item.upFourNum,
                      _item.maxNum,
                    ],
                  })
                } else {
                  data.push({
                    groupName: group,
                    name: item.date,
                    value: [],
                  })
                }
              })
          }

          analysisResult.chartOption.series.push({
            name: group,
            type: 'boxplot',
            itemStyle: {
              color:
                analysisResult.chartOption.color[
                  analysisResult.chartOption.series.length
                ],
            },
            data,
          })
        })
      }
    } else if (intervalState.graphType === 3) {
      state.days = days.map((item) => ({ label: item, value: item }))

      if (intervalState.groupCheck.checkedTime) {
        intervalState.groupCheck.checkedTime =
          days.find((item) => item === intervalState.groupCheck.checkedTime) ||
          days[0]
      } else {
        intervalState.groupCheck.checkedTime = days[0]
      }

      const timeIntervalDuration = {}
      analysisResult.chartOption = barChartOptions()
      analysisResult.tableColumns = timeInterval.map((prop) => {
        const propArr = prop
          .substring(1, prop.length - 1)
          .split('~')
          .map((item) => parseInt(item))
        timeIntervalDuration[prop] = propArr.map((item) => getDuration(item))

        return {
          prop,
          title: `${prop}${t('dateRangeSelect.second')}`,
          align: 'center',
          tooltip: (item, row, groups = '') =>
            // `${row.index === 1 && intervalState.timeParticle !== 'summary' ? days[1] + '至' + days[days.length - 1] : row.date}中，有${row[item.prop]?.[0]}个${groups}用户进行${eventNames[0]}到${eventNames[1]}的间隔大于等于${timeIntervalDuration[item.prop][0]}且小于${timeIntervalDuration[item.prop][1]}，共产生${row[item.prop]?.[1]}次时间间隔`,
            `${
              row.index === 1 && intervalState.timeParticle !== 'summary'
                ? t('analysis.interval.boxplotTotalTooltip', {
                    startDate: days[1],
                    endDate: days[days.length - 1],
                    userNum: row[item.prop]?.[0],
                    groups,
                    eventNames: eventNames[0],
                    eventNames1: eventNames[1],
                    min: timeIntervalDuration[item.prop][0],
                    max: timeIntervalDuration[item.prop][1],
                    num: row[item.prop]?.[1],
                  })
                : t('analysis.interval.boxplotTooltip', {
                    date: row.date,
                    userNum: row[item.prop]?.[0],
                    groups,
                    eventNames: eventNames[0],
                    eventNames1: eventNames[1],
                    min: timeIntervalDuration[item.prop][0],
                    max: timeIntervalDuration[item.prop][1],
                    num: row[item.prop]?.[1],
                  })
            }`,
        }
      })
      analysisResult.tableColumns.unshift({
        prop: 'date',
        title: t('common.date'),
      })

      const intervalData = value
        ? value?.intervalData
        : groupValue?.intervalDataGroup
      if ((value || groupValue) && intervalData) {
        analysisResult.tableData = intervalData.map((item, index) => {
          const _item = {
            date: days[index],
            ...item,
          }
          timeInterval.forEach((prop, index2) => {
            _item[prop] = [item.userNumData[index2], item.numData[index2]]
            _item[`_${prop}`] = _item[prop]
          })

          if (_item.groupInterval && _item.groupInterval.length > 0) {
            _item.groupInterval.forEach((item) => {
              item.date =
                days[index] === t('analysis.total')
                  ? `${days[1]}${t('common.to')}${days[days.length - 1]}`
                  : days[index]
              item._groupCols = item.groupCols.split(',')

              timeInterval.forEach((prop, index2) => {
                item[prop] = [item.userNumData[index2], item.numData[index2]]
                item[`_${prop}`] = item[prop]
              })
            })
          }

          return _item
        })
      }

      analysisResult.chartOption.xAxis.data = timeInterval
      analysisResult.chartOption.xAxis.axisLabel.formatter = (value) =>
        `${value}${t('dateRangeSelect.second')}`
      analysisResult.chartOption.tooltip.formatter = (params) => {
        return `
					<span>
						<span>${params[0].marker}</span>
						<span>${params[0].name}${t('dateRangeSelect.second')}</span>
						<strong style="font-weight: 700; font-size: 16px">${params[0].data.value.toLocaleString()}</strong>
					</div>
				`
      }

      if (value) {
        const _data = analysisResult.tableData.find(
          (item) => item.date === intervalState.groupCheck.checkedTime
        )
        if (!_data) return

        analysisResult.chartOption.series.push({
          type: 'bar',
          data: _data[state.numType].map((num, index) => {
            return {
              name: timeInterval[index],
              date: intervalState.groupCheck.checkedTime,
              value: num,
            }
          }),
        })
      } else if (groupValue) {
        if (intervalState.groupCheck.barChecked) {
          intervalState.groupCheck.barChecked =
            state.unionGroups.find(
              (item) => item.value === intervalState.groupCheck.barChecked
            )?.value || state.unionGroups[0].value
        } else {
          intervalState.groupCheck.barChecked = state.unionGroups[0].value
        }

        const _data = analysisResult.tableData.find(
          (item) => item.date === intervalState.groupCheck.checkedTime
        )
        if (!_data) return

        const series = {
          type: 'bar',
          data: [],
        }

        if (intervalState.groupCheck.barChecked === t('analysis.total')) {
          series.data = _data[state.numType].map((num, index) => {
            return {
              name: timeInterval[index],
              date: intervalState.groupCheck.checkedTime,
              value: num,
            }
          })
        } else {
          series.data = _data.groupInterval
            .find(
              (item) => item.groupCols === intervalState.groupCheck.barChecked
            )
            ?.[state.numType].map((num, index) => {
              return {
                name: timeInterval[index],
                date: intervalState.groupCheck.checkedTime,
                value: num,
              }
            })
        }

        analysisResult.chartOption.series.push(series)
      }
    }

    nextTick(() => {
      const sortArr =
        intervalState.sortArr[intervalState.graphType === 8 ? 'boxplot' : 'bar']

      analysisResult.tableRef?.getTableRef()?.sortEvent(sortArr || [])
    }).then((r) => {})
  }

  /**
   * @description 监听分析请求结果
   * @author fengsi<294068744@qq.com>
   * @date 2024-02-29 09:53:05
   */
  watch(
    () => requestData.value,
    (requestData) => {
      handleDataFormat()
    },
    { immediate: false, deep: false }
  )

  /**
   * @description 导出表格数据 分析的
   * @author fengsi<294068744@qq.com>
   * @date 2024-02-29 09:56:22
   */
  const handleExport = () => {
    recordBehavior({
      moduleName: '分析',
      submoduleName: '间隔分析',
      operate: '导出报表数据',
      businessId: reportInfo.value?.businessId,
    })
    const fileHeader = analysisResult.tableColumns.map((item) =>
      item.title.replace(t('dateRangeSelect.second'), '')
    )
    const fileData = []

    const { value, groupValue, timeInterval } = requestData.value.analysis

    if (groupValue) {
      const groupColumn = groupValue.groupColumn.split(',')
      fileHeader.splice(1, 0, ...groupColumn)

      if (intervalState.graphType === 8) {
        analysisResult.tableData.forEach((item) => {
          const column = analysisResult.tableColumns.map((col) =>
            col.prop === 'date' ? item[col.prop] : item[`_${col.prop}`]
          )
          column.splice(
            1,
            0,
            ...groupColumn.map(() => t('analysis.interval.summaryData'))
          )
          fileData.push(column)

          item.groupBox.forEach((group) => {
            const column = analysisResult.tableColumns.map((col) =>
              col.prop === 'date' ? item[col.prop] : group[`_${col.prop}`]
            )
            column.splice(1, 0, ...group._groupCols)
            fileData.push(column)
          })
        })
      } else if (intervalState.graphType === 3) {
        fileHeader.splice(1 + groupColumn.length, 0, t('analysis.indicators'))
        const internalType = [
          t('analysis.numberOfUsers'),
          t('analysis.interval.numTimes'),
        ]
        analysisResult.tableData.forEach((item) => {
          internalType.forEach((type, index) => {
            const column = [
              item.date,
              ...groupColumn.map(() => t('analysis.interval.summaryData')),
              type,
              ...timeInterval.map((time) => item[`_${time}`][index]),
            ]
            fileData.push(column)
          })
          item.groupInterval.forEach((group) => {
            internalType.forEach((type, index) => {
              const column = [
                item.date,
                ...group._groupCols,
                type,
                ...timeInterval.map((time) => group[`_${time}`][index]),
              ]
              fileData.push(column)
            })
          })
        })
      }
    } else if (value) {
      if (intervalState.graphType === 8) {
        analysisResult.tableData.forEach((item) => {
          fileData.push(
            analysisResult.tableColumns.map((column) =>
              column.prop === 'date'
                ? item[column.prop]
                : item[`_${column.prop}`]
            )
          )
        })
      } else if (intervalState.graphType === 3) {
        fileHeader.splice(1, 0, t('analysis.indicators'))
        const internalType = [
          t('analysis.numberOfUsers'),
          t('analysis.interval.numTimes'),
        ]
        analysisResult.tableData.forEach((item) => {
          internalType.forEach((type, index) => {
            const column = [
              item.date,
              type,
              ...timeInterval.map((time) => item[`_${time}`][index]),
            ]
            fileData.push(column)
          })
        })
      }
    }

    analysisResult.tableRef.exportExcel({
      fileHeader,
      fileData,
    })
  }

  const handleGroupsVisibleChange = (visible) => {
    if (visible) return

    analysisResult.chartOption.series = []

    if (intervalState.graphType === 8) {
      analysisResult.chartOption.legend.data =
        intervalState.groupCheck.boxplotChecked

      intervalState.groupCheck.boxplotChecked.forEach((group) => {
        const data = []

        if (group === t('analysis.total')) {
          analysisResult.tableData
            .slice(particleType.value.particle === 'summary' ? 0 : 1)
            .forEach((item) => {
              data.push({
                ...item,
                groupName: group,
                name: item.date,
                value: [
                  item.minNum,
                  item.downFourNum,
                  item.midNum,
                  item.upFourNum,
                  item.maxNum,
                ],
              })
            })
        } else {
          analysisResult.tableData
            .slice(particleType.value.particle === 'summary' ? 0 : 1)
            .forEach((item) => {
              const _item = item.groupBox.find(
                (item) => item.groupCols === group
              )

              if (_item) {
                data.push({
                  ..._item,
                  groupName: group,
                  name: _item.date,
                  value: [
                    _item.minNum,
                    _item.downFourNum,
                    _item.midNum,
                    _item.upFourNum,
                    _item.maxNum,
                  ],
                })
              } else {
                data.push({
                  groupName: group,
                  name: item.date,
                  value: [],
                })
              }
            })
        }

        analysisResult.chartOption.series.push({
          name: group,
          type: 'boxplot',
          itemStyle: {
            color:
              analysisResult.chartOption.color[
                analysisResult.chartOption.series.length
              ],
          },
          data,
        })
      })
    } else if (intervalState.graphType === 3) {
      handleDaysOrNumTypeChange()
    }
  }

  const handleDaysOrNumTypeChange = () => {
    analysisResult.chartOption.series = []
    const {
      analysis: { days, eventNames, groupValue, timeInterval, value },
    } = requestData.value

    if (value) {
      const _data = analysisResult.tableData.find(
        (item) => item.date === intervalState.groupCheck.checkedTime
      )
      if (!_data) return

      analysisResult.chartOption.series.push({
        type: 'bar',
        data: _data[state.numType].map((num, index) => {
          return {
            name: timeInterval[index],
            date: intervalState.groupCheck.checkedTime,
            value: num,
          }
        }),
      })
    } else if (groupValue) {
      const _data = analysisResult.tableData.find(
        (item) => item.date === intervalState.groupCheck.checkedTime
      )
      if (!_data) return

      const series = {
        type: 'bar',
        data: [],
      }

      if (intervalState.groupCheck.barChecked === t('analysis.total')) {
        series.data = _data[state.numType].map((num, index) => {
          return {
            name: timeInterval[index],
            date: intervalState.groupCheck.checkedTime,
            value: num,
          }
        })
      } else {
        series.data =
          _data.groupInterval
            .find(
              (item) => item.groupCols === intervalState.groupCheck.barChecked
            )
            ?.[state.numType]?.map((num, index) => {
              return {
                name: timeInterval[index],
                date: intervalState.groupCheck.checkedTime,
                value: num,
              }
            }) || []
      }

      analysisResult.chartOption.series.push(series)
    }
  }

  /**
   * @description 表格排序
   * @author fengsi<294068744@qq.com>
   * @date 2024-03-11 16:44:00
   */
  const getSortArr = (sortArr) => {
    if (intervalState.graphType === 8) intervalState.sortArr.boxplot = sortArr
    else intervalState.sortArr.bar = sortArr
  }

  return {
    state,
    particleType,
    analysisResult,
    handleChange,
    handleChartTypeChange,
    handleExport,
    handleDataFormat,
    handleGroupsVisibleChange,
    handleDaysOrNumTypeChange,
    getSortArr,
  }
}

export default useMainHook
