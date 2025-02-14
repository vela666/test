<script setup>
import { ref, reactive, watch } from 'vue'
import { debounce, cloneDeep } from 'lodash-es'
import {
  getAsyncQueryList,
  getCancelAsyncQuery,
  getQueryResultDownload,
} from '@/api/modules/analysis/sql'
import useUserStore from '@/store/modules/user'
import DetailSqlDropdown from './components/DetailSqlDropdown.vue'
import { useTipModal } from '@/components/TipDialog'
import authEnum from '@/views/analysis/enum.js'
import { recordBehavior } from '@/utils/record-behavior.js'
import { reportTypeListMap } from '@/enumeration/report.js'
import { t } from '@/locales/i18n'

const userStore = useUserStore()

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
  runningStatus: null,
  statusArr: [
    t('analysis.sqlquery.awaitingExecution'),
    t('analysis.sqlquery.inExecution'),
    t('analysis.sqlquery.executionSuccessful'),
    t('analysis.sqlquery.executionFailed'),
    t('analysis.sqlquery.cancelled'),
  ],
  statusClass: [
    'info-color',
    'primary-color',
    'success-color',
    'danger-color',
    'warn-color',
  ],
  statusList: [
    { type: 0, label: t('analysis.sqlquery.awaitingExecution') },
    { type: 1, label: t('analysis.sqlquery.inExecution') },
    { type: 2, label: t('analysis.sqlquery.executionSuccessful') },
    { type: 3, label: t('analysis.sqlquery.executionFailed') },
    { type: 4, label: t('analysis.sqlquery.cancelled') },
  ],
  id: null,
  loading: false,
})

const emit = defineEmits(['sqlSettings'])

watch(
  () => state.runningStatus,
  (val) => {
    handleSearch()
  }
)

/**
 * @description 查询异步查询列表
 */
const getAsyncSearchList = debounce((type) => {
  state.loading = true
  if (type === 'init') {
    state.searchContent = ''
  }
  getAsyncQueryList({ searchContent: state.searchContent })
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
 * @description 获取分页数据
 */
const handleGetList = ({ page, limit }) => {
  state.pageNum = page
  const data = state.dataList.filter((item) => {
    let stateFlag = true
    if (
      state.runningStatus !== null &&
      state.runningStatus !== undefined &&
      state.runningStatus !== '' &&
      item.status !== state.runningStatus
    ) {
      stateFlag = false
    }
    return stateFlag
  })
  state.dataTable = data.slice((page - 1) * limit, page * limit)
  state.total = data.length
}

const getList = () => {
  handleGetList({ page: state.pageNum, limit: state.pageSize })
}

const handleSearch = () => {
  handleGetList({ page: 1, limit: state.pageSize })
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
      operate: '使用异步查询填充',
    })
    const sql = row.sql || row.targetSql
    const list = cloneDeep(JSON.parse(row.params)) || []
    emit('sqlSettings', sql, list)
    if (callback) {
      callback()
    }
  } catch (e) {
    console.log(e)
  }
}

const dropdownAsyncCancel = ref([])

/**
 * @description 打开删除弹框
 */
const handleCancel = (id, index) => {
  state.id = id
  dropdownAsyncCancel.value[index].handleOpen()
}

/**
 * @description 取消删除弹框
 */
const handleCancle = (index) => {
  dropdownAsyncCancel.value[index].handleClose()
}

/**
 * @description 取消异步查询
 */
const handleSubmit = (index) => {
  state.loading = true
  getCancelAsyncQuery({ id: state.id })
    .then((res) => {
      if (res && res.code === 200) {
        state.id = null
        getAsyncSearchList()
        handleCancle(index)
      }
    })
    .finally(() => {
      state.loading = false
    })
}

/**
 * @description 导出
 */
