<script setup>
import {
  ref,
  reactive,
  nextTick,
  onMounted,
  h,
  createApp,
  onBeforeUnmount,
} from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import EncodeDropdown from './components/EncodeDropdown.vue'
import TableStructure from './components/TableStructure/index.vue'
import DynamicParamButton from './components/DynamicParamButton.vue'
import DynamicParams from './components/DynamicParams.vue'
import historyTable from './historyTable.vue'
import collectTable from './collectTable.vue'
import InputDialog from './components/InputDialog.vue'
import asyncSearchTable from './asyncSearchTable.vue'
import searchResultTable from './searchResultTable.vue'
import DetailSqlDropdown from './components/DetailSqlDropdown.vue'
import ExampleDrawer from './components/ExampleDrawer.vue'
import ChangeCalculate from './components/ChangeCalculate.vue'
import copyText from '@/utils/clipboard'
import { Base64 } from 'js-base64'
import draggable from 'vuedraggable'
import {
  getBookmarkAdd,
  addAsyncQuery,
  moreDataDownload,
} from '@/api/modules/analysis/sql'
import dayjs from 'dayjs'
import { cloneDeep } from 'lodash-es'
import { useTipModal } from '@/components/TipDialog'
import { CircleClose } from '@element-plus/icons-vue'
import authEnum from '@/views/analysis/enum.js'
import { recordBehavior } from '@/utils/record-behavior.js'
import { reportTypeListMap } from '@/enumeration/report.js'
import { t } from '@/locales/i18n'

defineOptions({
  name: 'Sqlquery',
})

const config = () => {
  return {
    reportType: 7,
    detailInfo: {},
    put: true,
    formData: {
      sql: '',
    },
    dynamic_list: [],
    opt: 'add',
    checkAll: false,
    indeterminate: true,
    checkTwo: false,
    encode: 'GBK',
    activeName: 'table',
    searchResultTabs: [],
    searchResultActiveName: 'initResult',
    collectVisible: false,
    asyncVisible: false,
    loading: false,
  }
}

const state = reactive(config())

/**
 * @description 选中按钮组件点击
 */
const handleChangeCalculate = () => {
  handleCalculate('select')
  removeCalculate()
}

/**
 * @description 销毁选中按钮组件
 */
const removeCalculate = () => {
  const ele = document.getElementById('eas-sql-select-calculate')
  if (ele) {
    ele.remove()
  }
}

/**
 * @description 创建按钮组件
 */
const createContainer = async (x, y) => {
  return new Promise((resolve, reject) => {
    const instance = createApp({
      render() {
        return h(ChangeCalculate, {
          selection: t('analysis.sqlquery.calculateSelection'),
          selectionTips: t('analysis.sqlquery.calculateSelectionTips'),
          onClose: handleChangeCalculate,
          onResolve: resolve,
          onReject: reject,
        })
      },
    })

    const container = document.createElement('div')
    container.setAttribute('id', 'eas-sql-select-calculate')
    let newLeft = x
    if (newLeft >= 400 && newLeft <= 1200) {
      newLeft = x - 50
    } else if (newLeft > 1200) {
      newLeft = x - 110
    }
    container.style.position = 'absolute'
    container.style.left = `${newLeft}px`
    container.style.top = `${y + 15}px`
    container.style.zIndex = 999
    container.style.background = '#fff'
    container.style.boxShadow = '0px 3px 10px 1px rgba(28,32,40,0.18)'
    container.style.borderRadius = '4px'
    container.style.padding = '4px'
    document.body.appendChild(container)

    instance.mount(container)
  })
}
let aceContent = null

onMounted(() => {
  aceContent = document.getElementsByClassName('ace_content')[0]

  addEventListener('mouseup', addChangeBtn)

  addEventListener('mousedown', removeChangeBtn)
})

onBeforeUnmount(() => {
  removeEventListener('mouseup', addChangeBtn)

  removeEventListener('mousedown', removeChangeBtn)
})

