<template>
  <CommonDetailPage
    :title="
      $t('dataManagement.buried.dynamicDetails', [$route.query.eventName])
    ">
    <template #detail-r>
      {{
        $t('dataManagement.buried.detailDataTip', {
          storedCount: $route.query.count || 0,
          errorCount: $route.query.errorCount || 0,
        })
      }}
      <!-- 已入库{{ $route.query.count || 0 }}条；错误
      {{ $route.query.errorCount || 0 }}条，最多只展示当前最近100条已入库数据 -->
    </template>
    <CommonLayout>
      <template #hl>
        <CommonInput
          clearable
          :placeholder="
            $t('dataManagement.buried.userIdentificationPlaceholder')
          "
          v-model="fid"
          class="w220"
          @keyup.enter="getList" />
        <el-button type="primary" @click="getList">
          {{ $t('btn.search') }}
        </el-button>
      </template>
      <template #hr>
        <CustomField
          v-model="state.checkedValue"
          :data="state.fieldData"
          :defaultProps="{
            value: 'enName',
            label: 'zhName',
          }"
          @submit="confirmField"
          valueKey
          placement="bottom-end" />
      </template>
      <el-table
        class="nd-table-custom"
        :data="state.pageData"
        border
        v-loading="state.loading">
        <el-table-column
          v-for="item in state.columns"
          :key="item.prop"
          :label="item.label"
          :prop="item.prop"
          show-overflow-tooltip
          v-bind="{ ...item }"
          :min-width="120">
          <template #header>
            <FilterDropdown
              v-if="item.prop === 'status'"
              v-model="state.status"
              :list="state.statusEnum"
              :name="item.label" />
            <template v-else-if="item.prop === 'count'">
              <span class="mr5"> {{ item.label }} </span>
              <el-tooltip :content="$t('dataManagement.buried.updateTooltip')">
                <svg-icon name="help2" class="c86919d" />
              </el-tooltip>
            </template>
            <template v-else>{{ item.label }}</template>
          </template>
          <template #default="{ row }">
            <span v-if="item.prop === 'status'">
              <el-switch
                :active-value="0"
                :inactive-value="1"
                v-model="row.status"></el-switch>
            </span>
            <span v-if="item.prop === 'operation'">
              <el-button
                text
                type="primary"
                @click="$router.push('/data-management/buried/data-detail')">
                {{ $t('dataManagement.buried.viewDetails') }}
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
    </CommonLayout>
  </CommonDetailPage>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { fieldZhEnProperty, getDetailList } from '@/api/modules/buried'
import { useRoute } from 'vue-router'
import { recordBehavior } from '@/utils/record-behavior.js'

recordBehavior({
  moduleName: '数据管理',
  submoduleName: '埋点数据',
  operate: '查看明细',
})

const route = useRoute()

const fid = ref('')
const state = reactive({
  checkedValue: [],
  loading: false,
  pageData: [],
  fieldData: [],
  columns: [],
})

const pageInfo = reactive({
  pageNum: 1,
  pageSize: 20,
  total: 0,
})

/**
 * @description: 获取自定义列
 * @return {*}
 */
const getField = () => {
  const params = {
    eventName: route.query.eventName,
  }
  fieldZhEnProperty(params).then((res) => {
    // 用户ID 访客ID置顶
    const defaultField = res.data
      .filter((item) => ['__fid', '__did'].includes(item.enName))
      .map((item) => {
        // item.checked = true
        item.disabled = true
        return item
      })

    const dynamicField = res.data.filter(
      (item) => !['__fid', '__did'].includes(item.enName)
    )
    state.fieldData = [...defaultField, ...dynamicField]

    // 默认勾选用户ID 访客ID
    const defaultColumn = ['__fid', '__did']
    // 默认勾选不包含__的列
    const dynamicColumn = res.data.filter((item) => !/^__/.test(item.enName))

    state.checkedValue = [
      ...new Set([
        ...defaultColumn,
        ...dynamicColumn.map((item) => item.enName),
      ]),
    ]

    // 设置默认列
    state.columns = [...defaultField, ...dynamicColumn].map((item) => {
      item.label = item.zhName
      item.prop = item.enName
      return item
    })
  })
}

/**
 * @description: 动态列
 * @return {*}
 * @param {*} list
 */
const confirmField = (list) => {
  state.columns = list.map((item) => {
    item.label = item.zhName
    item.prop = item.enName
    return item
  })
}

/**
 * @description: 获取明细列表
 * @return {*}
 */
const getList = () => {
  const { eventName, startDate, endDate } = route.query
  const params = {
    eventName,
    startDate,
    endDate,
    fid: fid.value,
    page: pageInfo.pageNum,
    size: pageInfo.pageSize,
  }
  state.loading = true
  getDetailList(params)
    .then((res) => {
      const { list, page } = res.data
      state.pageData = list
      pageInfo.total = page.totalCount
    })
    .finally((_) => {
      state.loading = false
    })
}

onMounted(() => {
  getField()
  getList()
})
</script>
