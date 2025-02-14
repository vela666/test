<template>
  <CommonLayout>
    <template #hl>
      <Auth :value="authEnum.add">
        <template #default>
          <DropDownPopoverSelection>
            <el-button type="primary">
              <SvgIcon name="add1" class="fz16 mr3" />
              {{ $t('btn.add') }}
            </el-button>
            <template #content>
              <template v-for="item of state.tableTypeList" :key="item.value">
                <el-button class="skip" text @click="addCommand(item.value)">
                  {{ item.label }}
                  <el-tooltip effect="dark" :content="item.tip" placement="top">
                    <svg-icon
                      name="help2"
                      class="fz12 ml3"
                      style="cursor: pointer" />
                  </el-tooltip>
                </el-button>
              </template>
            </template>
          </DropDownPopoverSelection>
        </template>
      </Auth>
    </template>
    <template #hr>
      <span class="fz14 flex-center mr10" v-show="!state.loading">
        {{ $t('dataManagement.customTable.customTableCount') }}：
        <el-text type="primary">{{ state.customCountInfo.usageCount }}</el-text>
        /{{ state.customCountInfo.maxCount }}
      </span>
    </template>
    <el-table
      class="nd-table-custom"
      :data="state.pagedData"
      border
      v-loading="state.loading">
      <el-table-column
        v-for="item of columns"
        :prop="item.prop"
        :key="item.label"
        :label="item.label"
        :align="item.align"
        show-overflow-tooltip
        v-bind="{ ...item }">
        <template #header>
          <FilterDropdown
            @change="filterList"
            v-model="state.tableType"
            :list="state.tableTypeList"
            :name="item.label"
            v-if="item.prop === 'type'" />
          <FilterDropdown
            @change="filterList"
            v-model="state.refreshType"
            :list="state.refreshTypeList"
            :name="item.label"
            v-else-if="item.prop === 'refreshType'" />
          <template v-else-if="item.prop === 'dataCount'">
            <span class="mr5"> {{ item.label }} </span>
            <el-tooltip
              :content="$t('dataManagement.customTable.dataCountMaxTip')">
              <svg-icon name="help2" class="c86919d" />
            </el-tooltip>
          </template>
          <template v-else>{{ item.label }}</template>
        </template>
        <template #default="{ row }">
          <span v-if="item.prop === 'type'">
            {{
              row.type === 0
                ? $t('dataManagement.customTable.middleTable')
                : $t('dataManagement.customTable.externalTable')
            }}
          </span>
          <div class="flex-center" v-else-if="item.prop === 'associationAttr'">
            <el-button
              @click="showAssociationAttr(row)"
              class="p0 nd-operate-btn-active fz28"
              text
              type="primary">
              <SvgIcon name="config1" />
            </el-button>
            <span :class="[row.relationFieldTotal === 0 && 'cff9f24', 'ml5 ']">
              {{
                row.relationFieldTotal === 0
                  ? $t('dataManagement.notConfigured')
                  : row.relationFieldTotal
              }}
            </span>
          </div>

          <span v-else-if="item.prop === 'refreshType'">
            {{
              row.refreshType === 1
                ? $t('dataManagement.customTable.automaticUpdate')
                : $t('dataManagement.customTable.manualUpdate')
            }}
          </span>
          <span v-else-if="item.prop === 'dataUpdateStatus'">
            <span v-if="row.dataUpdateStatus === 1" class="success-status">
              {{ $t('dataManagement.customTable.updated') }}
            </span>
            <span v-if="row.dataUpdateStatus === 2" class="fail-status">
              {{ $t('dataManagement.customTable.updateFailed') }}
              <el-popover
                width="400"
                popper-class="custom-popover"
                trigger="click"
                v-model:visible="row.popoverVis">
                <div>
                  <div class="custom-popover__container">
                    <div class="custom-popover__title fz16">
                      {{ $t('dataManagement.customTable.detail') }}
                      <el-icon @click="row.popoverVis = false">
                        <Close />
                      </el-icon>
                    </div>
                    <div class="custom-popover__body">
                      {{ row.failureReason }}
                    </div>
                  </div>
                </div>
                <template #reference>
                  <el-link type="primary" :underline="false" class="ml3">
                    {{ $t('dataManagement.customTable.detail') }}
                  </el-link>
                </template>
              </el-popover>
            </span>
          </span>
          <div v-else-if="item.prop === 'reports'">
            <ReportNum :row="row[item.prop]">
              {{ row[item.prop].length }}
            </ReportNum>
          </div>
          <div
            class="eas-table-operation"
            v-else-if="item.prop === 'operation'">
            <Auth :value="authEnum.add">
              <el-button
                text
                type="primary"
                class="is-normal-button"
                @click="handleAddData(row)">
                {{ $t('btn.add') }}
              </el-button>
            </Auth>
            <Auth :value="authEnum.upd">
              <template #default>
                <el-button
                  text
                  type="primary"
                  class="is-normal-button"
                  @click="handleEdit(row)">
                  {{ $t('dataManagement.customTable.update') }}
                </el-button>
              </template>
            </Auth>
            <Auth :value="authEnum.refresh" v-if="row.type === 0">
              <template #default>
                <el-button
                  text
                  type="primary"
                  class="is-normal-button"
                  @click="handleRefresh(row)">
                  {{ $t('btn.refresh') }}
                </el-button>
              </template>
            </Auth>

            <Auth :value="authEnum.del">
              <template #default>
                <el-button
                  text
                  type="primary"
                  class="is-normal-button"
                  @click="handleDelete(row)">
                  {{ $t('btn.delete') }}
                </el-button>
              </template>
            </Auth>
          </div>
          <template v-else> {{ row[item.prop]?.toLocaleString() }}</template>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增、编辑中间表 -->
    <component
      :is="state.tableComponent"
      :ref="(ref) => (state.tableRef = ref)"
      @getList="getList" />

    <!-- 添加数据 -->
    <component
      :is="state.addDataComponent"
      :ref="(ref) => (state.addTableDataRef = ref)"
      @getList="getList" />

    <!-- 二次确认框 -->
    <TipDialog
      iconType="3"
      btnSwap
      v-model="state.tipDialog"
      :title="state.tipOption.title"
      @submit="confirmSubmit"
      :loading="state.tipLoading">
      <span style="word-break: break-all">{{ state.tipOption.content }}</span>
    </TipDialog>
  </CommonLayout>
  <ConfigureAssociationAttr
    @getList="getList"
    ref="configureAssociationAttrRef" />
