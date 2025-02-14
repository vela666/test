<script setup>
import { ref, reactive } from 'vue'
import {
  getQueryList,
  getQueryResultDownload,
} from '@/api/modules/analysis/sql'
import DetailSqlDropdown from './components/DetailSqlDropdown.vue'
import { debounce, cloneDeep } from 'lodash-es'
import { useTipModal } from '@/components/TipDialog'
import authEnum from '@/views/analysis/enum.js'
import { recordBehavior } from '@/utils/record-behavior.js'
import { t } from '@/locales/i18n'

const props = defineProps({
  isSql: {
    type: Boolean,
    default: false,
  },
  reportInfo: {
    type: Object,
    default: () => {},
  },
})

const state = reactive({
  searchContent: '',
  dataList: [],
  dataTable: [],
  pageNum: 1,
  pageSize: 10,
  total: 0,
  loading: false,
})

const emit = defineEmits(['sqlSettings', 'historyQuery'])

/**
 * @description 查询历史数据
 */
const getHistoryList = debounce((type) => {
  state.loading = true
  if (type === 'init') {
    state.searchContent = ''
  }

  getQueryList({ searchContent: state.searchContent })
    .then((res) => {
      if (res && res.code === 200) {
        state.dataList = res.data
        handleGetList({ page: 1, limit: state.pageSize })
      }
    })
    .finally(() => {
      state.loading = false
    })
}, 300)

/**
 * @description 分页数据赋值
 */
const handleGetList = ({ page, limit }) => {
  state.pageNum = page
  const data = state.dataList
  state.dataTable = data.slice((page - 1) * limit, page * limit)
  state.total = data.length
}

/**
 * @description 分页组件查询
 */
const getList = () => {
  handleGetList({ page: state.pageNum, limit: state.pageSize })
}

/**
 * @description 表格详情填充
 */
const handleDropdownFill = (row, callback) => {
  handleFill(row, callback)
}

/**
 * @description 填充
 */
const handleFill = async (row, callback) => {
  try {
    if (props.isSql) {
      const content = t('analysis.sqlquery.confirmFill')

      await useTipModal({
        content,
        iconType: 3,
        needLoading: false,
        btnSwap: true,
        title: t('analysis.fill'),
      })
    }
    recordBehavior({
      moduleName: '分析',
      submoduleName: 'SQL查询',
      operate: '使用查询历史填充',
    })
    const sql = row.originalQuery || row.query
    const list = cloneDeep(row.params) || []
    emit('sqlSettings', sql, list)
    if (callback) {
      callback()
    }
  } catch (e) {
    console.log(e)
  }
}

/**
 * @description 查看
 */
const handleView = async (row) => {
  try {
    if (props.isSql) {
      const content = t('analysis.sqlquery.confirmViewFill')
      await useTipModal({
        content,
        iconType: 3,
        needLoading: false,
        btnSwap: true,
        title: t('btn.view'),
      })
    }
    const sql = row.originalQuery || row.query
    const list = JSON.parse(JSON.stringify(row.params)) || []
    emit('sqlSettings', sql, list)
    emit('historyQuery', row.queryId)
  } catch (e) {
    console.log(e)
  }
}

/**
 * @description 导出
 */
const handleDownload = async (queryId) => {
  await recordBehavior({
    moduleName: '分析',
    submoduleName: 'SQL查询',
    operate: '导出查询历史',
    businessId: props.reportInfo?.businessId,
  })
  state.loading = true
  getQueryResultDownload({ queryId })
    .then((res) => {
      if (res && res.code === 200) {
        window.open(res.data)
      }
    })
    .finally(() => {
      state.loading = false
    })
}

defineExpose({ getHistoryList })

defineOptions({
  name: 'historyTable',
})
</script>
<template>
  <div v-loading="state.loading" class="sql-history">
    <div class="flex-center mb20">
      <CommonInput
        v-model="state.searchContent"
        :desc="$t('analysis.sqlquery.searchStatement')"
        class="flex1 mr10"
        @input="getHistoryList" />
      <span>
        {{ $t('analysis.sqlquery.totalPageHistory', [state.total]) }}
      </span>
    </div>
    <el-table :data="state.dataTable" class="nd-table-custom" border>
      <el-table-column
        type="index"
        :label="$t('common.orderNumber')"
        width="80">
        <template #default="scope">
          <span>{{
            scope.$index + 1 + (state.pageNum - 1) * state.pageSize
          }}</span>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('analysis.sqlquery.queryTime')"
        prop="queryStart" />
      <el-table-column
        :label="$t('analysis.sqlquery.queryTimeConsumption') + '(ms)'"
        prop="duration" />
      <el-table-column :label="$t('analysis.sqlquery.queryStatement')" prop="query">
        <template #default="scope">
          <div class="flex-center w350">
            <div class="ellipsis">{{ scope.row.query }}</div>
            <DetailSqlDropdown
              v-if="scope.row.query.length >= 50"
              :title="$t('analysis.sqlquery.viewStatements')"
              :btnName="$t('analysis.sqlquery.detail')"
              :sql="scope.row.query"
              :row="scope.row"
              @handleFill="handleDropdownFill"></DetailSqlDropdown>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.operate')">
        <template #default="scope">
          <el-button
            class="is-text"
            type="primary"
            @click="handleFill(scope.row)">
            {{ $t('analysis.fill') }}
          </el-button>
          <el-button
            class="is-text"
            type="primary"
            :disabled="scope.row.dataType === 1"
            @click="handleView(scope.row)">
            {{ $t('btn.view') }}
          </el-button>
          <Auth :value="authEnum[7].export">
            <el-button
              class="is-text"
              type="primary"
              @click="handleDownload(scope.row.queryId)"
              :disabled="!scope.row.showResultRows">
              {{ $t('common.download') }}
            </el-button>
          </Auth>
        </template>
      </el-table-column>
    </el-table>
    <div class="report-view-footer flex-center flex-justify-content-end">
      <Pagination
        v-model:limit="state.pageSize"
        v-model:page="state.pageNum"
        :total="state.total"
        @getData="getList" />
    </div>
  </div>
</template>
<style lang="scss" scoped>
.sql-history {
  padding: 20px;
  .flex1 {
    flex: 1;
  }
  .report-view-footer {
    width: 100%;
    height: 64px;
  }
}
</style>