const addChangeBtn = (event) => {
  const changeCalculate = document.getElementById('eas-sql-select-calculate')
  if (aceContent.contains(event.target)) {
    const changeSql = sqlqueryAceEditorRef.value
      .getVAceEditorEle()
      ._editor.session.getTextRange(
        sqlqueryAceEditorRef.value
          .getVAceEditorEle()
          ._editor.getSelectionRange()
      )
    if (changeSql) {
      const x = event.clientX
      const y = event.clientY
      createContainer(x, y)
    }
  } else if (!changeCalculate || !changeCalculate.contains(event.target)) {
    removeCalculate()
  }
}

const removeChangeBtn = (event) => {
  if (aceContent.contains(event.target)) {
    removeCalculate()
  }
}

/**
 * @description 报表详情数据解析
 */
const reportDetail = (info) => {
  state.searchResultTabs.splice(0, state.searchResultTabs.length)
  const resData = cloneDeep(info)

  getSqlSettings(
    JSON.parse(resData.qp).sql,
    JSON.parse(resData.qp).dynamic_list
  )
  const sortArr = JSON.parse(resData.qp).sortArr || []
  // 设置报表配置及图表配置
  searchResultRef.value?.setGraphConfig(
    resData.graphConfig ? JSON.parse(resData.graphConfig) : {},
    sortArr,
    resData.graphType
  )
  // 设置报表基本信息
  state.detailInfo = searchResultRef.value?.setDetail(resData)
  if (!info.fromSave) {
    //从保存场景来的,不重新计算
    handleCalculate()
  }
}

const searchResultRef = ref()
const searchResultTabsRef = ref([])
const historyTableRef = ref()
const collectTableRef = ref()
const asyncSearchTableRef = ref()

/**
 * @description 收起/展开sql输入框
 */
const handlePut = () => {
  state.put = !state.put
}

const exampleDrawerRef = ref()

/**
 * @description 示例展示
 */
const handleExample = () => {
  exampleDrawerRef.value.open()
}

/**
 * @description 标签页切换调用组件接口
 */
const handleTabChange = (activeName) => {
  if (state.activeName === 'result') {
    console.log('result')
  } else if (state.activeName === 'history') {
    historyTableRef.value.getHistoryList('init')
  } else if (state.activeName === 'collect') {
    collectTableRef.value.getCollectList('init')
  } else if (state.activeName === 'query') {
    asyncSearchTableRef.value.getAsyncSearchList('init')
  }
}

/**
 * @description 解析sql语句赋值
 */
const getParseTableSql = (sql) => {
  state.formData.sql = sql
  state.dynamic_list = []
}

/**
 * @description 赋值sql语句及动态参数
 */
const getSqlSettings = (sql, list) => {
  state.dynamic_list = []
  getParseTableSql(sql)
  if (list) {
    list.forEach((item) => {
      if (item.type === 'Selector') {
        item.value =
          item.dataType === 'sql'
            ? item.value
            : item.value
              ? item.value.split(':::')
              : []
        item.dataType = !item.dataType ? 'sql' : item.dataType
      }
    })
    state.dynamic_list = list
  }
}

/**
 * @description 历史sql语句查询
 */
const getHistoryQuery = (queryId) => {
  state.activeName = 'result'
  searchResultRef.value.getHistoryQuery(queryId)
}

/**
 * @description 新增动态参数
 */
