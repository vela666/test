<script setup>
import { nextTick, onMounted, reactive, ref, watch } from 'vue'
import { thousandQuantileProcessing } from '@/utils/dataProcessing'
import AddReportDialog from '@/components/AddReportDialog/index.vue'
import EditReportDialog from './components/EditReportDialog.vue'
import AddReportTagDialog from './components/AddReportTagDialog.vue'
import DashboardDropdown from './components/DashboardDropdown.vue'
import OperateLog from '@/components/OperateLog/index.vue'
import AddToDashboardDrawer from './components/AddToDashboardDrawer.vue'
import { operationLogInfo } from '@/api/modules/analysis/index'
import {
  getDataTypeList,
  reportTypeList,
  reportTypeObjListMap,
} from '@/enumeration/report.js'
import {
  getReportList,
  getReportLabelName,
  reportDelete,
} from '@/api/modules/analysis/report'
import { cloneDeep, debounce } from 'lodash-es'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useTipModal } from '@/components/TipDialog'
import useUserStore from '@/store/modules/user'
import { authEnum, authEnumDesc } from './enum.js'
const userStore = useUserStore()
import { recordBehavior } from '@/utils/record-behavior.js'
import { t } from '@/locales/i18n'

const router = useRouter()

const createTypeEnum = {
  0: t('analysis.report.createManually'),
  1: t('analysis.report.dashboardCopy'),
}
const addReportDialogRef = ref(null)
const state = reactive({
  formData: {
    reportName: '',
    dataType: 2,
    labelNameList: [],
    sort: [],
    sortFiled: [],
    reportType: null,
  },
  dataTypeList: getDataTypeList(),
  labelList: [],
  columns: [
    {
      label: t('dashboard.reportName'),
      prop: 'reportName',
      notshowTip: true,
      sortable: 'custom',
    },
    {
      label: t('common.type'),
      prop: 'reportType',
      notshowTip: true,
      list: reportTypeList,
      filterKey: 'reportType',
    },
    {
      label: t('analysis.report.tag'),
      prop: 'labelListStr',
      notshowTip: true,
    },
    {
      label: t('analysis.report.creationMethod'),
      prop: 'createType',
      notshowTip: true,
    },
    {
      label: t('analysis.report.numberOfAppDashboard'),
      prop: 'dashboardCount',
      notshowTip: true,
      sortable: 'custom',
    },
    { label: t('common.createBy'), prop: 'creator', notshowTip: true },
    {
      label: t('common.createTime'),
      prop: 'createTime',
      notshowTip: true,
      sortable: 'custom',
      minWidth: '90px',
    },
    { label: t('common.updateBy'), prop: 'updateUserName', notshowTip: true },
    {
      label: t('common.updateTime'),
      prop: 'baseInfoUpdateTime',
      notshowTip: true,
      sortable: 'custom',
      minWidth: '90px',
    },
    {
      label: t('analysis.report.operationPermission'),
      prop: 'authority',
      notshowTip: true,
    },
    { label: t('common.remark'), prop: 'reportDesc', notshowTip: true },
    {
      label: t('common.operate'),
      notshowTip: true,
      operate: true,
      fixed: 'right',
    },
  ],
  btns: [
    {
      type: 'addBoard',
      label: t('analysis.report.addToDashboard'),
    },
    {
      type: 'addTag',
      label: t('analysis.report.addTag'),
    },
    {
      type: 'delete',
      label: authEnumDesc.delReport,
    },
    {
      type: 'operateLog',
      label: t('common.operationLog'),
    },
  ].filter((item) => {
    if (item.type === 'addTag' && !authEnum.addLabel) {
      return false
    }

    if (item.type === 'delete' && !authEnum.delReport) {
      return false
    }

    return true
  }),
  tableData: [],
  selecteData: [],
  selecteTableData: [],
  layout: {
    // 分页器配置
    page: 1, // 当前页码
    size: 20, // 每页数量
    total: 0,
  },
  operateLogData: [],
  loading: false,
  editVisible: false,
  addTagVisible: false,
  operateLogVisible: false,
  addToDashboardVisible: false,
})

recordBehavior({
  moduleName: '数据报表',
  submoduleName: '数据报表',
  operate: '进入页面',
})
onMounted(() => {
  getReportLabel()
  handleGetSearch()
})

