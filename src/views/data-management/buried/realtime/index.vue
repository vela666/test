<template>
  <CommonLayout>
    <template #hl>
      <CommonInput
        clearable
        :placeholder="$t('dataManagement.buried.searchReportAndDisplay')"
        v-model="query.searchName"
        class="w240"
        @input="handleSearh" />
      <CommonInput
        clearable
        :placeholder="$t('dataManagement.buried.searchDataDetails')"
        v-model="query.searchDetail"
        class="w200"
        @input="handleSearh" />
      <el-date-picker
        v-model="query.date"
        type="datetimerange"
        :range-separator="$t('common.to')"
        style="width: 320px"
        :clearable="false"
        format="YYYY-MM-DD HH:mm"
        value-format="YYYY-MM-DD HH:mm"
        :disabled-date="disabledDate"
        @change="handleSearh"
        :editable="false" />
      <el-button type="primary" @click="handleReset">
        {{ $t('btn.reset') }}
      </el-button>
    </template>
    <template #hr>
      <span class="c545e6e mr5 flex-center">
        <el-tooltip
          :content="$t('dataManagement.buried.testDataTooltip')"
          placement="left">
          <svg-icon name="help2" class="c86919d" />
        </el-tooltip>
        {{
          $t('dataManagement.buried.testIntervalData', [
            pageInfo.total.toLocaleString(),
          ])
        }}
      </span>
      <Auth :value="authEnum.exportRaw">
        <template #default>
          <el-tooltip
            :content="$t('dataManagement.buried.exportTestDataTooltip')"
            placement="top">
            <el-button
              type="primary"
              :disabled="state.pageData.length === 0"
              @click="download">
              <svg-icon name="download" class="mr5 fz16" />
              {{ $t('dataManagement.buried.exportRawData') }}
            </el-button>
          </el-tooltip>
        </template>
      </Auth>
    </template>
    <el-table
      class="nd-table-custom"
      :data="state.pageData"
      border
      v-loading="state.loading">
      <el-table-column
        v-for="item in columns"
        :key="item.prop"
        :label="item.label"
        :prop="item.prop"
        show-overflow-tooltip
        v-bind="{ ...item }">
        <template #header>
          <FilterDropdown
            v-if="item.prop === 'type'"
            v-model="state.type"
            :list="state.statusEnum"
            :name="item.label"
            @change="getList" />
          <template v-else>{{ item.label }}</template>
        </template>
        <template #default="{ row }">
          <template v-if="item.prop === 'json'">
            <el-button text type="primary" @click="handleDetail(row)">
              {{ row.json }}
            </el-button>
          </template>
          <template v-else-if="item.prop === 'type'">
            {{
              row.type === 1
                ? $t('dataManagement.userProp')
                : $t('dataManagement.eventProp')
            }}
          </template>
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
  </CommonLayout>
  <JsonView
    :ref="(ref) => (state.jsonviewRef = ref)"
    :json-data="state.detailJson"
    :title="$t('dataManagement.dataDetails')" />
</template>

<script setup>
import { reactive } from 'vue'
import dayjs from 'dayjs'
import { downloadDataTest, getTestList } from '@/api/modules/buried'
import { debounce } from 'lodash-es'
import JsonView from '../component/JsonView.vue'
import { authEnum } from './enum.js'
import { recordBehavior } from '@/utils/record-behavior.js'
import { t } from '@/locales/i18n'

recordBehavior({
  moduleName: '数据管理',
  submoduleName: '测试数据',
  operate: '进入页面',
})

const disabledDate = (time) => {
  return (
    time.getTime() > dayjs().endOf('days') ||
    time.getTime() < dayjs().subtract(2, 'days').startOf('days')
  )
}

const state = reactive({
  statusEnum: [
    {
      type: 1,
      label: t('dataManagement.userProp'),
    },
    {
      type: 2,
      label: t('dataManagement.eventProp'),
    },
  ],
  pageData: [],
  loading: false,
  type: 0,
  detailJson: {},
  jsonviewRef: null,
})

const initQuery = () => ({
  date: [
    `${dayjs().format('YYYY-MM-DD')} 00:00:00`,
    dayjs().format('YYYY-MM-DD HH:mm:ss'),
  ],
  searchName: '',
  searchDetail: '',
})

const query = reactive(initQuery())

const pageInfo = reactive({
  pageSize: 20,
  pageNum: 1,
  total: 0,
})

const columns = [
  {
    label: t('common.type'),
    prop: 'type',
    width: 180,
  },
  {
    label: t('dataManagement.buried.reportTime'),
    prop: 'time',
    width: 180,
  },
  {
    label: t('dataManagement.buried.reportName'),
    prop: 'eventName',
    width: 200,
  },
  {
    label: t('dataManagement.displayName'),
    prop: 'eventZhName',
    width: 200,
  },
  {
    label: 'IP',
    prop: 'ip',
    width: 180,
  },
  {
    label: t('dataManagement.dataDetails'),
    prop: 'json',
  },
]

/**
 * @description: 公共的查询条件
 * @return {*}
 */
const getParams = () => ({
  type: !state.type ? 0 : state.type,
  startTime: query.date[0],
  endTime: query.date[1],
  page: pageInfo.pageNum,
  size: pageInfo.pageSize,
  searchDetail: query.searchDetail,
  searchName: query.searchName,
})

/**
 * @description: 获取列表
 * @return {*}
 */
const getList = (type) => {
  const reg = /\s/g
  if (
    type &&
    ((reg.test(query.searchName) &&
      query.searchName.replace(/\s/g, '') === '') ||
      (reg.test(query.searchDetail) &&
        query.searchDetail.replace(/\s/g, '') === ''))
  )
    return

  const params = getParams()
  state.loading = true
  getTestList(params)
    .then((res) => {
      const { list, other, page } = res.data
      state.pageData = list
      pageInfo.total = page.totalCount
    })
    .finally((_) => {
      state.loading = false
    })
}

const handleSearh = debounce(() => getList('search'), 300)

/**
 * @description: 重置筛选条件
 * @return {*}
 */
const handleReset = () => {
  Object.assign(query, initQuery())
  getList()
}

/**
 * @description: 导出数据
 * @return {*}
 */
const download = () => {
  recordBehavior({
    moduleName: '数据管理',
    submoduleName: '测试数据',
    operate: '导出原始数据',
  })
  const params = getParams()
  downloadDataTest(params)
}

/**
 * @description: 查看明细
 * @return {*}
 */
const handleDetail = (row) => {
  recordBehavior({
    moduleName: '数据管理',
    submoduleName: '测试数据',
    operate: '查看明细',
  })
  state.detailJson = row.json ? JSON.parse(row.json) : {}
  state.jsonviewRef.open()
}

getList()
</script>

<style lang="scss" scoped>
:deep() {
  .el-tabs {
    .el-tabs__item {
      padding: 0 15px 10px;
      height: unset;
    }
    .el-tabs__header {
      margin-bottom: 20px;
    }
    .el-tabs__active-bar {
      height: 4px;
      border-radius: var(--el-border-radius-base);
    }
    .el-tabs__nav-wrap::after {
      display: none;
    }
  }
}
.extra-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