const handleAddParam = (opt, key) => {
  if (opt === 'add') {
    let list = {}
    const common_proto = {
      value: '',
      displayName: '',
      remark: '',
      check: false,
    }

    const filterList = state.dynamic_list.filter(
      (item) => item.type === key && key !== 'AppId'
    )
    let index = 1
    if (state.dynamic_list.length > 0 && filterList.length) {
      const regExp = /^(.*[^0-9])([0-9]*)$/g
      filterList.forEach((e) => {
        const idx = Number(e.name.replace(regExp, '$2')) || 0
        if (index >= idx) {
          index = idx + 1
        }
      })
    }

    switch (key) {
      case 'Number':
        list = {
          replacement: `{Number:number_${index}}`,
          name: `number_${index}`,
          type: 'Number',
          ...common_proto,
          value: undefined,
        }
        break
      case 'Text':
        list = {
          replacement: `{Text:text_${index}}`,
          name: `text_${index}`,
          type: 'Text',
          ...common_proto,
        }
        break
      case 'DateTime':
        list = {
          replacement: `{DateTime:datetime_${index}}`,
          name: `DateTime_${index}`,
          type: 'DateTime',
          ...common_proto,
        }
        break
      case 'Date':
        list = {
          replacement: `{Date:date_${index}}`,
          name: `Date_${index}`,
          type: 'Date',
          ...common_proto,
        }
        break
      case 'Selector':
        list = {
          replacement: `{Selector:selector_${index}}`,
          name: `selector_${index}`,
          type: 'Selector',
          ...common_proto,
          dataType: 'sql',
          items: [],
        }
        break
      case 'AppId':
        list = {
          replacement: `{AppId:appId}`,
          name: `appId`,
          type: 'AppId',
          ...common_proto,
          value: sessionStorage.getItem('appId'),
        }
        break
    }

    if (
      state.dynamic_list.length &&
      state.dynamic_list.some(
        (item) => item.type === list.type && list.type === 'AppId'
      )
    ) {
      ElMessage({
        type: 'warning',
        message: t('analysis.sqlquery.checkAppIdParamExist'),
      })
      return
    }

    state.dynamic_list.push(list)
  } else if (opt === 'copy') {
    // 清空所有复选
    state.dynamic_list.forEach((item) => {
      item.check = false
    })
    state.checkAll = false
    if (!state.dynamic_list.length) {
      ElMessage({
        type: 'warning',
        message: t('analysis.sqlquery.checkAppIdParamEmpty'),
      })
      return
    }
  }
  state.opt = opt
}

/**
 * @description 粘贴赋值
 */
const handlePaste = (list, coverFlag) => {
  let appIdParam = false
  list.forEach((item) => {
    if (
      state.dynamic_list.some(
        (i) => i.type === 'AppId' && item.type === 'AppId'
      )
    ) {
      // 已存在AppId动态参数直接过滤
      appIdParam = true
      return
    }
    const filterList = state.dynamic_list.filter(
      (i) => i.type === item.type && item.type !== 'AppId'
    )
    let index = 1
    if (
      state.dynamic_list.length > 0 &&
      filterList.length &&
      filterList.some((e) => e.name === item.name)
    ) {
      if (coverFlag) {
        index = state.dynamic_list.findIndex((e) => e.name === item.name)
        state.dynamic_list[index] = item
        return
      } else {
        index = 1
        const regExp = /^(.*[^0-9])([0-9]*)$/g
        const filterItem = filterList.filter((e) => e.name === item.name)[0]
        index = (Number(filterItem.name.replace(regExp, '$2')) || 0) + 1
        item.replacement = `${filterItem.replacement.replace(/^(.*[^0-9])([0-9]*)\}$/g, '$1')}${index}}`
        item.name = `${filterItem.name.replace(regExp, '$1')}${index}`
      }
    }
    if (item.type === 'AppId') {
      item.value = sessionStorage.getItem('appId')
    }
    state.dynamic_list.push(item)
  })
  if (appIdParam) {
    ElMessage({
      type: 'warning',
      message: t('analysis.sqlquery.ignoredAppIdParamEmpty'),
    })
  }
}

/**
 * @description 复制全选change
 */
const handleCheckAllChange = (val) => {
  if (val) {
    state.dynamic_list.forEach((item) => (item.check = true))
  } else {
    state.dynamic_list.forEach((item) => (item.check = false))
  }
  state.isIndeterminate = false
}

/**
 * @description 复制参数
 */
const handleCopyParam = (event) => {
  const checkList = state.dynamic_list.filter((item) => item.check)
  if (!checkList.length) {
    ElMessage({
      type: 'warning',
      message: t('analysis.sqlquery.dynamicParamsSelect'),
    })
    return
  }
  const res = {
    type: '7',
    data: checkList,
  }
  copyText(Base64.encode(JSON.stringify(res)), event)
  handleCancelParam()
}

/**
 * @description 取消复制参数
 */
const handleCancelParam = () => {
  state.opt = 'add'
}

const sqlqueryAceEditorRef = ref()

/**
 * @description sql格式化
 */
const handleSqlFormat = () => {
  state.formData.sql = sqlqueryAceEditorRef.value.getFormatSQL(
    state.formData.sql
  )
}

/**
 * @description 导出更多
 */
