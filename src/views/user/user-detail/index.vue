<template>
  <CommonLayout>
    <template #hl>
      <el-row align="middle">
        <div class="user-detail__property">
          <PropsFilter
            v-model="state.conditionFilters"
            :data="state.fieldsList"
            :lineNum="1"
            :limit="['userField']" />
        </div>
        <el-button size="small" type="primary" @click="getList" class="ml3">
          {{ $t('btn.search') }}
        </el-button>
      </el-row>
    </template>

    <div class="flex-column h100-percentage">
      <header class="flex flex-between" v-if="state.pageData.length > 0">
        <CustomField
          v-model="state.checkedValue"
          :data="state.customFieldData"
          :default-props="{ label: 'fZh', value: 'fEn' }"
          value-key
          @submit="confirmField" />
        <div>
          <Auth :value="authEnum.createResultGroup">
            <template #default="{ title }">
              <el-button @click="createResultCluster">
                <svg-icon name="add1" class="mr5 fz16" />
                {{ title }}
              </el-button>
            </template>
          </Auth>

          <Auth :value="authEnum.export">
            <template #default="{ title }">
              <el-button type="primary" @click="downloadData">
                <svg-icon name="download" class="mr5 fz16" />
                {{ title }}
              </el-button>
            </template>
          </Auth>
        </div>
      </header>
      <div class="main-table-container mt20" v-loading="state.loading">
        <el-table
          class="nd-table-custom"
          :data="state.pageData"
          border
          v-if="state.hasSearch">
          <el-table-column
            v-for="item in state.columns"
            :key="item.prop"
            :label="item.label"
            :prop="item.prop"
            sortable
            show-overflow-tooltip
            v-bind="{ ...item }"
            :min-width="180"
            :fixed="['__fid', '__did'].includes(item.prop)">
            <template #default="{ row }">
              <el-text
                type="primary"
                v-if="['__fid', '__did'].includes(item.prop)"
                @click="showSquenceDetail(row)"
                style="cursor: pointer">
                {{ row[item.prop] }}
              </el-text>
            </template>
          </el-table-column>
        </el-table>
        <div class="h100-percentage flex-level-center flex-center" v-else>
          <el-empty
            :image="empty"
            :image-size="66"
            :description="$t('user.userReview.detailedUserReview')" />
        </div>
      </div>
    </div>

    <template #footer>
      <Pagination
        v-model:limit="pageInfo.pageSize"
        v-model:page="pageInfo.pageNum"
        :total="pageInfo.total"
        @getData="getList"
        :totalCount="pageInfo.totalCount" />
    </template>
  </CommonLayout>
  <ResultClusterDialog
    ref="resultClusterRef"
    moduleName="用户"
    submoduleName="用户细查"
    :validate-qp="state.conditionFilters"
    :qp="getQp"
    isValid />
  <UserSequence ref="userSequenceRef" />
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import dayjs from 'dayjs'
import empty from '@/assets/images/empty_search.png'
import { getFieldList } from '@/api/modules/analysis/common.js'
import useOperate from '@/components/PropsFilter/useOperate'
import { ElMessage } from 'element-plus'
import { getUserDetailList, exportUserDetail } from '@/api/modules/user-detail'
import UserSequence from '@/views/user/components/UserSequence/index.vue'
import ResultClusterDialog from '@/views/analysis/components/ResultClusterDialog/index.vue'
import { authEnum } from './enum.js'
import { recordBehavior } from '@/utils/record-behavior.js'
import { cloneDeep, omit } from 'lodash-es'
import { handleCustomColumn } from '@/utils/dataProcessing.js'

import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数

const { handleAddConditionData, parseFilterData } = useOperate()

recordBehavior({
  moduleName: '用户',
  submoduleName: '用户细查',
  operate: '进入页面',
})
const state = reactive({
  pageData: [],
  loading: false,
  columns: [],
  checkedValue: [],
  dialogVisible: false,
  hasSearch: false, // 是否点击过搜索
  fieldsList: {},
  conditionFilters: {
    relation: 0,
    filters: [],
  },
  customFieldData: [],
  submitLoading: false,
})

const pageInfo = reactive({
  pageSize: 20,
  pageNum: 1,
  total: 0,
  totalCount: 0,
})

