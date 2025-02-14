import { cloneDeep } from 'lodash-es'
import { ref, reactive, nextTick, computed, watch } from 'vue'
import {
  sqlCalculate,
  getQueryResult,
  getQueryResultDownload,
} from '@/api/modules/analysis/sql'
import { ElMessage } from 'element-plus'
import useCancelRequest from '@/hooks/useCancelRequest.js'
import { recordBehavior } from '@/utils/record-behavior.js'
import { t } from '@/locales/i18n'

const numberType = ['int8', 'int4', 'float8', 'numeric', 'double']

export default function ({ route, resTableRef, props, emits }) {
  const cancelRequest = useCancelRequest()
  const state = reactive({
    activeRadio: 'data',
    chartTypeList: [
      { value: 'data', title: t('chart.data'), icon: 'chart-table' },
      { value: 'chart', title: t('chart.chart'), icon: 'chart-trend' },
    ],
    columns: [],
    sortArr: [],
    resData: {},
    tableData: [],
    headers: [],
    rows: [],
    dialogVisible: false,
    graphConfig: {},
    resSortArr: [],
    config: {},
    settings: {},
    graphType: null,
    showChartLabel: null,
    lastSql: null,
    lastParams: null,
    detailInfo: {},
    loading: false,
    errMessage: '',
    errType: 'error',
  })
  const chartTypeList = computed(() => {
    return JSON.stringify(state.graphConfig) === '{}'
      ? state.chartTypeList.filter((item) => item.value !== 'chart')
      : state.chartTypeList
  })

  watch(
    () => state.loading,
    () => {
      if (emits) {
        emits('loading', state.loading)
      }
    }
  )

  /**
   * @description 数据表排序获取
   */
  const getSortArr = (arr) => {
    state.sortArr = arr
  }

  /**
   * @description 可视化数据表排序
   */
  const handleResSortArr = (arr) => {
    state.resSortArr = arr
  }

  /**
   * @description 可视化弹框
   */
  const handleVisualizationDialog = () => {
    state.dialogVisible = true
    nextTick(() => {
      const cfg = cloneDeep(state.graphConfig)
      state.config = getConfig(cfg)
      state.settings = cfg.graphSettings || {}
      state.graphType = cfg.graphType || 1
      state.showChartLabel = !!cfg.showChartLabel
    })
  }

  const getConfig = (cfg) => {
    const config = {
      groupX: cfg.groupX || [],
      groupChildX: cfg.groupChildX || [],
      groupY: cfg.groupY || [],
      groupRY: cfg.groupRY || [],
      showGroupRY: !!cfg.showGroupRY,
      sortArr: state.resSortArr || cfg.sortArr || [],
    }
    return config
  }

  /**
   * @description 关闭可视化弹框
   */
  const handleClose = (config) => {
    if (config) {
      state.activeRadio = 'chart'
      state.graphConfig = cloneDeep(config)
    }

    state.config = {}
    state.settings = {}
    state.graphType = null
    state.showChartLabel = null
  }

  /**
   * @description 可视化显示数值
   */
  const handleGetShowChartLabel = (showChartLabel) => {
    state.graphConfig.showChartLabel = showChartLabel
  }

  /**
   * @description 移除可视化
   */
  const handleRemoveChart = () => {
    state.graphConfig = {}
    state.activeRadio = 'data'
  }

  /**
   * @description 获取参数
   */
  const getGraphConfig = () => {
    const cfg = cloneDeep(state.graphConfig)
    return {
      activeRadio: state.activeRadio,
      groupX: cfg.groupX || [],
      groupChildX: cfg.groupChildX || [],
      groupY: cfg.groupY || [],
      groupRY: cfg.groupRY || [],
      graphType: cfg.graphType || 1,
      showGroupRY: !!cfg.showGroupRY,
      graphSettings: cfg.graphSettings || {},
      sortArr: state.resSortArr || cfg.sortArr || [],
      showChartLabel: !!cfg.showChartLabel,
    }
  }

  /**
   * @description 设置参数
   * @description graphType  只有数据看板才有
   */
  const setGraphConfig = (config, sortArr, graphType) => {
    state.graphConfig = cloneDeep(config)
    const cfg = cloneDeep(config)
    if (graphType) {
      state.activeRadio = graphType === 6 ? 'data' : 'chart'
    } else {
      state.activeRadio = cfg.activeRadio || 'data'
    }
    state.sortArr = sortArr

    setTable()
  }

  const setTable = () => {
    state.tableData.splice(0, state.tableData.length)
    state.columns.splice(0, state.columns.length)
    state.headers.splice(0, state.headers.length)
    state.rows.splice(0, state.rows.length)

    if (JSON.stringify(state.resData) !== '{}') {
      state.headers.push(...state.resData.headers)
      state.rows.push(...state.resData.rows)
      //组装table表头
      state.resData.headers.forEach((item) => {
        state.columns.push({
          title: item.split(',')[0],
          prop: item.split(',')[0],
          sortable: true,
          sortType: numberType.includes(item.split(',')[1])
            ? 'number'
            : 'string',
        })
      })
      //组装table数据
      state.resData.rows.forEach((items) => {
        const obj = {}
        items.forEach((item, index) => {
          const propName = state.columns[index].prop
          obj[propName] = item
        })
        state.tableData.push(obj)
      })

      //watch 监听问题处理
      const cfg = cloneDeep(state.graphConfig)
      state.graphConfig = {}
      nextTick(() => {
        state.graphConfig = cfg
      })

      setTimeout(() => {
        resTableRef.value?.sortEvent(state.sortArr || [])
      })
    }
  }

  /**
   * @description sql计算
   */
  const handleCalculate = async (sql, list, type, reportId) => {
    state.resData = {}

    state.lastSql = sql
    state.lastParams = list
    const dynamic_list = []
    list.forEach((item) => {
      if (item.type === 'Selector') {
        dynamic_list.push({
          ...item,
          value:
            item.dataType === 'sql' || typeof item.value === 'string'
              ? item.value
              : item.value
                ? item.value.join(':::')
                : '',
          dataType: item.dataType,
        })
      } else {
        dynamic_list.push(item)
      }
    })
    const params = {
      sql,
      params: dynamic_list,
      appId: props?.params?.appId,
    }
    state.loading = true
    state.errMessage = ''
    if (type === 'calculate') {
      // 计算
      params.selectData = true
    } else {
      params.reportId = reportId
    }
    params.callback = cancelRequest.cancelCallBack
    try {
      const res = await sqlCalculate(params)
      if (res.code === 200) {
        state.resData = res.data
        setTable()
      } else {
        state.errType = 'error'
        state.errMessage = res.message
      }
    } catch (error) {
      console.log(error)
    }
    cancelRequest.cancelReset()
    state.loading = false
  }

  /**
   * @description 历史sql语句查询
   */
  const getHistoryQuery = (queryId) => {
    state.loading = true
    getQueryResult({ queryId })
      .then((res) => {
        if (res && res.code === 200) {
          state.resData = res.data
          setTable()
        }
      })
      .finally(() => {
        state.loading = false
      })
  }

  /**
   * @description 导出
   */
  const handleDownload = async () => {
    state.loading = true
    await recordBehavior({
      moduleName: '分析',
      submoduleName: 'SQL查询',
      operate: '导出查询结果',
      businessId: state.detailInfo?.businessId,
    })
    try {
      const res = await getQueryResultDownload({
        appId: props?.params?.appId,
        queryId: state.resData.queryId,
      })
      if (res && res.code === 200) {
        window.open(res.data)
      }
    } catch (error) {
      console.log(error)
    } finally {
      state.loading = false
    }
  }

  /**
   * @description sql校验
   */
  const checkSql = (sql) => {
    let flag = true
    if (sql.trim().toLowerCase().indexOf('select') === -1) {
      flag = false
    }
    if (sql.trim().toLowerCase().indexOf('from') === -1) {
      flag = false
    }

    if (!flag) {
      ElMessage({
        type: 'warning',
        message: t('analysis.sqlquery.checkSql'),
      })
      return flag
    }

    if (sql.slice(-1) === ';' || sql.slice(-1) === '；') {
      flag = false
      ElMessage({
        type: 'warning',
        message: t('analysis.sqlquery.checkSelectSqlSemicolon'),
      })
      return flag
    }
    return true
  }

  /**
   * @description 动态参数值校验
   */
  const checkDynamic = (dynamic_list) => {
    let flag = true
    for (const item of dynamic_list) {
      if (
        (item.value instanceof Array && !item.value.length) ||
        item.value === '' ||
        item.value === undefined
      ) {
        ElMessage({
          type: 'warning',
          message: t('analysis.sqlquery.checkParameter'),
        })
        flag = false
        break
      }
    }

    return flag
  }

  /**
   * @description 保存
   */
  const saveQp = () => {
    if (
      state.lastSql === null ||
      state.lastSql.replace(/\s/g, '') !== props.sql.replace(/\s/g, '') ||
      JSON.stringify(state.lastParams) !== JSON.stringify(props.list)
    ) {
      ElMessage({
        message: t('analysis.sqlquery.confirmCalculation'),
        type: 'warning',
      })
      return
    }

    const dynamic_list = []
    props.list.forEach((item) => {
      if (item.type === 'Selector') {
        dynamic_list.push({
          ...item,
          value:
            item.dataType === 'sql'
              ? item.value
              : item.value
                ? item.value.join(':::')
                : '',
          dataType: item.dataType,
        })
      } else {
        dynamic_list.push(item)
      }
    })

    if (!checkSql(props.sql) || !checkDynamic(dynamic_list)) {
      return
    }

    const qp = {
      sql: props.sql,
      dynamic_list,
      sortArr: state.sortArr,
    }

    const data = {
      qp: JSON.stringify(qp),
      graphType: state.activeRadio === 'data' ? 6 : 5,
      queryId: state.resData.queryId,
    }

    data.graphConfig =
      JSON.stringify(state.graphConfig) === '{}'
        ? ''
        : JSON.stringify(getGraphConfig())

    if (route.query.id) {
      data.name = state.resData.reportName
      data.reportDesc = state.resData.reportDesc
      data.labelNameList = state.resData.labelNameList
      // 保存和另存为  添加至看板
      data.dashboardList = state.resData.dashboardList
      data.updateSet = state.resData.updateSet
    }
    return data
  }

  const filterBytes = (val) => {
    if (val > 1024) {
      return (val / 1024).toFixed(2) + 'kB'
    }
    return val + 'B'
  }

  const setDetail = (data) => {
    state.detailInfo = {
      name: data.name,
      authority: data.authority,
      reportDesc: data.reportDesc,
      businessId: data.businessId,
      dashboardList: data.dashboardList || [],
      labelNameList: data.labelNameList || [],
      updateSet: data.updateSet,
      created: data.created,
      createTime: data.createTime,
      modifier: data.modifier,
      updateTime: data.updateTime,
    }
    return state.detailInfo
  }

  /**
   *
   * @description 获取数据组件
   */
  const getDataComponent = async ({ type }) => {
    console.log(props)

    const resData = cloneDeep(props.info)

    if (type === 'notReq') {
      // 数据看板修改报表类型
      state.activeRadio = resData.graphType === 6 ? 'data' : 'chart'
    } else {
      const qp = JSON.parse(resData.qp)
      // 数据看板刷新跟探索请求不更新配置
      if (type !== 'refresh' || !type) {
        const sortArr = qp.sortArr || []
        // 设置报表配置及图表配置
        setGraphConfig(
          resData.graphConfig ? JSON.parse(resData.graphConfig) : {},
          sortArr,
          resData.graphType
        )
        // 设置报表基本信息
        setDetail(resData)
      }
      let dynamic_list = qp.dynamic_list

      //数据看板探索参数替换
      if (
        props.params &&
        props.params.dynamic_list &&
        props.params.dynamic_list.length
      ) {
        dynamic_list = props.params.dynamic_list
      }
      await handleCalculate(qp.sql, dynamic_list, 'calculate')
    }
  }

  /**
   *
   * @description 刷新数据组件
   */

  const reCalculateData = async (info) => {
    const qp = JSON.parse(info.qp)
    await handleCalculate(qp.sql, qp.dynamic_list, 'calculate')
  }

  /**
   * @description 获取探索可视化数据
   */
  const getExploreVisualData = () => {
    const cfg = cloneDeep(state.graphConfig)
    return {
      columns: state.columns,
      data: state.tableData,
      headers: state.headers,
      rows: state.rows,
      config: getConfig(cfg),
      settings: cfg.graphSettings || {},
      graphType: cfg.graphType || 1,
      showChartLabel: !!cfg.showChartLabel,
    }
  }

  //用于将看板的选择状态带到探索里
  const getInfo = () => {
    const data = props.info
    const qp = JSON.parse(data.qp)
    qp.sortArr = state.sortArr || []
    const info = {
      ...data,
      qp: JSON.stringify(qp),
    }
    if (data.graphConfig && data.graphConfig !== '{}') {
      const graphConfig = {
        ...JSON.parse(data.graphConfig),
        activeRadio: state.activeRadio,
        showChartLabel: !!state.graphConfig.showChartLabel,
        sortArr: state.resSortArr || [],
      }
      info.graphConfig = JSON.stringify(graphConfig)
    }
    info.graphType = state.activeRadio === 'data' ? 6 : 5
    return info
  }

  const reportDetail = (info) => {
    emits('reportDetail', info)
  }

  /**
   * @description 取消计算
   */
  const cancelCalculate = () => {
    cancelRequest.cancelCalculate(() => {
      state.loading = false
      state.errMessage = t('analysis.reportCalcCanceled')
      state.errType = 'info'
    })
  }

  return {
    state,
    getSortArr,
    handleResSortArr,
    handleVisualizationDialog,
    handleClose,
    handleGetShowChartLabel,
    handleRemoveChart,
    getGraphConfig,
    setGraphConfig,
    handleCalculate,
    reCalculateData,
    getHistoryQuery,
    handleDownload,
    saveQp,
    filterBytes,
    setDetail,
    getDataComponent,
    chartTypeList,
    getExploreVisualData,
    getInfo,
    reportDetail,
    cancelCalculate,
    cancelRequest,
  }
}