const handleExportMore = () => {
  const sql = state.formData.sql
  if (!checkSql(sql) || !checkDynamic()) {
    return
  }
  const list = state.dynamic_list
  const dynamic_list = []
  list.forEach((item) => {
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
  const params = {
    appId: sessionStorage.getItem('appId'),
    sql,
    params: dynamic_list,
    encode: state.encode,
  }
  ElMessage({
    type: 'success',
    message: t('analysis.sqlquery.beingProcess') + '...',
  })
  moreDataDownload(params).then((res) => {
    if (res && res.code === 200) {
      if (typeof res.data === 'string' && res.data.indexOf('https://') === 0) {
        window.open(res.data)
      } else {
        ElMessage({
          type: 'error',
          message: t('analysis.sqlquery.exportFailed'),
        })
      }
    } else {
      ElMessage({
        type: 'error',
        message: res.message,
      })
    }
  })
}

/**
 * @description 复制sql语句
 */
const handleClip = (event) => {
  copyText(state.formData.sql, event)
}

/**
 * @description 收藏sql
 */
const handleCollect = () => {
  state.collectVisible = true
}

/**
 * @description 草稿保存
 */
const handleDraftSave = (callback) => {
  if (!state.formData.sql) {
    ElMessage({
      type: 'warning',
      message: t('analysis.sqlquery.sqlEmpty'),
    })
    return
  }
  const graphConfig = searchResultRef.value?.getGraphConfig()
  const qp = {
    sql: state.formData.sql,
    dynamic_list: state.dynamic_list,
  }
  callback(JSON.stringify({ graphConfig, qp }))
}

/**
 * @description 草稿填充
 */
const handleDraftPadding = async (data) => {
  try {
    const content = t('analysis.sqlquery.confirmFill')
    if (state.formData.sql) {
      await useTipModal({
        content,
        iconType: 3,
        needLoading: false,
        btnSwap: true,
        title: t('analysis.fill'),
      })
    }
    const draftJson = JSON.parse(data.draftData)
    state.formData.sql = draftJson.qp.sql
    state.dynamic_list = draftJson.qp.dynamic_list
    searchResultRef.value?.setGraphConfig(draftJson.graphConfig)
  } catch (e) {
    console.log(e)
  }
}

/**
 * @description sql校验
 */
const checkSql = (sql, type) => {
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
      message: `${type ? t('analysis.sqlquery.checkSelectSql') : t('analysis.sqlquery.checkSql')}`,
    })
    return flag
  }

  if (sql.slice(-1) === ';' || sql.slice(-1) === '；') {
    flag = false
    ElMessage({
      type: 'warning',
      message: `${type ? t('analysis.sqlquery.checkSelectSqlSemicolon') : t('analysis.sqlquery.checkSqlSemicolon')}`,
    })
    return flag
  }
  return true
}

/**
 * @description 动态参数值校验
 */