</template>

<script setup>
import { ArrowDown, Close } from '@element-plus/icons-vue'
import { ref, markRaw, nextTick, onMounted, reactive } from 'vue'
import MiddleTable from './middle-table/index.vue'
import ExternalTable from './external-table/index.vue'
import ExternalTableAddData from './external-table/AddData.vue'
import MiddleTableAddData from './middle-table/AddData.vue'
import ConfigureAssociationAttr from './components/ConfigureAssociationAttr.vue'
import {
  getCustomTableList,
  getCustomTableCount,
  refreshCustomTable,
  deleteCustomTable,
} from '@/api/modules/custom-table'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { authEnum, operateAuth } from './enum.js'
import { recordBehavior } from '@/utils/record-behavior.js'
import ReportNum from '@/views/user/components/ReportNum.vue'
import { t } from '@/locales/i18n'

recordBehavior({
  moduleName: '数据管理',
  submoduleName: '自定义表',
  operate: '进入页面',
})

const configureAssociationAttrRef = ref(null)
const state = reactive({
  tableTypeList: [
    {
      value: 0,
      label: t('dataManagement.customTable.middleTable'),
      tip: t('dataManagement.customTable.middleTableTip'),
      type: 0,
    },
    {
      type: 1,
      value: 1,
      label: t('dataManagement.customTable.externalTable'),
      tip: t('dataManagement.customTable.externalTableTip'),
    },
  ],
  refreshTypeList: [
    {
      label: t('dataManagement.customTable.manualUpdate'),
      type: 0,
    },
    {
      type: 1,
      label: t('dataManagement.customTable.automaticUpdate'),
    },
  ],
  refreshType: '',
  tableType: '',
  pagedData: [],
  pageAllData: [],
  tipDialog: false,
  tipOption: {},
  tipLoading: false,
  addDataComponent: null,
  addTableDataRef: null,
  tableComponent: null,
  tableRef: null,
  customCountInfo: {},
  loading: false,
  editInfo: {},
})

