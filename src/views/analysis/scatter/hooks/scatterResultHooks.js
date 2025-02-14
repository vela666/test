import { computed, ref, reactive, watch, nextTick } from 'vue'
import { past7DayRange } from '@/enumeration/date'
import { chartTypeMap } from '@/views/analysis/components/AnalysisMain/index.js'
import { cloneDeep } from 'lodash-es'
import { recordBehavior } from '@/utils/record-behavior.js'
import { formatDateWithWeek } from '@/utils'
import { t } from '@/locales/i18n'

export function useScatterResultHooks(emit, props) {
  const analysisResult = reactive({
    status: -1,
    dateRange: past7DayRange,
    dataDesc: '',
    timeParticle: 'day',
    firstDayOfWeek: 1,
    dataQP: '',
    tableData: [],
    columns: [],
    sortArr: [],
    dataSource: {},
    loading: false,
    CustomTableRef: null,
    errMessage: '',
  })

  const visible = ref(null)

  const timeParticleList = [
    {
      value: 'day',
      label: t('common.byDay'),
    },
    {
      value: 'week',
      label: t('common.byWeek'),
    },
    {
      value: 'month',
      label: t('common.byMonth'),
    },
    {
      value: 'summary',
      label: t('common.total'),
    },
  ]

  const chartTypeList = ref([...chartTypeMap.get('table')])

  const dashboardChartTypeList = computed(() => [...chartTypeList.value])

  /**
   * @description: 格式化图表类型选择
   * @return {*}
   */
  const initTypeList = computed(() => {
    const chartList = []
    dashboardChartTypeList.value.forEach((item) => {
      chartList.push({
        ...item,
        value: item.graphType,
      })
    })

    return chartList
  })

  /**
   * @description: 渲染数据表格
   * @return {*}
   * @param {*} data 数据源
   * @param {*} qp
   */
  const renderTable = (data, qp) => {
    analysisResult.tableData = []
    analysisResult.columns = []

    const { resultGenerateTime, analysis, resultClusterSql } = data
    analysisResult.resultClusterSql = resultClusterSql
    analysisResult.resultGenerateTime = resultGenerateTime
    analysisResult.status = !analysis || analysis?.items?.length === 0 ? 0 : 1
    analysisResult.dataSource = cloneDeep(analysis)
    analysisResult.dataQP = qp
    analysisResult.sortArr = qp.sortArr
    analysisResult.dataDesc = analysis?.dataDesc || ''

    if (!analysisResult.status) return
    nextTick(() => {
      renderTableData()
      renderColumns()
    })
  }

  /**
   * @description: 绘制表格
   * @return {*}
   */
  const renderTableData = () => {
    const data = []
    analysisResult.dataSource.items.forEach((item) => {
      const obj = {
        date: formatDateWithWeek(item['on_date']),
        children: item['group_data'] || [],
      }

      item.values.forEach((val, i) => {
        obj[`col_${i + 1}`] = Number(val)
        if (i > 0) {
          obj[`col_rate_${i + 1}`] = obj['col_1']
            ? Math.round((obj[`col_${i + 1}`] / obj['col_1']) * 10000) / 100
            : 0
        }
      })

      data.push(obj)
    })

    analysisResult.tableData = data.sort((a, b) => (a.date < b.date ? -1 : 1))
    setTimeout(() => {
      analysisResult.CustomTableRef?.getTableRef().sortEvent(
        analysisResult.sortArr || []
      )
    })
  }

  /**
   * @description: 绘制表头
   * @return {*}
   */
  const renderColumns = () => {
    const columns = [
      {
        title: t('analysis.scatter.eventDate'),
        prop: 'date',
        // fixed: 'left',
      },
    ]

    analysisResult.dataSource.distributionInterval.forEach((item, i) => {
      columns.push({
        title: item,
        prop: `col_${i + 1}`,
        align: 'right',
      })
    })
    analysisResult.columns = columns
  }

  /**
   * @description: 重新开始分析
   * @return {*}
   */
  const reCalcute = () => {
    if (analysisResult.status !== -1) {
      nextTick(() => {
        emit('calcute')
      })
    }
  }

  /**
   * @description: 下载报表
   * @return {*}
   */
  const download = () => {
    recordBehavior({
      moduleName: '分析',
      submoduleName: '分布分析',
      operate: '导出报表数据',
      businessId: props.info?.businessId,
    })
    const fileHeader = []
    const fileData = []
    const tableData = groupDetailList(cloneDeep(analysisResult.tableData))
    const totalColumns = cloneDeep(analysisResult.columns)

    const i = totalColumns.findIndex((item) => item.prop === 'col_1')
    totalColumns.splice(i + 1, 0, {
      title: t('analysis.indicators'),
      prop: 'customField',
    })

    const group =
      analysisResult.dataSource &&
      JSON.stringify(analysisResult.dataSource) !== '{}'
        ? [...analysisResult.dataSource.group_column.split(',')].filter(Boolean)
        : []
    const groupColumns = []

    if (group.length > 0) {
      group.forEach((item, i) => {
        const temp = {
          title: item,
          prop: `groupName_${i}`,
        }
        groupColumns.push(temp)

        totalColumns.splice(i + 1, 0, temp)
      })

      analysisResult.dataSource.distributionInterval.forEach((item, i) => {
        groupColumns.push({
          title: item,
          prop: i === 0 ? 'col_0' : `col_${i + group.length}`,
        })
      })

      groupColumns.unshift({
        title: t('analysis.scatter.eventDate'),
        prop: 'date',
      })
    }

    const j = groupColumns.findIndex((item) => item.prop === 'col_0')
    groupColumns.splice(j + 1, 0, {
      title: t('analysis.indicators'),
      prop: 'customField',
    })

    tableData.forEach((item) => {
      const numList = []

      totalColumns.forEach((val, i) => {
        if (
          val.prop.includes('groupName') ||
          ['date', 'col_1'].includes(val.prop)
        ) {
          item[val.prop] === undefined
            ? numList.push(t('analysis.total'))
            : numList.push(item[val.prop])
        } else if (val.prop === 'customField') {
          numList.push(t('analysis.numPeople'))
        } else {
          numList.push(`${item[val.prop]}`)
        }
      })
      fileData.push(numList)

      const rateList = []
      totalColumns.forEach((val, i) => {
        if (
          val.prop.includes('groupName') ||
          ['date', 'col_1'].includes(val.prop)
        ) {
          item[val.prop] === undefined
            ? rateList.push(t('analysis.total'))
            : rateList.push(item[val.prop])
        } else if (val.prop === 'customField') {
          rateList.push(t('analysis.ratio'))
        } else {
          rateList.push(`${item[`col_rate_${i - 1 - group.length}`]}%`)
        }
      })

      fileData.push(rateList)

      // 有分组项时
      if (item.children.length > 0) {
        item.children.forEach((child, i) => {
          const groupNumList = []
          groupColumns.forEach((val, i) => {
            if (val.prop === 'date') {
              groupNumList.push(item[val.prop])
            } else if (val.prop.includes('groupName') || val.prop === 'col_0') {
              groupNumList.push(child[val.prop])
            } else if (val.prop === 'customField') {
              groupNumList.push(t('analysis.numPeople'))
            } else {
              groupNumList.push(`${child[val.prop]}`)
            }
          })

          fileData.push(groupNumList)

          const groupRateList = []
          groupColumns.forEach((val, i) => {
            if (val.prop === 'date') {
              groupRateList.push(item[val.prop])
            } else if (val.prop.includes('groupName') || val.prop === 'col_0') {
              groupRateList.push(child[val.prop])
            } else if (val.prop === 'customField') {
              groupRateList.push(t('analysis.ratio'))
            } else {
              groupRateList.push(`${child[`col_rate_${i - 2}`]}%`)
            }
          })

          fileData.push(groupRateList)
        })
      }
    })

    totalColumns.forEach((item) => {
      fileHeader.push(item.title)
    })

    analysisResult.analysisTableRef.exportExcel({
      fileHeader,
      fileData,
    })
  }

  /**
   * @description: 获取分组详情
   * @return {*}
   */
  const groupDetailList = (dataList) => {
    const data = []
    dataList.forEach((val) => {
      const temp = {
        ...val,
        children: [],
      }

      val.children.forEach((item) => {
        const groupField = item.group_column.split(',')
        const obj = {}
        groupField.forEach((val, i) => {
          obj[`groupName_${i}`] = val
        })

        item.values.forEach((val, i) => {
          if (i > 0) {
            obj[`col_${i + groupField.length}`] = Number(val)
            obj[`col_rate_${i + groupField.length}`] = obj['col_0']
              ? Math.round(
                  (obj[`col_${i + groupField.length}`] / obj['col_0']) * 10000
                ) / 100
              : 0
          } else {
            obj[`col_0`] = Number(val)
          }
        })
        temp.children.push(obj)
      })

      temp.children.sort((a, b) => b['col_0'] - a['col_0'])

      data.push(temp)
    })

    return data
  }

  /**
   * @description: 保存草稿--回显时间
   * @return {*}
   * @param {*} date
   */
  const echoGlobalFilters = ({
    dateRange,
    firstDayOfWeek,
    timeParticle,
    sortArr,
  }) => {
    analysisResult.dateRange = {
      ...dateRange,
      shortcutType: dateRange.shortcutType ?? '',
    }

    analysisResult.firstDayOfWeek = firstDayOfWeek
    analysisResult.timeParticle = timeParticle
    analysisResult.sortArr = sortArr
  }

  /**
   * @description: 错误信息处理
   */
  const setErrMessage = (msg = '') => {
    analysisResult.errMessage = msg
  }

  return {
    analysisResult,
    chartTypeList,
    initTypeList,
    renderTable,
    reCalcute,
    download,
    echoGlobalFilters,
    timeParticleList,
    visible,
    setErrMessage,
    dashboardChartTypeList,
  }
}