watch(
  () => state.formData.reportType,
  () => {
    handleGetSearch()
  },
  {
    deep: true,
  }
)

/**
 * @description 查询标签列表
 */
const getReportLabel = async () => {
  state.labelList.splice(0, state.labelList.lenght)
  const res = await getReportLabelName()
  if (res && res.code === 200) {
    state.labelList = res.data
  }
}

/**
 * @description 分页查询
 */
const getList = () => {
  handleGetSearch('page')
}

/**
 * @description 查询报表列表
 */
const handleGetSearch = debounce(async (type) => {
  try {
    if (type !== 'page') {
      state.layout.page = 1
    }
    const params = {
      dataType: state.formData.dataType,
      labelNameList: state.formData.labelNameList,
      reportName: state.formData.reportName,
      page: state.layout.page,
      size: state.layout.size,
      sortTypeList: state.formData.sort,
      sortFieldList: state.formData.sortFiled,
      reportType: state.formData.reportType,
    }
    state.loading = true
    const res = await getReportList(params)
    if (res && res.code === 200) {
      state.tableData = res.data?.list || []
      state.layout.total = res.data?.page?.totalCount || 0
    }
  } catch (error) {
    state.tableData.splice(0, state.tableData.length)
    state.layout.total = 0
  } finally {
    state.loading = false
  }
}, 300)

/**
 * @description 表格选中赋值
 */
const changeSelection = (val) => {
  state.selecteData = val
}

/**
 * @description 表格排序
 */
const changeTableSort = ({ column, prop, order }) => {
  state.formData.sort = [order === 'ascending' ? 'asc' : !order ? '' : 'desc']
  state.formData.sortFiled = [order ? prop : '']
  handleGetSearch()
}

// 跳转到对应报表
const goToAnalysis = (row) => {
  if (!sessionStorage.getItem('appId')) return
  const { reportId, reportType } = row
  const found = reportTypeObjListMap[reportType]
  if (found) {
    const { path } = found
    const routeUrl = router.resolve({
      path,
      query: { id: reportId, virtualAppId: sessionStorage.getItem('appId') },
    })
    window.open(routeUrl.href, '_blank')
  }
}

/**
 * @description 新建报表弹框
 */
const handleAddDialog = () => {
  addReportDialogRef.value.open()
}

/**
 * @description 批量添加标签弹框
 */
const handleAddTag = () => {
  state.selecteTableData = cloneDeep(state.selecteData)
  state.addTagVisible = true
}

/**
 * @description 单个添加标签弹框
 */
const handleAddTagDialog = (row) => {
  state.selecteTableData = [row]
  state.addTagVisible = true
}

/**
 * @description 关闭标签弹框
 */
const handleCloseTagDialog = (type) => {
  state.selecteTableData = []
  if (type !== 'close') {
    handleGetSearch()
  }
}

/**
 * @description 关闭添加至看板弹框
 */
const handleCloseAddDashboardDialog = (type) => {
  state.checkRow = {}
  if (type !== 'close') {
    handleGetSearch()
  }
}

/**
 * @description 添加至看板
 */
const handleAddToDashboard = (row) => {
  state.addToDashboardVisible = true
  state.checkRow = row
}

/**
 * @description 编辑报表弹框
 */
const handleOpenEditDialog = (row) => {
  state.editVisible = true
  state.checkRow = row
}

/**
 * @description 关闭编辑报表弹框
 */
const handleCloseEditDialog = (type) => {
  state.checkRow = {}
  if (type !== 'close') {
    handleGetSearch()
  }
}

/**
 * @description 批量删除报表弹框
 */
const handleBatchDelDialog = async () => {
  try {
    const list = cloneDeep(state.selecteData)
    let content = t('analysis.report.sureDeleteReportMsg')
    if (list.some((e) => e.dashboardCount > 0)) {
      content = t('analysis.report.sureDeleteDashboardReportMsg', [
        list
          .filter((e) => e.dashboardCount > 0)
          .map((e) => e.reportName)
          .join('、'),
      ])
    }
    await useTipModal({
      content,
      iconType: 3,
      needLoading: false,
      btnSwap: true,
      title: t('analysis.report.batchDelete'),
    })
    state.loading = true

    const res = await reportDelete({
      businessIds: list.map((e) => e.businessId),
    })
    if (res && res.code === 200) {
      ElMessage.success(res.data)
      handleGetSearch()
    }
  } catch (e) {
    console.log(e)
  } finally {
    state.loading = false
  }
}