const columns = [
  {
    prop: 'name',
    label: t('common.name'),
  },
  {
    prop: 'tbName',
    label: t('dataManagement.customTable.tableName'),
  },
  {
    prop: 'associationAttr',
    label: t('dataManagement.customTable.relatedAttributes'),
    width: 150,
  },
  {
    prop: 'type',
    label: t('common.type'),
    width: 120,
  },
  {
    prop: 'description',
    label: t('common.remark'),
  },
  {
    prop: 'createByName',
    label: t('common.createBy'),
    width: 100,
  },
  {
    prop: 'updateByName',
    label: t('common.updateBy'),
    width: 100,
  },

  {
    prop: 'refreshType',
    label: t('dataManagement.customTable.dataUpdateMethod'),
    width: 150,
  },
  {
    prop: 'dataUpdateStatus',
    label: t('dataManagement.customTable.dataUpdateStatus'),
    width: 140,
  },
  {
    prop: 'dataUpdateTime',
    label: t('dataManagement.customTable.dataUpdateTime'),
    width: 180,
  },
  {
    prop: 'dataCount',
    label: t('dataManagement.customTable.dataVolume'),
    width: 120,
    align: 'right',
  },
  {
    label: t('dataManagement.customTable.applyReportsNum'),
    prop: 'reports',
    notshowTip: true,
    sortable: 'custom',
    align: 'right',
  },
  {
    prop: 'operation',
    label: t('common.operate'),
    width: 220,
    operate: true,
    fixed: 'right',
  },
].filter((item) => {
  if (operateAuth && item.operate) {
    return false
  }
  return true
})

/**
 * @description: 获取自定义表的列表
 * @return {*}
 */
const getList = () => {
  state.loading = true
  getCustomTableList()
    .then((res) => {
      state.pagedData = res.data
      state.pageAllData = res.data
    })
    .finally(() => {
      state.loading = false
    })
  getCustomTableCount().then((res) => {
    state.customCountInfo = res.data
  })
}

/**
 * @description: 筛选列表
 * @return {*}
 */
const filterList = () => {
  state.pagedData = state.pageAllData.filter((item) => {
    let typeFlag = true
    let refreshFlag = true
    if (state.tableType !== '' && item.type !== state.tableType) {
      typeFlag = false
    }
    if (state.refreshType !== '' && item.refreshType !== state.refreshType) {
      refreshFlag = false
    }
    return typeFlag && refreshFlag
  })
}

onMounted(() => {
  getList()
})

/**
 * @description: 新增
 * @return {*}
 * @param {*} type
 */
const addCommand = (type) => {
  state.tableComponent =
    type === 0 ? markRaw(MiddleTable) : markRaw(ExternalTable)
  nextTick(() => {
    state.tableRef.open()
  })
}

/**
 * @description: 添加数据
 * @return {*}
 */
const router = useRouter()
const handleAddData = (row) => {
  state.addDataComponent =
    row.type === 0 ? markRaw(MiddleTableAddData) : markRaw(ExternalTableAddData)
  nextTick(() => {
    state.addTableDataRef.open(row)
  })
}

/**
 * @description: 编辑
 * @return {*}
 */
const handleEdit = (row) => {
  state.tableComponent =
    row.type === 0 ? markRaw(MiddleTable) : markRaw(ExternalTable)
  nextTick(() => {
    state.tableRef.handleEdit(row)
  })
}

/**
 * @description: 更新自定义表
 * @return {*}
 */
const handleRefresh = (row) => {
  state.tipDialog = true
  const tips = {
    title: '提示',
    content:
      row.changeType === 1
        ? t('dataManagement.customTable.middleIncrementTip')
        : t('dataManagement.customTable.middleCoverTip'),
  }
  state.tipOption = tips
  state.editInfo = {
    row,
    type: 'refresh',
  }
}

/**
 * @description: 删除自定义表
 * @return {*}
 */
const handleDelete = (row) => {
  state.tipDialog = true
  const tips = {
    title: t('common.tip'),
    content: t('dataManagement.customTable.confirmDeleteCustomTable', [
      row.tbName,
    ]),
  }
  state.tipOption = tips
  state.editInfo = {
    row,
    type: 'delete',
  }
}

/**
 * @description: 确认更新自定义表、确认删除自定义表
 * @return {*}
 */
const confirmSubmit = async () => {
  const requestMethod =
    state.editInfo.type === 'refresh' ? refreshCustomTable : deleteCustomTable
  state.tipLoading = true
  try {
    const { code } = await requestMethod({ id: state.editInfo.row.id })
    if (code === 200) {
      const message =
        state.editInfo.type === 'refresh'
          ? t('dataManagement.customTable.dataUpdateSuccessfully')
          : t('common.deleteSuccessfully')
      ElMessage.success(message)
      state.tipDialog = false
      getList()
      state.tipLoading = false
    }
  } catch (error) {
    if (state.editInfo.type === 'refresh') getList()
    state.tipDialog = false
    state.tipLoading = false
  }
}

const showAssociationAttr = (row) => {
  configureAssociationAttrRef.value.open(row)
}
</script>

<style lang="scss" scoped>
:deep() {
  .custom-popover {
    &__container {
      padding: 0 14px;
    }
    &__title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: bold;
      i {
        font-size: var(--el-font-size-extra-large);
        cursor: pointer;
      }
    }
    &__body {
      margin: 30px 0;
    }
  }
}
</style>
