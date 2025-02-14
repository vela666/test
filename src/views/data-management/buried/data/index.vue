<template>
  <CommonLayout>
    <template #hl>
      <CommonInput
        clearable
        :placeholder="$t('dataManagement.buried.searchReportAndDisplay')"
        v-model="query.searchText"
        class="w240"
        @input="handleSearch" />
      <el-date-picker
        v-model="query.date"
        type="daterange"
        :range-separator="$t('common.to')"
        style="width: 240px"
        :clearable="false"
        :disabled-date="(time) => time.getTime() > Date.now()"
        value-format="YYYY-MM-DD"
        @change="getList"
        :editable="false" />
      <el-button type="primary" @click="handleReset">{{
        $t('btn.reset')
      }}</el-button>
    </template>
    <template #hr>
      <span class="c545e6e">
        {{
          $t('dataManagement.buried.storedIntervalData', [
            state.countInfo.count.toLocaleString(),
            state.countInfo.errorCount.toLocaleString(),
          ])
        }}
        <!-- 区间数据：已入库 {{ state.countInfo.count }} 条；错误
        {{ state.countInfo.errorCount }} 条 -->
      </span>
    </template>
    <el-table
      class="nd-table-custom"
      :data="state.pageData"
      border
      v-loading="state.loading"
      @sort-change="handleSortChange">
      <el-table-column
        v-for="item in columns"
        :key="item.prop"
        :label="item.label"
        :prop="item.prop"
        show-overflow-tooltip
        v-bind="{ ...item }">
        <template #header>
          <FilterDropdown
            v-if="item.prop === 'enable'"
            v-model="query.enable"
            :list="state.statusEnum"
            :name="item.label"
            @change="getList" />
          <template v-else-if="item.prop === 'count'">
            <span class="mr5"> {{ item.label }} </span>
            <el-tooltip :content="$t('dataManagement.buried.updateTooltip')">
              <svg-icon name="help2" class="c86919d" />
            </el-tooltip>
          </template>
          <template v-else>{{ item.label }}</template>
        </template>
        <template #default="{ row }">
          <el-switch
            v-if="item.prop === 'enable'"
            :disabled="!row.isOperated"
            :active-value="1"
            :inactive-value="2"
            v-model="row.status"
            @change="handleSwitch(row)" />
          <span v-else-if="item.prop === 'operation' || item.prop === 'count'">
            <el-button text type="primary" @click="viewDetails(row)">
              {{
                item.prop === 'operation'
                  ? $t('dataManagement.buried.viewDetails')
                  : row[item.prop]?.toLocaleString()
              }}
            </el-button>
          </span>
          <template v-else>{{ row[item.prop]?.toLocaleString() }}</template>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <Pagination
        v-model:limit="pageInfo.pageSize"
        v-model:page="pageInfo.pageNum"
        :total="pageInfo.total"
        @getData="getList" />
    </template>
    <TipDialog
      iconType="3"
      btnSwap
      v-model="state.tipDialog"
      :title="$t('dataManagement.buried.disableEvents')"
      @submit="handleSave"
      @close="handleCancel">
      {{
        $t('dataManagement.buried.confirmDisableEvent', [
          state.rowDetail.eventName,
        ])
      }}
    </TipDialog>
  </CommonLayout>
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { getBuryData, changeEventEnable } from '@/api/modules/buried'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { debounce } from 'lodash-es'
import { recordBehavior } from '@/utils/record-behavior.js'
import { t } from '@/locales/i18n'

recordBehavior({
  moduleName: '数据管理',
  submoduleName: '埋点数据',
  operate: '进入页面',
})

const router = useRouter()
const state = reactive({
  pageData: [],
  loading: false,
  status: '',
  statusEnum: [
    {
      type: 1,
      label: t('btn.enable'),
    },
    {
      type: 2,
      label: t('btn.disable'),
    },
  ],
  tipDialog: false,
  rowDetail: {},
  countInfo: {
    count: 0,
    errorCount: 0,
  },
  orderBy: '',
})

const initQuery = () => ({
  searchText: '',
  date: [dayjs().format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
  enable: 0,
})

const query = reactive(initQuery())

const pageInfo = reactive({
  pageNum: 1,
  pageSize: 20,
  total: 0,
})

const columns = [
  {
    label: t('dataManagement.buried.reportName'),
    prop: 'eventName',
  },
  {
    label: t('dataManagement.displayName'),
    prop: 'eventZhName',
  },
  {
    label: t('dataManagement.buried.stored'),
    prop: 'count',
    sortable: 'custom',
  },
  {
    label: t('dataManagement.buried.error'),
    prop: 'errorCount',
    sortable: 'custom',
  },
  {
    label: t('dataManagement.buried.enableDisable'),
    prop: 'enable',
  },
  {
    label: t('common.operate'),
    prop: 'operation',
  },
]

/**
 * @description: 请求列表
 * @return {*}
 */
const getList = (type) => {
  const reg = /\s/g
  if (
    type &&
    reg.test(query.searchText) &&
    query.searchText.replace(/\s/g, '') === ''
  )
    return
  const params = {
    startDate: query.date[0],
    endDate: query.date[1],
    page: pageInfo.pageNum,
    size: pageInfo.pageSize,
    searchText: query.searchText,
    enable: !query.enable ? 0 : query.enable,
    orderBy: state.orderBy,
  }
  state.loading = true
  getBuryData(params)
    .then((res) => {
      const { list, other, page } = res.data
      state.pageData = list.map((item) => {
        item.status = item.enable
        return item
      })
      state.countInfo = other
      pageInfo.total = page.totalCount
    })
    .finally((_) => {
      state.loading = false
    })
}

const handleSearch = debounce(() => getList('search'), 300)

onMounted(() => {
  getList()
})

/**
 * @description: 重置
 * @return {*}
 */
const handleReset = () => {
  Object.assign(query, initQuery())
  getList()
}

/**
 * @description: 启用/禁用
 * @return {*}
 */
const handleSwitch = (row) => {
  state.tipDialog = row.status === 2
  state.rowDetail = row

  if (!state.tipDialog) handleSave()
}

/**
 * @description: 取消禁用
 * @return {*}
 */
const handleCancel = () => {
  const val = state.pageData.find((item) => item.id === state.rowDetail.id)
  if (val) val.status = val.enable
}

/**
 * @description: 启用/禁用
 * @return {*}
 */
const handleSave = () => {
  const params = {
    enable: state.rowDetail.status,
    eventName: state.rowDetail.eventName,
  }
  changeEventEnable(params).then(() => {
    const message =
      params.enable === 1
        ? t('common.successfullyEnabled')
        : t('dataManagement.disabledSuccessfully')
    ElMessage.success(message)
    state.tipDialog = false
    getList()
  })
}

/**
 * @description: 表头排序
 * @return {*}
 */
const handleSortChange = (row) => {
  const order = row.order === 'descending' ? 'desc' : 'asc'
  state.orderBy = `${row.prop}#${order}`
  getList()
}

const viewDetails = (row) => {
  router.push({
    path: '/data-management/buried/data-detail',
    query: {
      eventName: row.eventName,
      startDate: query.date[0],
      endDate: query.date[1],
      count: row.count,
      errorCount: row.errorCount,
    },
  })
}
</script>