/**
 * @description 删除报表弹框
 */
const handleDeleteDialog = async (row) => {
  try {
    let content = t('analysis.report.sureDeleteReportTitledMsg', [
      row.reportName,
    ])
    if (row.dashboardCount > 0) {
      content = t('analysis.report.sureDeleteDashboardReportTitledMsg', [
        row.reportName,
        row.dashboardCount,
      ])
    }
    await useTipModal({
      content,
      iconType: 3,
      needLoading: false,
      btnSwap: true,
      title: t('btn.delete'),
    })
    state.loading = true
    const res = await reportDelete({ businessIds: [row.businessId] })
    if (res && res.code === 200) {
      ElMessage.success(
        t('analysis.report.reportTitledDelete', [row.reportName])
      )
      handleGetSearch()
    }
  } catch (e) {
    console.log(e)
  } finally {
    state.loading = false
  }
}

/**
 * @description 打开操作日志
 */
const handleOpenOperateLog = (row) => {
  const params = {
    businessId: row.businessId,
    logModuleType: 3,
  }
  state.loading = true
  operationLogInfo(params)
    .then((res) => {
      if (res && res.code === 200) {
        state.operateLogData = res.data
        state.operateLogVisible = true
      }
    })
    .finally(() => {
      state.loading = false
    })
}

/**
 * @description 更多按钮操作
 */
const handleMoreBtn = (type, row) => {
  if (type === 'addBoard') {
    //添加至看板
    handleAddToDashboard(row)
  } else if (type === 'addTag') {
    //添加标签
    handleAddTagDialog(row)
  } else if (type === 'operateLog') {
    //操作日志
    handleOpenOperateLog(row)
  } else if (type === 'delete') {
    //删除
    handleDeleteDialog(row)
  }
}

const filterBtn = (row) => {
  return state.btns.filter((val) => {
    // 是路径分析
    if (val.type === 'addBoard' && row.reportType === 5) {
      return false
    }
    return true
  })
}

