<template>
  <CommonLayout>
    <template #hl>
      <CommonInput
        v-model="filterConfig.companyKey"
        desc="搜索企业名称/企业编码"
        class="w220" />
      <CommonInput
        v-model="filterConfig.appKey"
        desc="搜索应用名称/AppID"
        class="w220" />
    </template>
    <template #hr>
      <span class="fz14 flex-center mr10">
        入库数总计：<i class="c5473e8">{{ dataQuantityTotal }}</i
        >条
        <el-tooltip content="数据存在一定延迟" placement="top">
          <SvgIcon class="fz16 c86919d ml5" name="help2" />
        </el-tooltip>
      </span>
    </template>
    <el-table
      class="nd-table-custom"
      :data="state.pagedData"
      show-summary
      :summary-method="getSummaries"
      @sort-change="changeTableSort"
      border>
      <el-table-column
        v-for="column of columns"
        :prop="column.prop"
        :key="column.label"
        :label="column.label"
        :show-overflow-tooltip="!!column.prop"
        :sortable="column.sortable">
        <template #header>
          <span v-if="column.switch">
            <FilterDropdown
              @change="handleTableData"
              v-model="filterConfig.status"
              :list="appStatusType"
              :name="column.label" />
          </span>
          <span
            v-if="
              ['usedEventFieldTotal', 'usedUserFieldTotal'].includes(
                column.prop
              )
            ">
            <span class="mr3">{{ column.label }}</span>
            <el-tooltip content="已发布自定义属性" placement="top">
              <svg-icon name="help2" />
            </el-tooltip>
          </span>
        </template>
        <template #default="{ row }">
          <span
            :class="appStatusTypeMap[row.status]?.class"
            v-if="column.switch">
            {{ appStatusTypeMap[row.status]?.label }}
          </span>
          <template v-else>
            {{ thousandQuantileProcessing(row[column.prop]) }}</template
          >
        </template>
      </el-table-column>
    </el-table>

    <template #footer>
      <Pagination
        v-model:limit="pageConfig.pageSize"
        v-model:page="pageConfig.page"
        :total="pageConfig.total"
        @getData="handleTableData" />
    </template>
  </CommonLayout>
</template>

<script setup>
import { computed, watch, reactive, ref, onActivated, markRaw } from 'vue'
import { appStatusType, appStatusTypeMap } from '@/enumeration'
import { cloneDeep, debounce } from 'lodash-es'
import {
  slicePagingData,
  thousandQuantileProcessing,
} from '@/utils/dataProcessing'
import { asyncGetAppManageList } from '@/api/modules/app'

const initVal = () => {
  return {
    state: {
      tableAllData: [],
      pagedData: [],
      // dataQuantityTotal: 0,
    },
    filterConfig: {
      // 搜索团队名称
      companyKey: '',
      // 搜索关键字
      appKey: '',
      // 0 启用 1停用
      status: '',
      sort: '',
      sortFiled: '',
    },
    pageConfig: {
      // 分页器配置
      page: 1, // 当前页码
      pageSize: 20, // 每页数量
      total: 0, // 总数
    },
  }
}
const state = reactive(initVal().state)
const filterConfig = reactive(initVal().filterConfig)
const pageConfig = reactive(initVal().pageConfig)

const dataQuantityTotal = computed(() => {
  return thousandQuantileProcessing(
    state.tableAllData.reduce((prev, cur) => {
      return (prev += cur.dataNum)
    }, 0)
  )
})
const columns = [
  {
    prop: 'appName',
    label: '应用名称',
    sortable: 'custom',
  },
  {
    prop: 'appId',
    label: 'AppID',
    sortable: 'custom',
  },
  {
    prop: 'companyName',
    label: '企业名称',
    sortable: 'custom',
  },
  {
    prop: 'companyCode',
    label: '企业编码',
    sortable: 'custom',
  },
  /* {
    prop: 'prop',
    label: '平台',
  },*/
  {
    prop: 'dataNum',
    label: '入库数',
    sortable: 'custom',
  },
  {
    prop: 'usedEventTotal',
    label: '事件',
    sortable: 'custom',
  },
  {
    prop: 'usedEventFieldTotal',
    label: '事件属性',
    sortable: 'custom',
  },
  {
    prop: 'usedUserFieldTotal',
    label: '用户属性',
    sortable: 'custom',
  },
  {
    prop: 'creator',
    label: '创建人',
    sortable: 'custom',
  },
  {
    prop: 'createTime',
    label: '创建时间',
    sortable: 'custom',
  },
  {
    label: '状态',
    switch: true,
  },
]

const handleTableData = debounce(() => {
  const appKey = filterConfig.appKey.toLocaleLowerCase()
  const companyKey = filterConfig.companyKey.toLocaleLowerCase()
  const statusHasVal = !Number.isInteger(filterConfig.status)
  let data = cloneDeep(state.tableAllData)
    .filter((app) => {
      const { appName, appId, status } = app
      const search = (appName + '' + appId)
        ?.toLocaleLowerCase()
        .includes(appKey)
      const isStatusMatch = statusHasVal || status === filterConfig.status
      return search && isStatusMatch
    })
    .filter((app) => {
      const { companyName, companyCode } = app
      const name = (companyName + '' + companyCode)
        ?.toLocaleLowerCase()
        .includes(companyKey)
      return name
    })
  if (filterConfig.sort) {
    data = data.sort((a, b) => {
      const itemA =
        a[filterConfig.sortFiled] === null ||
        a[filterConfig.sortFiled] === undefined
          ? ''
          : a[filterConfig.sortFiled]
      const itemB =
        b[filterConfig.sortFiled] === null ||
        b[filterConfig.sortFiled] === undefined
          ? ''
          : b[filterConfig.sortFiled]
      if (
        itemA === '' ||
        itemB === '' ||
        Number.isNaN(Number(itemA)) ||
        Number.isNaN(Number(itemB))
      ) {
        if (filterConfig.sort === 'ascending') {
          return itemA.localeCompare(itemB)
        } else {
          return itemB.localeCompare(itemA)
        }
      } else {
        if (filterConfig.sort === 'ascending') {
          return itemA - itemB
        } else {
          return itemB - itemA
        }
      }
    })
  }
  pageConfig.total = data.length
  state.pagedData = markRaw(
    slicePagingData(data, pageConfig.page, pageConfig.pageSize)
  )
})

const getSummaries = (param) => {
  const { columns, data } = param
  const sums = []
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }
    const values = data.map((item) => Number(item[column.property]))
    if (!values.some((value) => Number.isNaN(value))) {
      sums[index] = thousandQuantileProcessing(
        values.reduce((prev, curr) => {
          const value = Number(curr)
          if (!Number.isNaN(value)) {
            return prev + curr
          } else {
            return prev
          }
        }, 0)
      )
    } else {
      sums[index] = '--'
    }
  })
  return sums
}

const changeTableSort = ({ column, prop, order }) => {
  filterConfig.sort = order ? order : ''
  filterConfig.sortFiled = order ? prop : ''
}

const getAppList = async () => {
  const { data } = await asyncGetAppManageList({
    size: -1,
  })

  state.tableAllData = data
  handleTableData()
}
getAppList()

watch(
  () => filterConfig,
  (val) => {
    handleTableData()
  },
  {
    deep: true,
  }
)

defineOptions({
  name: 'AppManage',
})
</script>

<style scoped lang="scss"></style>