const checkDynamic = () => {
  let flag = true
  for (const item of state.dynamic_list) {
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
 * @description 添加收藏
 */
const getCollectName = (name) => {
  const sql = state.formData.sql
  if (!checkSql(sql) || !checkDynamic()) {
    return
  }
  const dynamic_list = []
  state.dynamic_list.forEach((item) => {
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

  const params = {
    name: name,
    content: state.formData.sql,
    params: dynamic_list,
  }
  getBookmarkAdd(params).then((res) => {
    if (res && res.code === 200) {
      ElMessage({
        message: t('common.favoriteSuccess'),
        type: 'success',
      })
      if (state.activeName === 'collect') {
        collectTableRef.value.getCollectList()
      }
    }
  })
}

/**
 * @description 异步查询弹框
 */
const handleAsyncSearch = () => {
  state.asyncVisible = true
}

/**
 * @description 创建异步查询
 */
const getAsyncName = (name) => {
  const sql = state.formData.sql
  if (!checkSql(sql) || !checkDynamic()) {
    return
  }
  const list = state.dynamic_list
  const dynamic_list = []
  list.forEach((item) => {
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
  let queryName = name
  if (!queryName) {
    queryName = dayjs().format('YYYY-MM-DD HH:mm:ss')
  }
  const params = {
    name: queryName,
    appId: sessionStorage.getItem('appId'),
    sql,
    params: dynamic_list,
    encode: state.encode,
  }
  addAsyncQuery(params).then((res) => {
    if (res && res.code === 200) {
      ElMessage({
        message: t('analysis.sqlquery.asyncSuccessfully'),
        type: 'success',
      })
      state.activeName = 'query'
      asyncSearchTableRef.value.getAsyncSearchList()
    }
  })
}

/**
 * @description 计算
 */
const handleCalculate = (type) => {
  recordBehavior({
    moduleName: '分析',
    submoduleName: 'SQL查询',
    operate: '计算',
  })
  let sql = state.formData.sql
  let selectSql = ''
  try {
    selectSql = sqlqueryAceEditorRef.value
      .getVAceEditorEle()
      ._editor.session.getTextRange(
        sqlqueryAceEditorRef.value
          .getVAceEditorEle()
          ._editor.getSelectionRange()
      )
  } catch (error) {
    console.log(error)
  }
  if (type === 'select' || selectSql) {
    // 选中sql计算
    if (state.searchResultTabs.length >= 19) {
      ElMessage.warning(t('analysis.sqlquery.resultPagesMax'))
      return
    }
    sql = selectSql
    if (!checkSql(sql, type) || !checkDynamic()) {
      return
    }
    const key = !state.searchResultTabs.length
      ? 2
      : Math.max(...state.searchResultTabs.map((e) => e.key)) + 1
    state.searchResultTabs.push({
      sql,
      dynamic_list: state.dynamic_list,
      key,
    })
    state.activeName = 'result'
    state.searchResultActiveName = `custom${key}`
    nextTick(() => {
      searchResultTabsRef.value[
        state.searchResultTabs.length - 1
      ].handleCalculate(sql, state.dynamic_list, 'calculate')
    })
  } else {
    if (!checkSql(sql) || !checkDynamic()) {
      return
    }
    state.activeName = 'result'
    state.searchResultActiveName = 'initResult'
    searchResultRef.value?.handleCalculate(sql, state.dynamic_list, 'calculate')
  }
}

/**
 * @description 自定义SQL查询结果删除
 */
const handleRemoveCustomRes = (index, key) => {
  state.searchResultTabs.splice(index, 1)
  const checkIdx = Number(state.searchResultActiveName.replace('custom', ''))
  if (checkIdx === key) {
    state.searchResultActiveName = 'initResult'
  }
}

const handleLoading = (loading) => {
  state.loading = loading
}

/**
 * @description 替换sql语句中对应的模板
 */
const replaceTemplate = (oldName, newName) => {
  state.formData.sql = state.formData.sql.replaceAll(oldName, newName)
}
</script>

<template>
  <AnalysisLayout
    :title="$t('analysis.sqlquery.sqlQuery')"
    :title-tip="$t('analysis.sqlquery.sqlQueryTips')"
    :left="false"
    :reportType="state.reportType"
    :reportInfo="state.detailInfo"
    @reportDetail="reportDetail">
    <template #bt>
      <el-button @click="handleExample">
        <svg-icon name="example" class="fz18 mr3"></svg-icon>
        {{ $t('common.example') }}
      </el-button>
      <el-tooltip
        :content="
          state.put
            ? $t('analysis.sqlquery.collapseSQL')
            : $t('analysis.sqlquery.expandSQL')
        ">
        <el-button @click="handlePut">
          <svg-icon
            name="show"
            class="fz18"
            :class="{ 'sql-put': !state.put }"></svg-icon>
        </el-button>
      </el-tooltip>
    </template>
    <template #rb>
      <div>
        <!-- sql分析组件 -->
        <div v-loading="state.loading">
          <AceEditor
            type="3"
            v-model="state.formData.sql"
            toolbar
            :sql-show="state.put"
            minLines="15"
            ref="sqlqueryAceEditorRef">
            <template #toolbar>
              <div class="w100-percentage">
                <div class="dynamic-param">
                  <div class="flex-center">
                    <div class="mr20">
                      {{ $t('analysis.sqlquery.parameterTip') }}
                    </div>
                    <div
                      class="flex-center"
                      v-if="state.dynamic_list.length >= 5">
                      <div class="mr3">
                        <el-checkbox v-model="state.checkTwo"></el-checkbox>
                      </div>
                      <div>
                        {{ $t('analysis.sqlquery.doubleColumnDisplay') }}
                      </div>
                    </div>
                  </div>
                  <div v-if="state.opt === 'copy'" class="flex-center mt20">
                    <div class="flex-center mr20">
                      <div class="mr10">
                        <el-checkbox
                          v-model="state.checkAll"
                          :indeterminate="state.isIndeterminate"
                          @change="handleCheckAllChange"></el-checkbox>
                      </div>
                      {{ $t('common.selectAll') }}
                    </div>
                    <div>
                      {{ $t('common.selected')
                      }}<span class="check-param-number">{{
                        state.dynamic_list.filter((item) => item.check).length
                      }}</span>
                      {{ $t('common.pcs') }}
                    </div>
                  </div>
                  <div v-show="state.put" class="mt20">
                    <draggable
                      v-model="state.dynamic_list"
                      force-fallback="true"
                      :group="{ name: 'rules', pull: false, put: false }"
                      :animation="500"
                      handle=".dynamic-param-drag"
                      fallback-tolerance="10"
                      item-key="id"
                      :component-data="{
                        name: 'fade',
                        type: 'transtion-group',
                      }">
                      <template #item="{ index }">
                        <DynamicParams
                          v-model="state.dynamic_list[index]"
                          v-model:list="state.dynamic_list"
                          v-model:checkAll="state.checkAll"
                          v-model:indeterminate="state.indeterminate"
                          v-model:checkTwo="state.checkTwo"
                          :opt="state.opt"
                          :index="index"
                          @replaceTemplate="replaceTemplate"></DynamicParams>
                      </template>
                    </draggable>
                  </div>
                </div>
                <div class="sqlquery-toolbar">
                  <div>
                    <div v-if="state.opt === 'copy'" class="flex-center gap14">
                      <el-button
                        type="primary"
                        class="m0"
                        :disabled="!state.dynamic_list.length"
                        @click="handleCopyParam($event)">
                        {{ $t('analysis.sqlquery.copyParameters') }}
                      </el-button>
                      <el-button class="m0 skip" @click="handleCancelParam">
                        {{ $t('btn.cancel') }}
                      </el-button>
                    </div>
                    <!-- 动态参数 -->
                    <DynamicParamButton
                      v-else
                      @getSelectParam="handleAddParam"
                      @paste="handlePaste"></DynamicParamButton>
                  </div>
                  <div class="flex-center">
                    <div class="flex-center gap14 mr10">
                      <!-- 编码转换 -->
                      <EncodeDropdown v-model="state.encode"></EncodeDropdown>
                      <!-- 导出更多 -->
                      <el-button
                        class="p0 m0 nd-operate-btn-active fz28 svg86919d"
                        text
                        :disabled="!state.formData.sql"
                        @click="handleExportMore">
                        <Tooltip>
                          <SvgIcon class="fz16" name="export" />
                          <template #content>{{
                            $t('analysis.sqlquery.downloadTips')
                          }}</template>
                        </Tooltip>
                      </el-button>
                      <!-- 帮助 -->
                      <el-link
                        class="fz28 nd-operate-btn-active"
                        :underline="false"
                        href="https://help.aliyun.com/zh/hologres/user-guide/developer-guide/"
                        target="_blank">
                        <Tooltip>
                          <SvgIcon class="fz16" name="help3" />
                          <template #content>{{ $t('common.help') }}</template>
                        </Tooltip>
                      </el-link>
                      <!-- 清除 -->
                      <el-button
                        class="p0 m0 nd-operate-btn-active fz28 svg86919d"
                        text
                        :disabled="!state.formData.sql"
                        @click="state.formData.sql = ''">
                        <Tooltip>
                          <SvgIcon class="fz16" name="delete1" />
                          <template #content>{{ $t('common.clear') }}</template>
                        </Tooltip>
                      </el-button>
                      <!-- 格式化 -->
                      <el-button
                        class="p0 m0 nd-operate-btn-active fz28 svg86919d"
                        text
                        :disabled="!state.formData.sql"
                        @click="handleSqlFormat">
                        <Tooltip>
                          <SvgIcon class="fz16" name="format1" />
                          <template #content>
                            {{ $t('common.format') }}
                          </template>
                        </Tooltip>
                      </el-button>
                      <!-- 复制语句 -->
                      <Tooltip>
                        <el-button
                          class="p0 m0 nd-operate-btn-active fz28 copy-param-button svg86919d"
                          text
                          :disabled="!state.formData.sql"
                          @click="handleClip($event)">
                          <SvgIcon class="fz18" name="copy2" />
                        </el-button>
                        <template #content>
                          {{ $t('common.copySQL') }}
                        </template>
                      </Tooltip>
                      <!-- 收藏 -->
                      <el-button
                        class="m0 skip"
                        :disabled="!state.formData.sql"
                        @click="handleCollect">
                        <Tooltip>
                          {{ $t('common.favorite') }}
                          <template #content>
                            {{ $t('analysis.sqlquery.collectionTips') }}
                          </template>
                        </Tooltip>
                      </el-button>
                    </div>
                    <div class="flex-center gap10">
                      <!-- 草稿 -->
                      <AnalysisDraft
                        :reportType="state.reportType"
                        @save="handleDraftSave"
                        @padding="handleDraftPadding" />
                      <!-- 异步查询 -->
                      <Auth :value="authEnum[7].asyncQuery">
                        <el-button
                          class="m0 skip"
                          :disabled="!state.formData.sql"
                          @click="handleAsyncSearch">
                          <i class="ml3 mr5">{{
                            $t('analysis.sqlquery.asynQuery')
                          }}</i>
                          <Tooltip>
                            <SvgIcon class="fz14" name="help2" />
                            <template #content>
                              {{ $t('analysis.sqlquery.asynQueryTips') }}
                            </template>
                          </Tooltip>
                        </el-button>
                      </Auth>
                      <!-- 计算 -->
                      <el-button
                        type="primary"
                        class="m0"
                        :disabled="!state.formData.sql"
                        @click="handleCalculate">
                        {{ $t('analysis.sqlquery.calculation') }}
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </AceEditor>
        </div>
        <div class="sqlquery-table w100-percentage h100-percentage">
          <el-tabs
            v-model="state.activeName"
            @tab-change="handleTabChange"
            type="border-card"
            class="sqlquery-table-tabs">
            <el-tab-pane
              name="table"
              :label="$t('analysis.sqlquery.tableStructure')">
              <TableStructure
                :isSql="!!state.formData.sql"
                @parseTable="getParseTableSql" />
            </el-tab-pane>
            <el-tab-pane
              :label="$t('analysis.sqlquery.queryResult')"
              name="result">
              <el-tabs
                v-model="state.searchResultActiveName"
                class="result-tabs">
                <el-tab-pane
                  name="initResult"
                  :label="$t('analysis.sqlquery.result')">
                  <searchResultTable
                    ref="searchResultRef"
                    :sql="state.formData.sql"
                    :list="state.dynamic_list"
                    @reportDetail="reportDetail"
                    @loading="handleLoading"></searchResultTable>
                </el-tab-pane>
                <!-- 多页签sql查询结果集 -->
                <el-tab-pane
                  v-for="(item, index) in state.searchResultTabs"
                  :key="index"
                  :name="`custom${item.key}`"
                  editable>
                  <template #label>
                    <DetailSqlDropdown
                      :title="$t('analysis.sqlquery.viewStatements')"
                      :btnFlag="false"
                      :sql="item.sql"
                      trigger="hover"
                      type="copy">
                      <template #default>
                        <div class="tabs-title">
                          {{ `${$t('analysis.sqlquery.result')}${item.key}` }}
                        </div>
                      </template>
                    </DetailSqlDropdown>
                    <el-icon
                      class="ml5 tabs-item-delete"
                      @click.stop="handleRemoveCustomRes(index, item.key)"
                      ><CircleClose
                    /></el-icon>
                  </template>
                  <searchResultTable
                    :ref="(el) => (searchResultTabsRef[index] = el)"
                    :sql="item.sql"
                    :list="item.dynamic_list"
                    :updateFlag="false"
                    @loading="handleLoading"></searchResultTable>
                </el-tab-pane>
              </el-tabs>
            </el-tab-pane>
            <el-tab-pane
              :label="$t('analysis.sqlquery.searchHistory')"
              name="history">
              <historyTable
                :reportInfo="state.detailInfo"
                ref="historyTableRef"
                :isSql="!!state.formData.sql"
                @sqlSettings="getSqlSettings"
                @historyQuery="getHistoryQuery"></historyTable>
            </el-tab-pane>
            <el-tab-pane
              :label="$t('analysis.sqlquery.statementsCollection')"
              name="collect">
              <collectTable
                ref="collectTableRef"
                :isSql="!!state.formData.sql"
                @sqlSettings="getSqlSettings"></collectTable>
            </el-tab-pane>
            <el-tab-pane
              :label="$t('analysis.sqlquery.asynQuery')"
              name="query">
              <asyncSearchTable
                :reportInfo="state.detailInfo"
                ref="asyncSearchTableRef"
                :isSql="!!state.formData.sql"
                @sqlSettings="getSqlSettings"></asyncSearchTable>
            </el-tab-pane>
          </el-tabs>
        </div>
        <InputDialog
          v-model="state.collectVisible"
          @getName="getCollectName"></InputDialog>
        <InputDialog
          addAsync
          v-model="state.asyncVisible"
          :title="$t('analysis.sqlquery.newAsyncQuery')"
          :inputName="$t('analysis.sqlquery.asyncQueryName')"
          :required="false"
          @getName="getAsyncName"></InputDialog>
        <ExampleDrawer ref="exampleDrawerRef"></ExampleDrawer>
      </div>
    </template>
  </AnalysisLayout>
</template>

<style lang="scss" scoped>
.sql-put {
  transform: rotate(180deg);
}
.dynamic-param {
  border-bottom: 1px solid var(--eas-border-color);
  padding: 0 20px 10px;
  margin-bottom: 10px;
}
.sqlquery-toolbar {
  flex: 1;
  display: flex;
  align-content: center;
  justify-content: space-between;
  padding: 0 20px;
}
.gap14 {
  gap: 14px;
}
.sqlquery-table {
  &::before {
    content: '';
    display: block;
    width: 100%;
    height: 20px;
    background: var(--eas-color-primary-light-1);
  }
  &-tabs {
    border: none;
    & > :deep(.el-tabs__header) {
      background: var(--eas-hover-color-1);
      border: none;
      .el-tabs__item {
        color: var(--eas-text-color-primary);
        border: none;
      }
      .is-active {
        color: var(--eas-color-primary) !important;
        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          display: block;
          width: 100%;
          height: 4px;
          background: var(--eas-color-primary);
        }
      }
    }
    & > :deep(.el-tabs__content) {
      padding: 0;
    }
    .result-tabs {
      :deep(.el-tabs__header) {
        .el-tabs__nav-wrap {
          padding: 0 20px;
          .el-tabs__active-bar {
            display: none;
          }
          .el-tabs__item {
            color: var(--eas-text-color-primary);
            .tabs-item-delete {
              opacity: 0;
              &:hover {
                color: var(--eas-color-primary-hover);
              }
            }
            &:hover {
              .tabs-item-delete {
                opacity: 1;
              }
            }
          }
          .is-active:not([id*='tab-custom']) {
            color: var(--eas-color-primary) !important;
            &::before {
              content: '';
              position: absolute;
              bottom: 0;
              left: 0;
              display: block;
              width: 28px;
              height: 4px;
              border-radius: 2px;
              background: var(--eas-color-primary);
            }
          }
        }
      }
    }
  }
}

.check-param-number {
  color: var(--eas-color-primary);
}
.color-CBD0D6 {
  color: var(--eas-text-color-light-1);
}
.color-86919D {
  color: var(--eas-text-color-light);
}
.copy-param-button {
  svg {
    pointer-events: none;
  }
}
</style>
<style lang="scss">
.result-tabs {
  .is-active {
    .el-dropdown {
      color: var(--eas-color-primary);
      &::before {
        content: '';
        position: absolute;
        bottom: -12px;
        left: 0;
        display: block;
        width: 100%;
        height: 4px;
        border-radius: 2px;
        background: var(--eas-color-primary);
      }
    }
  }
}
</style>