defineOptions({
  name: 'report',
})
</script>
<template>
  <CommonLayout>
    <template #hl>
      <CommonInput
        v-model.trim="state.formData.reportName"
        :desc="$t('analysis.report.searchReportName')"
        class="w220"
        notTrimSpace
        @input="handleGetSearch" />
      <el-select
        v-model="state.formData.dataType"
        :placeholder="$t('analysis.report.reportSource')"
        @change="handleGetSearch"
        class="w180">
        <el-option
          v-for="item in state.dataTypeList"
          :key="item.type"
          :label="item.label"
          :value="item.type" />
      </el-select>
      <LabelSelect
        class="mr10"
        style="width: 180px"
        :options="state.labelList"
        v-model="state.formData.labelNameList"
        @change="handleGetSearch"
        @visible-change="getReportLabel" />
    </template>
    <template #hr>
      <Auth :value="authEnum.addLabel">
        <template #default="{ title }">
          <el-button
            :disabled="!state.selecteData.length"
            @click="handleAddTag">
            <SvgIcon name="add-tag" class="fz16 mr3" />
            {{ title }}
          </el-button>
        </template>
      </Auth>
      <Auth :value="authEnum.delReport">
        <el-button
          :disabled="!state.selecteData.length"
          class="m0"
          @click="handleBatchDelDialog">
          <SvgIcon name="delete1" class="fz16 mr3" />
          {{ $t('analysis.report.batchDelete') }}
        </el-button>
      </Auth>
      <el-button type="primary" class="m0" @click="handleAddDialog">
        <SvgIcon name="add1" class="fz16 mr3" />
        {{ $t('dashboard.createReport') }}
      </el-button>
    </template>
    <el-table
      v-loading="state.loading"
      class="nd-table-custom"
      :data="state.tableData"
      border
      ref="tableRef"
      row-key="reportId"
      @selection-change="changeSelection"
      @sort-change="changeTableSort">
      <el-table-column type="selection" width="55" />
      <el-table-column
        v-for="(column, index) of state.columns.filter(
          (item) =>
            (!['creator	', 'authority', 'createTime'].includes(item.prop) &&
              state.formData.dataType === 1) ||
            (!['creator	', 'authority'].includes(item.prop) &&
              state.formData.dataType === 2) ||
            (!['createTime'].includes(item.prop) &&
              state.formData.dataType === 3)
        )"
        :prop="column.prop"
        :key="index"
        :label="column.label"
        :show-overflow-tooltip="!column.notshowTip"
        :sortable="column.sortable"
        :fixed="column.fixed"
        :min-width="column.minWidth">
        <template #header v-if="column.filterKey">
          <FilterDropdown
            v-model="state.formData.reportType"
            :list="column.list"
            :name="column.label" />
        </template>
        <template #default="{ row }">
          <template v-if="column.prop === 'reportName'">
            <div
              v-showTips
              class="c-pointer c5473e8"
              @click="goToAnalysis(row)">
              {{ row.reportName }}
            </div>
          </template>
          <template v-else-if="column.prop === 'reportType'">
            {{
              column.list.filter((item) => item.type === row[column.prop])[0]
                .label
            }}
          </template>
          <template v-else-if="column.prop === 'createType'">
            {{ createTypeEnum[row[column.prop]] }}
          </template>
          <template v-else-if="column.prop === 'dashboardCount'">
            <DashboardDropdown
              :count="row[column.prop]"
              :list="row.dashboardItemVoList" />
          </template>
          <template
            v-else-if="
              column.prop === 'labelListStr' || column.prop === 'reportDesc'
            ">
            <div v-showTips>
              {{ row[column.prop] }}
            </div>
          </template>
          <template v-else-if="column.prop === 'authority'">
            <div>
              {{
                row[column.prop] === 1
                  ? $t('dashboard.viewer')
                  : $t('dashboard.collaborator')
              }}
            </div>
          </template>
          <div class="flex-center" v-else-if="column.operate">
            <el-button
              :disabled="row.authority === 1"
              @click="handleOpenEditDialog(row)"
              type="primary"
              text
              class="p0 mr10">
              {{ $t('btn.edit') }}
            </el-button>
            <DropDownItemSelection trigger="hover">
              <el-button text type="primary">{{ $t('btn.more') }}</el-button>
              <template #content>
                <template v-for="item of filterBtn(row)" :key="item.type">
                  <el-dropdown-item
                    :disabled="
                      (item.type === 'delete' &&
                        row.creatorUserId !==
                          String(userStore.userInfo.userId) &&
                        row.authority === 1) ||
                      (item.type !== 'operateLog' && row.authority === 1)
                    "
                    @click="handleMoreBtn(item.type, row)">
                    {{ item.label }}
                  </el-dropdown-item>
                </template>
              </template>
            </DropDownItemSelection>
          </div>
          <template v-else>
            {{
              thousandQuantileProcessing(
                row[column.prop],
                column.prop === 'eventCount'
              )
            }}
          </template>
        </template>
      </el-table-column>
    </el-table>

    <template #footer>
      <Pagination
        v-model:limit="state.layout.size"
        v-model:page="state.layout.page"
        :total="state.layout.total"
        @getData="getList" />
    </template>
    <!-- 新建报表 -->
    <AddReportDialog
      :moduleName="$t('dashboard.dataReport')"
      ref="addReportDialogRef" />
    <!-- 编辑报表 -->
    <EditReportDialog
      v-model="state.editVisible"
      :row="state.checkRow"
      @close="handleCloseEditDialog"></EditReportDialog>
    <!-- 添加标签 -->
    <AddReportTagDialog
      v-model="state.addTagVisible"
      v-model:list="state.selecteTableData"
      :labelList="state.labelList"
      @close="handleCloseTagDialog"
      @visible-label="getReportLabel"></AddReportTagDialog>
    <!-- 日志 -->
    <OperateLog
      :data="state.operateLogData"
      v-model="state.operateLogVisible" />
    <!-- 添加至看板 -->
    <AddToDashboardDrawer
      v-model="state.addToDashboardVisible"
      :row="state.checkRow"
      @close="handleCloseAddDashboardDialog"></AddToDashboardDrawer>
  </CommonLayout>
</template>
<style lang="scss" scoped>
.report {
  background: white;
}
</style>
