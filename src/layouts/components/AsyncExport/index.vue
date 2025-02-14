<script setup>
import { ref, reactive, computed } from 'vue'
import {
  getAsyncExportTask,
  downloadAsyncExportTask,
} from '@/api/modules/common'
import { isNumber, isString } from 'lodash-es'
import { Warning } from '@element-plus/icons-vue'
import axios from 'axios'
import { recordBehavior } from '@/utils/record-behavior.js'
import { t } from '@/locales/i18n'

const state = reactive({
  taskName: '',
  drawerShow: false,
  loading: false,
  taskList: [],
  runningStatus: '',
})

const statusList = [
  { type: 0, label: t('common.success') },
  { type: 1, label: t('common.processing') },
  { type: 2, label: t('common.failure') },
]

const statusArr = [
  t('common.success'),
  t('common.processing'),
  t('common.failure'),
]
const statusClass = ['success-status', 'primary-status', 'fail-status']

// 获取异步任务列表
const getAsyncTaskList = async () => {
  if (!sessionStorage.getItem('appId')) {
    return
  }
  state.loading = true
  state.taskList.length = 0
  try {
    const res = await getAsyncExportTask()
    if (res.code === 200 && Array.isArray(res.data)) {
      state.taskList = res.data
    }
    state.loading = false
  } catch (error) {
    state.loading = false
    console.log(error)
  }
}

const showTableData = computed(() =>
  state.taskList?.filter(
    (el) =>
      el?.taskName?.toLowerCase?.().includes(state.taskName?.toLowerCase?.()) &&
      (state.runningStatus === '' || el.status === state.runningStatus)
  )
)

const open = () => {
  state.drawerShow = true
  recordBehavior({
    moduleName: '通用',
    submoduleName: '异步导出',
    operate: '查看异步任务导出记录',
  })
  getAsyncTaskList()
}

const exportData = (data) => {
  window.open(
    `${axios.defaults.baseURL}/download/task/file/${data?.appId}/${data.taskId}`
  )
}

defineExpose({ open })
defineOptions({
  name: 'AsyncExport',
})
</script>

<template>
  <CommonDrawer
    v-model="state.drawerShow"
    :showBtn="false"
    :needFooter="false"
    :loading="state.loading">
    <template #title>
      <div>
        <span>{{ $t('layouts.async.taskExportRecord') }}</span>
        <span class="ml10 fz14 c545e6e fwt400">
          {{ $t('layouts.async.viewTaskExportRecord') }}
        </span>
      </div>
    </template>
    <div class="async-export-container">
      <CommonInput
        v-model="state.taskName"
        style="width: 220px; margin-bottom: 25px"
        :desc="$t('layouts.async.searchTaskName')" />
      <el-table
        class="nd-table-custom"
        border
        style="height: calc(100% - 57px)"
        show-overflow-tooltip
        :data="showTableData">
        <el-table-column
          prop="taskName"
          :label="$t('layouts.async.taskName')"
          width="300"
          sortable />
        <el-table-column
          prop="createTime"
          :label="$t('common.createTime')"
          width="167"
          sortable />
        <el-table-column
          prop="timeConsuming"
          :label="$t('analysis.sqlquery.timeConsumption')"
          width="108">
          <template #default="scope">
            {{
              scope.row.timeConsuming
                ? (scope.row.timeConsuming / 1000).toFixed(2)
                : scope.row.timeConsuming
            }}
            {{ $t('analysis.interval.seconds') }}
          </template>
        </el-table-column>
        <el-table-column prop="status" :label="$t('common.status')" width="109">
          <template #header>
            <FilterDropdown
              v-model="state.runningStatus"
              :list="statusList"
              :name="$t('common.status')" />
          </template>
          <template #default="scope">
            <div :class="statusClass[scope.row.status] || ''">
              {{ statusArr[scope.row.status] || '' }}
              <el-tooltip
                v-if="
                  scope.row.status === 2 &&
                  scope?.row?.errorMsg &&
                  isString(scope?.row?.errorMsg)
                "
                :content="scope.row.errorMsg"
                placement="top">
                <el-icon class="ml5"><Warning /></el-icon>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="operate" :label="$t('common.operate')">
          <template #default="scope">
            <el-button
              class="skip nobg"
              type="primary"
              :disabled="scope.row.status !== 0"
              text
              @click="exportData(scope.row)">
              {{ $t('layouts.async.download') }}
            </el-button>
            <template
              v-if="scope?.row?.status === 0 && isNumber(scope.row.dataSize)">
              {{ `(${(scope.row.dataSize / 1024).toFixed(2)}KB)` }}
            </template>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </CommonDrawer>
</template>

<style scoped lang="scss">
.fwt400 {
  font-weight: 400;
}
.async-export-container {
  height: 100%;
}
.el-button.nobg {
  &.is-text {
    &:not(.is-disabled) {
      &:hover,
      &:active,
      &:focus {
        background-color: transparent !important;
      }
    }
  }
}
</style>
