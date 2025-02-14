<template>
  <CommonLayout>
    <template #hl>
      <el-date-picker
        v-model="query.date"
        type="daterange"
        :range-separator="$t('common.to')"
        style="width: 320px"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        @change="handleSearh"
        :editable="false" />
    </template>
    <template #hr>
      <Auth :value="authEnum.startAcceptance">
        <template #default>
          <el-button type="primary" @click="dataAcceptanceFn">
            {{ $t('dataManagement.buried.startAcceptance') }}
          </el-button>
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
        <template #header v-if="item.filterKey">
          <FilterDropdown
            v-model="query[item.filterKey]"
            :list="item.list"
            :name="item.label"
            @change="getList" />
        </template>
        <template #default="{ row }">
          <template v-if="item.prop === 'errCount'">
            <div v-if="row.errCount > 0" class="cff7d00">
              <SvgIcon name="warning1" class="cff7d00 fz14 mr3" />
              <span>
                {{
                  $t('dataManagement.buried.issuesConfirmed', [row.errCount])
                }}
                <!-- {{ row.errCount }}个问题待确认 -->
              </span>
            </div>
            <span v-else>
              {{ $t('dataManagement.buried.noIssues') }}
            </span>
          </template>
          <template v-else-if="item.prop === 'type'">
            {{
              row.type === 1
                ? $t('dataManagement.buried.userData')
                : $t('dataManagement.buried.eventData')
            }}
          </template>
          <template v-else-if="item.prop === 'startTime'">
            {{ `${row.startTime} ${$t('common.to')} ${row.endTime}` }}
          </template>
          <template v-else-if="item.prop === 'operation'">
            <el-button text type="primary" @click="acceptanceResultFn(row)">
              {{ $t('dataManagement.buried.acceptanceResults') }}
            </el-button>
            <Auth :value="authEnum.del">
              <el-button text type="primary" @click="deleteRow(row)">
                {{ $t('btn.delete') }}
              </el-button>
            </Auth>
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
  <DataAcceptance ref="dataAcceptanceRef" @getData="getList" />
  <AcceptanceResult ref="acceptanceResultRef" />
</template>

<script setup>
import { reactive, ref } from 'vue'
import { debounce } from 'lodash-es'
import { authEnum } from './enum.js'
import DataAcceptance from './components/DataAcceptance.vue'
import AcceptanceResult from './components/AcceptanceResult.vue'
import {
  asyncDelInspection,
  asyncSearchInspectionList,
} from '@/api/modules/programme/data-check.js'
import { delNullProperty } from '@/utils/dataProcessing.js'
import { useTipModal } from '@/components/TipDialog/index.js'
import { ElMessage } from 'element-plus'
import { t } from '@/locales/i18n.js'

const state = reactive({
  pageData: [],
  type: 0,
  loading: false,
})

const dataAcceptanceRef = ref(null)
const acceptanceResultRef = ref(null)

const query = reactive({
  date: [],
  type: '',
})

const pageInfo = reactive({
  pageSize: 20,
  pageNum: 1,
  total: 0,
})

const columns = [
  {
    label: t('dataManagement.buried.acceptanceTime'),
    prop: 'createTime',
  },
  {
    label: t('dataManagement.buried.acceptanceContent'),
    prop: 'type',
    'min-width': 50,
    list: [
      {
        type: 0,
        label: t('dataManagement.buried.eventData'),
      },
      {
        type: 1,
        label: t('dataManagement.buried.userData'),
      },
    ],
    filterKey: 'type',
  },
  {
    label: t('dataManagement.buried.timeRange'),
    prop: 'startTime',
  },
  {
    label: t('dataManagement.buried.acceptanceCriteria'),
    prop: 'condition',
  },
  {
    label: t('common.status'),
    prop: 'errCount',
  },
  {
    label: t('dataManagement.buried.acceptancePersonnel'),
    prop: 'createByName',
  },
  {
    label: t('common.operate'),
    prop: 'operation',
    fixed: 'right',
    width: 220,
  },
]

const acceptanceResultFn = (row) => {
  acceptanceResultRef.value.open(row)
}

const dataAcceptanceFn = () => {
  dataAcceptanceRef.value.open()
}

const getList = async () => {
  state.loading = true
  const {
    data: { list, page },
  } = await asyncSearchInspectionList(
    delNullProperty({
      type: query.type,
      startDate: query.date?.[0],
      endDate: query.date?.[1],
      page: pageInfo.pageNum,
      size: pageInfo.pageSize,
    })
  ).finally((_) => {
    state.loading = false
  })
  state.pageData = list
  pageInfo.total = page.totalCount
}

const handleSearh = debounce(() => getList('search'), 300)

const deleteRow = (row) => {
  useTipModal({
    content: t('dataManagement.buried.copnfirmDeleteAcceptRes', [
      row.createTime,
    ]),
    iconType: 3,
    btnSwap: true,
    title: t('btn.delete'),
    // 传事件
    async onSubmit(cb) {
      await asyncDelInspection({
        inspectionIds: [row.id],
      }).finally((_) => {
        cb()
      })
      getList()
      ElMessage.success(t('common.deleteSuccessfully'))
    },
  })
}

getList()
</script>

<style lang="scss" scoped>
.nd-table-custom {
  flex: 1;
}
.common-layout-footer {
  height: 64px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  position: relative;
}
</style>