const query = reactive({
  date: [dayjs().format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
})

const userSequenceRef = ref(null)

const limit = ['userField']
const addGlobalFilter = () => {
  state.conditionFilters = handleAddConditionData({
    condition: state.conditionFilters,
    noLimit: limit,
    conditionList: state.fieldsList,
  })
}

onMounted(() => {
  getFieldList().then((res) => {
    state.fieldsList = cloneDeep(res.data)
    const config = res.data.config
    const filterConfig = {}
    Object.keys(config).forEach((key) => {
      filterConfig[key] = ['timestamp', 'datetime'].includes(key)
        ? omit(config[key], ['C14'])
        : config[key]
    })

    Object.assign(state.fieldsList, { config: filterConfig })

    addGlobalFilter()
    getDefaultColumns(res.data.userField)
  })
})

/**
 * @description: 设置默认选中的列
 * @return {*}
 */
const getDefaultColumns = (data) => {
  // 用户ID 访客ID置顶
  const defaultField = data
    .filter((item) => ['__fid', '__did'].includes(item.fEn))
    .map((item) => {
      item.disabled = true
      return item
    })
  const dynamicField = data.filter(
    (item) => !['__fid', '__did'].includes(item.fEn)
  )
  state.customFieldData = [...defaultField, ...dynamicField]
  // 默认勾选用户ID 访客ID
  const defaultColumn = ['__fid', '__did']
  // 默认勾选不包含__的列
  const dynamicColumn = data.filter(
    (item) => !['__fid', '__did'].includes(item.fEn)
  )
  state.checkedValue = handleCustomColumn([
    ...new Set([...defaultColumn, ...dynamicColumn.map((item) => item.fEn)]),
  ])

  // 设置默认列
  const customTableColumn = JSON.parse(
    localStorage.getItem('customTableColumn') || '[]'
  )
  const tmp = !!customTableColumn.length
    ? dynamicColumn.reduce((p, c) => {
        customTableColumn.forEach((item) => {
          if (c.fEn === item) {
            p.push(c)
          }
        })
        return p
      }, [])
    : dynamicColumn

  state.columns = [...defaultField, ...tmp].map((item) => {
    item.label = item.fZh
    item.prop = item.fEn
    return item
  })
}

const getList = () => {
  if (!parseFilterData(state.conditionFilters)) {
    ElMessage.warning(t('common.filterConditionErr'))
    return
  }

  initList()
}

/**
 * @description: 格式化qp
 * @return {*}
 */
const getQp = () => {
  const data = parseFilterData(state.conditionFilters).filts[0]

  const qp = {
    eventsRelation: 0,
    eventsUsersRelation: 0,
    usersRelation: 0,
    events: [],
    users: [{ ...data }],
    filterType: 0,
  }

  return qp
}

/**
 * @description: 请求列表
 * @return {*}
 */
const initList = () => {
  const params = {
    page: pageInfo.pageNum,
    size: pageInfo.pageSize,
    qp: JSON.stringify(getQp()),
  }
  state.loading = true
  getUserDetailList(params)
    .then((res) => {
      state.hasSearch = true
      state.pageData = res.data.list
      pageInfo.total = res.data.page.totalCount
      pageInfo.totalCount = res.data.other
    })
    .finally(() => {
      state.loading = false
    })
}

/**
 * @description: 自定义列-表格动态列
 * @return {*}
 * @param {*} data
 */
const confirmField = (data) => {
  state.columns = data.map((item) => {
    item.label = item.fZh
    item.prop = item.fEn
    return item
  })
  localStorage.setItem(
    'customTableColumn',
    JSON.stringify(data.map((item) => item.fEn))
  )
}

/**
 * @description: 导出数据
 * @return {*}
 */
const downloadData = () => {
  recordBehavior({
    moduleName: '用户',
    submoduleName: '用户细查',
    operate: '导出用户数据',
  })
  const params = {
    qp: JSON.stringify(getQp()),
  }
  exportUserDetail(params)
}

/**
 * @description: 用户行为序列
 * @return {*}
 */
const showSquenceDetail = (row) => {
  recordBehavior({
    moduleName: '用户',
    submoduleName: '用户细查',
    operate: '进入用户行为序列页面',
  })
  userSequenceRef.value.open(row, state.pageData)
}

const resultClusterRef = ref(null)

const createResultCluster = () => {
  resultClusterRef.value.open()
}
</script>

<style lang="scss" scoped>
.main-table-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}
:deep(.user-detail__property) {
  .filter-operation {
    display: none;
  }
  .props-filter {
    margin: unset;
  }
  .eas-filter-container {
    padding: unset;
  }
}
:deep() {
  .el-button--small {
    --el-button-size: 28px;
    font-size: 14px;
    padding: 8px 15px;
  }
}
</style>
