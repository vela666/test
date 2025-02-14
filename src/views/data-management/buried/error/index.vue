<template>
  <CommonLayout>
    <template #hl>
      <CommonInput
        clearable
        :placeholder="$t('dataManagement.buried.searchReportAndDisplay')"
        v-model="query.searchName"
        class="w240"
        @input="handleSearch" />
      <el-date-picker
        v-model="query.date"
        type="datetimerange"
        :range-separator="$t('common.to')"
        style="width: 320px"
        :clearable="false"
        format="YYYY-MM-DD HH:mm"
        value-format="YYYY-MM-DD HH:mm"
        :disabled-date="disabledDate"
        @change="handleSearch" />
      <el-button type="primary" @click="handleReset">
        {{ $t('btn.reset') }}
      </el-button>
    </template>
    <template #hr>
      <div class="flex-center">
        <span class="mr20 c545e6e">
          <el-tooltip
            :content="$t('dataManagement.buried.errorDataTooltip')"
            placement="top">
            <svg-icon name="help2" class="c86919d" />
          </el-tooltip>
          {{
            $t('dataManagement.buried.errorIntervalData', [
              pageInfo.other?.toLocaleString(),
            ])
          }}
          <!-- 区间数据：错误数据{{ pageInfo.other?.toLocaleString() }}条 -->
        </span>
        <Auth :value="authEnum.exportError">
          <template #default>
            <el-tooltip
              :content="$t('dataManagement.buried.exportErrorDataTip')"
              placement="top">
              <el-button
                type="primary"
                :disabled="state.pageData.length === 0"
                @click="handleDownload">
                <svg-icon name="download" class="mr5 fz16" />
                {{ $t('dataManagement.buried.exportErrorDataBtn') }}
                <!-- {{ title }} -->
              </el-button>
            </el-tooltip>
          </template>
        </Auth>
      </div>
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
        <template #default="{ row }">
          <span v-if="item.prop === 'desc'">
            <el-button text type="primary" @click="handleDetail(row)">
              {{ row.desc }}
            </el-button>
          </span>
          <template v-else-if="item.prop === 'errortype'">
            <span
              :style="{
                color:
                  row.tips && row.type !== '4' ? 'var(--eas-color-danger)' : '',
              }">
              {{ row.errortype }}
            </span>
            <el-tooltip v-if="row.tips" :content="row.tips" placement="top">
              <svg-icon name="help2" class="ml5" />
            </el-tooltip>
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
    <JsonView
      :ref="(ref) => (state.jsonviewRef = ref)"
      :json-data="state.detailJson"
      :title="$t('dataManagement.buried.errorDetails')" />
  </CommonLayout>
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import JsonView from '../component/JsonView.vue'
import { getErrorList, downloadDataError } from '@/api/modules/buried'
import dayjs from 'dayjs'
import { debounce } from 'lodash-es'
import { authEnum } from './enum.js'
import { recordBehavior } from '@/utils/record-behavior.js'
import { t } from '@/locales/i18n'

const disabledDate = (time) => {
  return (
    time.getTime() > dayjs().endOf('days') ||
    time.getTime() < dayjs().subtract(2, 'days').startOf('days')
  )
}

recordBehavior({
  moduleName: '数据管理',
  submoduleName: '错误详情',
  operate: '进入页面',
})

const state = reactive({
  pageData: [],
  loading: false,
  jsonviewRef: null,
  detailJson: {},
})

const initQuery = () => ({
  searchName: '',
  date: [
    `${dayjs().format('YYYY-MM-DD')} 00:00:00`,
    dayjs().format('YYYY-MM-DD HH:mm:ss'),
  ],
})

const query = reactive(initQuery())

const pageInfo = reactive({
  pageNum: 1,
  pageSize: 20,
  total: 0,
  other: 0,
})

const columns = [
  {
    label: t('dataManagement.buried.reportTime'),
    prop: 'time',
    width: 200,
  },
  {
    label: t('dataManagement.buried.reportName'),
    prop: 'eventName',
    width: 180,
  },
  {
    label: t('dataManagement.displayName'),
    prop: 'eventZhName',
    width: 180,
  },
  {
    label: t('dataManagement.buried.count'),
    prop: 'count',
    width: 180,
  },
  {
    label: t('dataManagement.buried.errorHandling'),
    prop: 'handletype',
    minWidth: 200,
  },
  {
    label: t('dataManagement.buried.errorType'),
    prop: 'errortype',
    width: 180,
  },
  {
    label: t('dataManagement.buried.errorDetails'),
    prop: 'desc',
    minWidth: 200,
  },
]

onMounted(() => {
  getList()
})

const getParams = () => ({
  page: pageInfo.pageNum,
  size: pageInfo.pageSize,
  searchName: query.searchName,
  startTime: query.date[0],
  endTime: query.date[1],
})

/**
 * @description: 请求列表
 * @return {*}
 */
const getList = (type) => {
  const reg = /\s/g
  if (
    type &&
    reg.test(query.searchName) &&
    query.searchName.replace(/\s/g, '') === ''
  )
    return

  const params = getParams()
  state.loading = true
  getErrorList(params)
    .then((res) => {
      const { list, page, other = 0 } = res.data
      state.pageData = list
      pageInfo.total = page.totalCount
      pageInfo.other = other
    })
    .finally((_) => {
      state.loading = false
    })
}

const handleSearch = debounce(() => getList('search'), 300)

/**
 * @description: 重置筛选条件
 * @return {*}
 */
const handleReset = () => {
  Object.assign(query, initQuery())
  getList()
}

/**
 * @description: 下载
 * @return {*}
 */
const handleDownload = () => {
  recordBehavior({
    moduleName: '数据管理',
    submoduleName: '错误详情',
    operate: '导出错误数据',
  })

  const params = getParams()
  downloadDataError(params).then((res) => {
    console.log(res)
  })
}

/**
 * @description: 查看明细
 * @return {*}
 */
const handleDetail = (row) => {
  state.detailJson = row.json ? JSON.parse(row.json) : {}
  state.jsonviewRef.open()
}
</script>
