import { computed, ref, reactive, watch, nextTick } from 'vue'
import { past7DayRange } from '@/enumeration/date'
import { chartTypeMap } from '@/views/analysis/components/AnalysisMain/index.js'
import { cloneDeep } from 'lodash-es'
import { recordBehavior } from '@/utils/record-behavior.js'
import { t } from '@/locales/i18n'

export default function (emit, props) {
  const analysisResult = reactive({
    status: -1,
    dateRange: past7DayRange,
    dataDesc: '',
    dataQP: '',
    tableData: [],
    columns: [],
    sortArr: [],
    dataSource: {},
    loading: false,
    CustomTableRef: null,
    errMessage: '',
  })

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
    analysisResult.dataSource.items.forEach((item, index) => {
      let obj = {}
      const { targetColumnVal, attrColumnVal, ...args } = item

      targetColumnVal.forEach((v, i) => {
        obj[`target_${i + 1}`] = v
      })

      attrColumnVal.forEach((v, i) => {
        obj[`attr_${i + 1}`] = v
      })
      obj = { ...obj, ...args }

      data.push(obj)
    })

    analysisResult.tableData = data
    requestIdleCallback(() => {
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
    const columns = []

    const { targetColumn, attrColumn } = analysisResult.dataSource

    targetColumn.forEach((item, i) => {
      columns.push({
        title: item,
        prop: `target_${i + 1}`,
        // align: 'right',
      })
    })

    attrColumn.forEach((item, i) => {
      columns.push({
        title: item,
        prop: `attr_${i + 1}`,
        // align: 'right',
      })
    })
    columns.push(
      {
        title: t('analysis.attributed.contributionValue'),
        prop: 'efftTotal',
        tip: t('analysis.attributed.targetEventValueTip'),
      },
      {
        title: t('analysis.attributed.contributionRate'),
        prop: 'totalLv',
        tip: t('analysis.attributed.eventContributionRatioTip'),
        // fixed: 'right',
      },
      {
        title: t('analysis.attributed.totalTriggers'),
        prop: 'totalCount',
        tip: t('analysis.attributed.totalTriggerCountTip'),
      },
      {
        title: t('analysis.attributed.validTriggerCountRate'),
        prop: 'efftCount',
        tip: `<div>${t('analysis.attributed.validTriggerCountTip')}</div>
        <div>${t('analysis.attributed.validTriggerRateTip')}</div>`,
      },
      {
        title: t('analysis.attributed.validTriggerUsers'),
        prop: 'efftUser',
        tip: t('analysis.attributed.uniqueUsersTip'),
      }
    )
    analysisResult.columns = columns
  }

  /**
   * @description: 重新开始分析
   * @return {*}
   */
  const reCalcute = () => {
    // if (analysisResult.status !== -1) {
    nextTick(() => {
      emit('calcute')
    })
    // }
  }

  /**
   * @description: 下载报表
   * @return {*}
   */
  const download = () => {
    recordBehavior({
      moduleName: '分析',
      submoduleName: '归因分析',
      operate: '导出报表数据',
      businessId: props.info?.businessId,
    })

    const fileHeader = []
    const dataKeys = []
    analysisResult.columns.forEach((item) => {
      if (item.prop === 'efftCount') {
        fileHeader.push(
          t('analysis.attributed.validTriggerCount'),
          t('analysis.attributed.validTriggerRate')
        )
        dataKeys.push(item.prop, 'efftLv')
      } else {
        fileHeader.push(item.title)
        dataKeys.push(item.prop)
      }
    })
    // 保证和列表排序后的数据一致
    let fileData = analysisResult.CustomTableRef?.getTableRef()
      ?.xTable.getTableData()
      .visibleData.map((v) =>
        dataKeys.map((j) => {
          return v[j] || '-'
        })
      )

    analysisResult.analysisTableRef.exportExcel({
      fileHeader,
      fileData,
    })
  }

  /**
   * @description: 保存草稿--回显时间
   * @return {*}
   * @param {*} date
   */
  const echoGlobalFilters = ({ dateRange, sortArr }) => {
    analysisResult.dateRange = {
      ...dateRange,
      shortcutType: dateRange.shortcutType ?? '',
    }

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
    setErrMessage,
    dashboardChartTypeList,
  }
}