const handleDownload = (queryId) => {
  recordBehavior({
    moduleName: '分析',
    submoduleName: 'SQL查询',
    operate: '导出异步查询',
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

defineExpose({ getAsyncSearchList })

defineOptions({
  name: 'AsyncSearchTable',
})
</script>
<template>
  <div v-loading="state.loading" class="sql-async-search">
    <div class="flex-center flex-between mb20">
      <div>
        <CommonInput
          v-model="state.searchContent"
          :desc="$t('analysis.sqlquery.searchAsyncName')"
          class="w220 mr10"
          @input="getAsyncSearchList" />
        <span>
          {{ $t('analysis.sqlquery.totalPageAsync', [state.total]) }}
        </span>
      </div>
      <!-- 刷新 -->
      <el-button class="skip ml12" @click="getAsyncSearchList">
        <SvgIcon class="fz16 mr3" name="refresh1" />
        <span class="fz14">{{ $t('btn.refresh') }}</span>
      </el-button>
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
      <el-table-column :label="$t('analysis.sqlquery.asyncQueryName')" prop="name">
        <template #default="scope">
          <div v-showTips>{{ scope.row.name }}</div>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('common.createBy')"
        prop="createByName"
        width="200" />
      <el-table-column
        :label="$t('common.createTime')"
        prop="createTime"
        width="200" />
      <el-table-column :label="$t('analysis.sqlquery.queryStatement')" width="200">
        <template #default="scope">
          <DetailSqlDropdown
            :title="$t('analysis.sqlquery.queryStatement')"
            :btnName="$t('analysis.sqlquery.detail')"
            :sql="scope.row.targetSql"
            :row="scope.row"
            @handleFill="handleDropdownFill"></DetailSqlDropdown>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('analysis.sqlquery.runningStatus')"
        prop="status"
        width="200">
        <template #header>
          <FilterDropdown
            v-model="state.runningStatus"
            :list="state.statusList"
            :name="$t('analysis.sqlquery.runningStatus')" />
        </template>
        <template #default="scope">
          <div class="flex-center">
            <div
              :class="[
                'async-list-status-tip',
                'mr5',
                state.statusClass[scope.row.status],
              ]" />
            <div>{{ state.statusArr[scope.row.status] }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.operate')" width="200">
        <template #default="scope">
          <el-button
            class="is-text"
            type="primary"
            @click="handleFill(scope.row)">
            {{ $t('analysis.fill') }}
          </el-button>
          <CommonDropdown
            :ref="(el) => (dropdownAsyncCancel[scope.$index] = el)"
            width="220px"
            v-if="
              scope.row.status === 0 &&
              (userStore.userInfo.type === 2 ||
                scope.row.createBy === userStore.userInfo.userId)
            ">
            <template #content>
              <el-button
                class="ml12"
                type="text"
                @click="handleCancel(scope.row.id, scope.$index)">
                {{ $t('btn.cancel') }}
              </el-button>
            </template>
            <template #default>
              <div class="flex-center fz14 mt20 ml12 mb20">
                <SvgIcon name="warning1" class="cff7d00 mr5 fz18" />
                <span>{{ $t('analysis.sqlquery.confirmAsyncQuery') }}</span>
              </div>
              <div class="ml10 mr10 mb10 text-align-right">
                <el-button
                  text
                  class="skip mr10"
                  @click="handleCancle(scope.$index)">
                  {{ $t('btn.cancel') }}
                </el-button>
                <el-button
                  type="primary"
                  class="m0"
                  @click="handleSubmit(scope.$index)">
                  {{ $t('btn.confirm') }}
                </el-button>
              </div>
            </template>
          </CommonDropdown>
          <el-button
            v-if="authEnum[7].export && scope.row.status === 2"
            class="ml12 is-text"
            type="primary"
            @click="handleDownload(scope.row.queryId)">
            {{ $t('common.download') }}
          </el-button>
          <el-dropdown
            v-if="[3, 4].includes(scope.row.status)"
            trigger="click"
            placement="bottom-end">
            <el-button class="ml12 is-text" type="primary">
              {{ $t('analysis.sqlquery.detail') }}
            </el-button>
            <template #dropdown>
              <div class="async-query-popover">
                <div class="show-detail-title">
                  {{ $t('analysis.sqlquery.detail') }}
                </div>
                <div class="show-detail-content">
                  {{ scope.row.failureReason }}
                </div>
              </div>
            </template>
          </el-dropdown>
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
.sql-async-search {
  padding: 20px;
  .flex1 {
    flex: 1;
  }
  .async-list-status-tip {
    width: 8px;
    height: 8px;
    border-radius: 4px;
  }
  .info-color {
    background: var(--eas-text-color-light-1);
  }
  .primary-color {
    background: var(--eas-color-primary);
  }
  .success-color {
    background: var(--eas-color-success);
  }
  .danger-color {
    background: var(--eas-color-error);
  }
  .warn-color {
    background: var(--eas-color-warning);
  }
  .report-view-footer {
    width: 100%;
    height: 64px;
  }
}
.async-query-popover {
  width: 550px;
  max-height: 500px;
  font-size: 14px;
  padding: 0 32px 20px 32px;
  .show-detail-title {
    height: 62px;
    line-height: 62px;
    font-weight: bold;
  }
  .show-detail-content {
    width: 100%;
    max-height: 366px;
    padding: 10px 20px;
    background-color: var(--eas-hover-color);
    overflow-y: auto;
  }
}
</style>
