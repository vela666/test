<template>
  <CommonLayout>
    <template #hl>
      <CommonInput
        v-model="filterConfig.fuzzyKey"
        desc="搜索账号/用户名"
        class="w210"
        notTrimSpace />
      <DateRangeSelect
        ref="dateRangeSelectRef"
        :needDynamic="false"
        v-model="filterConfig.dateRange" />
      <SelectCompany v-model="filterConfig.companyCodeList" />
      <el-select
        placeholder="选择一级模块"
        v-model="filterConfig.topModuleList"
        class="w210"
        multiple
        filterable
        clearable
        collapse-tags
        collapse-tags-tooltip
        :max-collapse-tags="1">
        <el-option
          v-for="item in state.topModuleList"
          :key="item"
          :label="item"
          :value="item" />
      </el-select>
      <el-select
        placeholder="选择子模块"
        v-model="filterConfig.subModuleList"
        class="w210"
        multiple
        filterable
        clearable
        collapse-tags
        collapse-tags-tooltip
        :max-collapse-tags="1">
        <el-option
          v-for="item in state.subModuleList"
          :key="item"
          :label="item"
          :value="item" />
      </el-select>
      <el-button type="primary" @click="getList">查询</el-button>
    </template>
    <template #hr>
      <el-button
        type="primary"
        v-loading="state.exportLoading"
        @click="exportData">
        <SvgIcon class="mr5 fz16" name="download" />
        导出</el-button
      >
    </template>
    <el-table
      v-loading="state.exhibitLoading"
      class="nd-table-custom"
      :data="state.pagedData"
      border
      ref="tableRef">
      <el-table-column
        v-for="(column, index) of columns"
        :prop="column.prop"
        :key="index"
        :label="column.label"
        show-overflow-tooltip
        :sortable="column.sortable" />
    </el-table>

    <template #footer>
      <Pagination
        @getData="getList"
        v-model:limit="filterConfig.size"
        v-model:page="filterConfig.page"
        :total="state.pageTotal" />
    </template>
  </CommonLayout>
</template>

<script setup>
import { reactive, markRaw, toRefs } from 'vue'
import { ElMessage } from 'element-plus'
import {
  recent7DayStart,
  recent7DayEnd,
  past7DayStart,
  past7DayEnd,
} from '@/enumeration/date.js'
import {
  asyncGetModuleList,
  asyncGetLogList,
  asyncExportLog,
} from '@/api/modules/operation-analysis.js'
import { delNullProperty } from '@/utils/dataProcessing.js'
import { debounce } from 'lodash-es'
import { whitespaceRegex } from '@/utils/regExp.js'
import SelectCompany from '../components/SelectCompany.vue'

const columns = [
  {
    label: '操作时间',
    prop: 'createTime',
    sortable: 'custom',
    // sortMethod: (a, b, key) => alphabetSort(a, b, key),
  },
  {
    label: '操作账号',
    prop: 'account',
  },
  {
    label: '用户名',
    prop: 'nickName',
  },
  {
    label: '企业',
    prop: 'companyName',
  },
  {
    label: '一级模块',
    prop: 'model',
  },
  {
    label: '子模块',
    prop: 'page',
  },
  {
    label: '操作功能',
    prop: 'operate',
  },
  {
    label: '浏览器类型',
    prop: 'browser',
  },
]
const initVal = () => {
  return {
    state: {
      pagedData: [],
      exhibitLoading: false,
      exportLoading: false,
      // 页面数据总数
      pageTotal: 0,

      topModuleList: [],
      subModuleList: [],
    },
    filterConfig: {
      fuzzyKey: '',
      companyCodeList: [],
      subModuleList: [],
      topModuleList: [],
      // 分页器配置
      page: 1, // 当前页码
      size: 20, // 每页数量
      dateRange: {
        date: [recent7DayStart, recent7DayEnd],
        diff: '',
      },
      // startDate: '',
      // endDate: '',
    },
  }
}

const state = reactive(initVal().state)
const filterConfig = reactive(initVal().filterConfig)

const getModuleList = async () => {
  const {
    data: { topModuleList, subModuleList },
  } = await asyncGetModuleList()
  state.topModuleList = markRaw(topModuleList)
  state.subModuleList = markRaw(subModuleList)
}

const exportData = async () => {
  state.exportLoading = true
  await asyncExportLog(
    delNullProperty({
      ...filterConfig,
      startDate: filterConfig.dateRange.date[0],
      endDate: filterConfig.dateRange.date[1],
      page: 1,
      size: -1,
    })
  ).finally((_) => {
    state.exportLoading = false
  })
  ElMessage.success('成功')
}

const getList = debounce(async (type) => {
  if (type && whitespaceRegex.test(filterConfig.fuzzyKey)) return
  state.exhibitLoading = true
  const {
    data: { list, page },
  } = await asyncGetLogList(
    delNullProperty({
      ...filterConfig,
      startDate: filterConfig.dateRange.date[0],
      endDate: filterConfig.dateRange.date[1],
    })
  ).finally((_) => {
    state.exhibitLoading = false
  })
  state.pageTotal = page.totalCount
  state.pagedData = list
}, 300)

getList()
getModuleList()
defineOptions({
  name: 'OperationLog',
})
</script>

<style scoped lang="scss"></style>
