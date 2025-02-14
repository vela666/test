<script setup>
import { ref, watch, computed, onMounted, markRaw } from 'vue'
import copyText from '@/utils/clipboard'
import { useRoute, useRouter } from 'vue-router'
import {
  getReportDetail,
  eventAnalysisAsynExport,
  asyncExportUserPropertyExport,
  getFieldList,
} from '@/api/modules/analysis/common'
import SvgButton from './SvgButton.vue'
import { getDataTypeList, reportTypeListMap } from '@/enumeration/report'
import {
  getReportList,
  getReportLabelName,
} from '@/api/modules/analysis/report'
import { debounce } from 'lodash-es'
import { Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import authEnum from '@/views/analysis/enum.js'
import { recordBehavior } from '@/utils/record-behavior.js'
import { tableTypeArr } from '@/enumeration'
import { t } from '@/locales/i18n'

const asynExportApiDict = markRaw({
  1: eventAnalysisAsynExport,
  4: asyncExportUserPropertyExport,
})

const props = defineProps({
  title: {
    type: String,
    default: t('analysis.analysisIndicators'),
  },
  titleTip: {
    type: String,
    default: '',
  },
  // 左侧默认展示
  left: {
    type: Boolean,
    default: true,
  },
  // 分析类型
  reportType: {
    type: Number,
    default: null,
  },
  sqlContent: {
    type: String,
    default: '',
  },
  approxVal: {
    type: Number,
    default: 2,
  },
  approxable: {
    type: Boolean,
    default: true,
  },
  reportInfo: {
    type: Object,
    default: () => {},
  },
  timeZone: {
    type: [String, Number],
    default: '8',
  },
  asyncExport: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'reportDetail',
  'refresh',
  'update:approxVal',
  'approxChange',
  'update:reportInfo',
  'timeZoneChange',
  'calcute',
  'exportData',
])
const dragConfig = { min: 600, max: 800 }
const layoutRightWidth = `calc(100% - ${dragConfig.min + 4}px)`
const layoutLeftWidth = `${dragConfig.min}px`
const analysisLeft = ref(null)
const analysisRight = ref(null)
const approx = computed({
  get() {
    return props.approxVal
  },
  set(value) {
    emit('update:approxVal', value)
  },
})

const copySql = (event) => {
  if (!props.sqlContent) return
  copyText(props.sqlContent, event)
}

const visible = ref(false)
const options = ref([])
const dataTypeOptios = ref(getDataTypeList())

const reportName = ref('')
const dataType = ref(2)
const labelNameList = ref([])
// 拖拽条按下
let dragBarParams = {}
const dragBarDown = (e) => {
  e.preventDefault && e.preventDefault()
  e.target.classList.add('drag-bar')
  dragBarParams.target = e.target
  dragBarParams.startX = e.clientX
  dragBarParams.curLen = analysisLeft.value.clientWidth
  document.addEventListener('mousemove', dragBarMove)
  document.addEventListener('mouseup', dragBarUp)
}
// 拖拽条抬起
const dragBarUp = () => {
  dragBarParams.target.classList.remove('drag-bar')
  document.removeEventListener('mousemove', dragBarMove)
  document.removeEventListener('mouseup', dragBarUp)
}
// 拖拽条移动
const dragBarMove = (e) => {
  const endX = e.clientX
  const moveLen = endX - dragBarParams.startX
  let curBoxLen = dragBarParams.curLen + moveLen
  curBoxLen =
    curBoxLen > dragConfig.max
      ? dragConfig.max
      : curBoxLen < dragConfig.min
        ? dragConfig.min
        : curBoxLen
  analysisLeft.value.style.width = curBoxLen + 'px'
  analysisRight.value.style.width = `calc(100% - ${curBoxLen + 4}px)`
}
const showLeft = ref(true)
const foldLeft = () => (showLeft.value = !showLeft.value)

// 分页设置
const pageConfig = ref({
  page: 1, // 当前页码
  size: 20, // 每页数量
  total: 0,
})

const reportList = ref([])

const route = useRoute()

const router = useRouter()

const detailInfo = ref({})
/**
 * @description: 获取报表详情
 * @return {*}
 */
const getDetail = (id) => {
  getReportDetail({ reportId: id }).then(async (res) => {
    try {
      // 更新 分组项 属性的（多语言）显示名
      const res2 = await getFieldList({ eventIds: null })
      const qp = JSON.parse(res.data.qp)
      if (qp.groupBy && qp.groupBy.length) {
        qp.groupBy.forEach((item, index) => {
          const label = tableTypeArr[item.tableType]
          const data = res2.data[label]
          if (Array.isArray(data)) {
            let temp = null
            if (label === 'customTableList') {
              const customRes = data.find((e) => e.fEn === item.customTableName)
              temp = (
                Array.isArray(customRes?.fieldInfoList)
                  ? customRes.fieldInfoList
                  : []
              ).find((e) => e.fEn === item.propertyName)
            } else {
              temp = data.find((e) => e.fEn === item.propertyName)
            }
            if (temp) {
              qp.groupBy[index].propertyNameDisplay = temp.fZh
            }
          }
        })
      }
      res.data.qp = JSON.stringify(qp)
    } catch (error) {}

    detailInfo.value = res.data
    emit('update:reportInfo', res.data)
    emit('reportDetail', res.data)
  })
}

/**
 * @description 加载报表
 */
const useReport = (data) => {
  visible.value = false
  recordBehavior({
    moduleName: '分析',
    submoduleName: reportTypeListMap[props.reportType],
    operate: '使用已有报表',
  })
  router.push(`${route.path}?id=${data.reportId}`)
  getDetail(data.reportId)
}

watch(
  () => props.reportInfo,
  (val) => {
    if (val) {
      detailInfo.value = {
        ...detailInfo.value,
        ...val,
      }
    }
  }
)

const showSqlContent = computed({
  get() {
    return props.sqlContent
  },
  set(value) {},
})

onMounted(() => {
  getReportLabel()
  if (route?.query?.id) getDetail(route.query.id)
})

/**
 * @description 查询标签列表
 */
const getReportLabel = () => {
  getReportLabelName().then((res) => {
    if (res && res.code === 200) {
      options.value = res.data
    }
  })
}

/**
 * @description 查询报表列表
 */
const handleGetSearch = debounce(async (type) => {
  try {
    if (!type) {
      reportName.value = ''
      labelNameList.value = []
      dataType.value = 2
    }
    if (type !== 'page') {
      pageConfig.value.page = 1
    }
    const params = {
      dataType: dataType.value,
      labelNameList: labelNameList.value,
      reportName: reportName.value,
      page: pageConfig.value.page,
      size: pageConfig.value.size,
      reportType: props.reportType,
    }
    const res = await getReportList(params)
    if (res && res.code === 200) {
      reportList.value = res.data?.list || []
      pageConfig.value.total = res.data?.page?.totalCount || 0
    }
  } catch (error) {
    reportList.value.splice(0, reportList.value.length)
    pageConfig.value.total = 0
  }
}, 300)

/**
 * @description 分页查询
 */
const getList = () => {
  handleGetSearch('page')
}

// 跳转到SQL查询
const goToSqlSearch = () => {
  const routeUrl = router.resolve({
    path: `/analysis/sqlquery?virtualAppId=${sessionStorage.getItem('appId')}`,
  })
  window.open(routeUrl.href, '_blank')
}

const handleChange = (type, val) => {
  if (type === 'approx') {
    emit('approxChange', val)
  } else if (type === 'timeZone') {
    emit('timeZoneChange', val)
  } else {
    emit('refresh')
  }

  if (!props.sqlContent) return

  emit('calcute', type, val)
}

const asyncLoading = ref(false)

// 异步导出请求
const asyncExportRequest = debounce(async (data) => {
  const asynExportApi = asynExportApiDict[props?.reportType]
  if (!props.reportType || !data || !asynExportApi) return
  try {
    const res = await asynExportApi({
      exportType: props.reportType,
      businessId: props?.reportInfo?.businessId || undefined,
      ...data,
    })
    asyncLoading.value = true
    if (res.code === 200) {
      ElMessage.success(t('analysis.asyncExportMsg'))
    }
    asyncLoading.value = false
  } catch (error) {
    asyncLoading.value = false
    console.log(error)
  }
}, 300)

//异步导出
const asyncExportClick = () => {
  recordBehavior({
    moduleName: '分析',
    submoduleName: reportTypeListMap[props.reportType],
    operate: '异步导出',
  })
  emit('exportData', asyncExportRequest)
}

recordBehavior({
  moduleName: '分析',
  submoduleName: reportTypeListMap[props.reportType],
  operate: '进入页面',
})

defineOptions({
  name: 'AnalysisLayout',
})
</script>

<template>
  <CommonLayout class="is-analysis-layout">
    <div class="analysis-layout">
      <div v-if="left">
        <div v-show="showLeft" class="analysis-layout-left" ref="analysisLeft">
          <div class="analysis-layout-left__header">
            <div class="analysis-title">
              <svg-icon name="analysis-index" class="analysis-icon"></svg-icon>
              <div class="analysis-title__text">
                {{ title }}
                <el-tooltip v-if="titleTip" :content="titleTip" placement="top">
                  <el-icon><Warning /></el-icon>
                </el-tooltip>
              </div>
            </div>
            <div class="analysis-top-btn">
              <el-tooltip
                :content="$t('analysis.savedReports')"
                placement="top"
                :hide-after="0">
                <div
                  class="analysis-icon__btn"
                  @click="
                    () => {
                      visible = true
                      handleGetSearch()
                    }
                  ">
                  <svg-icon name="analysis-report"></svg-icon>
                </div>
              </el-tooltip>
              <div class="analysis-icon__btn" @click="foldLeft">
                <svg-icon name="menu-close"></svg-icon>
              </div>
            </div>
          </div>
          <div class="analysis-layout-left__body">
            <slot name="lb"></slot>
          </div>
        </div>
      </div>
      <div
        v-if="showLeft && left"
        class="analysis-layout-resizer"
        @mouseup="dragBarUp"
        @mousedown="dragBarDown"></div>
      <div
        :class="[
          'analysis-layout-right',
          { 'only-all-right': !showLeft || !left },
        ]"
        ref="analysisRight">
        <div class="analysis-layout-right__header">
          <div class="report-about">
            <div
              class="analysis-icon__btn rotate-icon mr5"
              @click="foldLeft"
              v-if="!showLeft && left">
              <svg-icon name="menu-close"></svg-icon>
            </div>
            <el-tooltip
              :content="detailInfo.name"
              v-if="detailInfo.name"
              placement="top">
              <el-text truncated class="report-about__title txt-bold">
                {{ detailInfo.name }}
              </el-text>
            </el-tooltip>
            <!-- <div
              class="report-about__title txt-bold"
              v-showTips
              v-if="detailInfo.name">
              {{ detailInfo.name }}
            </div> -->
            <div class="report-about__title" v-else-if="reportType === 7">
              <span class="txt-bold fz16">{{ title }}</span>
            </div>
            <el-tooltip
              v-if="titleTip && reportType === 7"
              :content="titleTip"
              placement="top">
              <el-icon class="fz16"><Warning /></el-icon>
            </el-tooltip>
            <!--            数据格式暂时不知道，以数据看板的数据格式为准-->
            <ReportCreator
              style="margin-left: 5px"
              :data="[
                {
                  name: detailInfo.created,
                  createTime: detailInfo.createTime,
                  modifier: detailInfo.modifier,
                  updateTime: detailInfo.updateTime,
                  authority: 3,
                },
              ]" />
          </div>
          <div class="analysis-operator">
            <!-- SQL查询头部右侧操作按钮 -->
            <div v-if="reportType === 7">
              <div class="analysis-top-btn">
                <el-button
                  @click="
                    () => {
                      visible = true
                      handleGetSearch()
                    }
                  ">
                  <svg-icon name="analysis-report" class="fz14 mr3"></svg-icon>
                  {{ $t('analysis.sqlquery.report') }}
                </el-button>
                <slot name="bt"></slot>
              </div>
            </div>
            <!-- 其它分析头部右侧操作按钮 -->
            <div class="flex" v-else>
              <div class="mr10" v-if="approxable">
                <span class="mr5 c616161">{{
                  $t('analysis.approximateCalculation')
                }}</span>
                <el-tooltip
                  :content="$t('common.refresh')"
                  placement="top"
                  :hide-after="0">
                  <template #content>
                    {{ $t('analysis.approximateCalculationTips') }}
                  </template>
                  <el-switch
                    v-model="approx"
                    :active-value="1"
                    :inactive-value="2"
                    @change="(val) => handleChange('approx', val)" />
                </el-tooltip>
              </div>
              <TimeZone @change="(val) => handleChange('timeZone', val)" />
              <el-tooltip
                :content="$t('common.refresh')"
                placement="top"
                :hide-after="0">
                <svg-button
                  class="btn-w32 ml10"
                  :disabled="!sqlContent"
                  icon="refresh"
                  @click="handleChange('refresh')"></svg-button>
              </el-tooltip>

              <el-tooltip
                v-if="authEnum[reportType].asyncExport && asyncExport"
                :content="$t('analysis.asyncExport')"
                placement="top"
                :hide-after="0">
                <svg-button
                  :class="['btn-w32', { 'disable-async': asyncLoading }]"
                  :disabled="!sqlContent"
                  icon="async-export"
                  @click="asyncExportClick"></svg-button>
              </el-tooltip>
              <Auth :value="authEnum[reportType].sql">
                <el-dropdown
                  popper-class="view-sql__dropdown"
                  trigger="click"
                  placement="bottom-end">
                  <div>
                    <el-tooltip
                      :content="$t('common.viewSQL')"
                      placement="top"
                      :hide-after="0">
                      <svg-button
                        class="ml10 btn-w32"
                        :disabled="!sqlContent"
                        icon="view-sql"></svg-button>
                    </el-tooltip>
                  </div>
                  <template #dropdown>
                    <div class="view-sql-box">
                      <div class="view-sql__title">
                        {{ $t('common.viewSQL') }}
                      </div>
                      <div class="view-sql__body">
                        <el-input
                          class="sql-content"
                          v-model="showSqlContent"
                          type="textarea"
                          readonly
                          resize="none" />
                      </div>
                      <div class="view-sql__footer">
                        <div class="view-sql__footer_tip">
                          <span style="white-space: pre">
                            {{ $t('analysis.appliedCopyCode') }}
                          </span>
                          <el-link type="primary" @click="goToSqlSearch">
                            {{ $t('analysis.sqlquery.sqlQuery') }}
                          </el-link>
                        </div>
                        <el-button
                          type="primary"
                          :disabled="!sqlContent"
                          @click="copySql($event)">
                          {{ $t('analysis.copyCode') }}
                        </el-button>
                      </div>
                    </div>
                  </template>
                </el-dropdown>
              </Auth>
            </div>
          </div>
        </div>
        <div class="analysis-layout-right__body">
          <slot name="rb"></slot>
        </div>
      </div>
    </div>
    <el-drawer
      v-model="visible"
      :size="900"
      ref="commonDrawerRef"
      append-to-body
      :close-on-press-escape="false"
      :close-on-click-modal="false"
      class="report-drawer"
      :title="`${$t('analysis.usingReport')} - ${reportTypeListMap[props.reportType]}`">
      <div class="report-view-box">
        <div class="mb20">
          <CommonInput
            v-model="reportName"
            style="width: 220px"
            :desc="$t('analysis.report.searchReportName')"
            class="mr10"
            @input="handleGetSearch" />
          <LabelSelect
            class="mr10"
            style="width: 180px"
            :options="options"
            v-model="labelNameList"
            @change="handleGetSearch" />
          <el-select
            v-model="dataType"
            style="width: 180px"
            @change="handleGetSearch">
            <el-option
              v-for="item in dataTypeOptios"
              :key="item.type"
              :label="item.label"
              :value="item.type" />
          </el-select>
        </div>
        <el-table
          class="nd-table-custom"
          border
          show-overflow-tooltip
          style="height: calc(100% - 52px)"
          :data="reportList">
          <el-table-column
            prop="reportName"
            :label="$t('dashboard.reportName')" />
          <el-table-column
            prop="labelListStr"
            :label="$t('analysis.report.tag')" />
          <el-table-column
            prop="dashboardCount"
            :label="$t('analysis.report.numberOfAppDashboard')">
            <template #default="scope">
              <div class="c5473e8">{{ scope.row.dashboardCount }}</div>
            </template>
          </el-table-column>
          <el-table-column
            prop="baseInfoUpdateTime"
            :label="$t('common.updateTime')" />
          <el-table-column prop="operate" :label="$t('common.operate')">
            <template #default="scope">
              <el-button type="primary" text @click="useReport(scope.row)">
                {{ $t('analysis.use') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <div class="report-view-footer">
          <Pagination
            v-model:limit="pageConfig.size"
            v-model:page="pageConfig.page"
            :total="pageConfig.total"
            @getData="getList" />
        </div>
      </template>
    </el-drawer>
  </CommonLayout>
</template>

<style scoped lang="scss">
%flex-center {
  display: flex;
  align-items: center;
}

%flex-center-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.w93 {
  width: 93px;
}

.btn-w32 {
  width: 32px;
  padding: 8px 0px;
}

.analysis-icon {
  width: 16px;
  height: 16px;
  margin-right: 4px;
}

.analysis-title {
  @extend %flex-center;
  color: var(--eas-text-color-primary);
  font-size: var(--eas-font-size-medium);
  font-weight: bold;
}

.analysis-top-btn {
  @extend %flex-center;
  color: var(--eas-text-color-light);
}

.common-layout.is-analysis-layout {
  :deep(.common-layout-container) {
    padding: 0px;
  }
}

.analysis-layout {
  width: 100%;
  height: 100%;
  display: flex;
}

.analysis-layout-left {
  width: v-bind(layoutLeftWidth);
  height: 100%;
  user-select: text;
}

.analysis-layout-left__header {
  width: 100%;
  height: 64px;
  padding: 0 20px;
  @extend %flex-center;
  justify-content: space-between;
}

.analysis-title__text {
  @extend %flex-center;

  line-height: 24px;

  > .el-icon {
    margin-left: 5px;
  }
}

.analysis-layout-left__body {
  width: 100%;
  height: calc(100% - 64px);
}

.analysis-layout-right {
  user-select: text;
  width: v-bind(layoutRightWidth);
  height: 100%;
}

.analysis-layout-right__header {
  width: 100%;
  height: 59px;
  padding: 0px 20px;
  @extend %flex-center;
  justify-content: space-between;
  border-bottom: 1px solid var(--eas-split-line-color);
}

.analysis-layout-right__body {
  width: 100%;
  height: calc(100% - 59px);
  overflow-y: auto;
}

.only-all-right {
  width: 100% !important;
}

.analysis-layout-resizer {
  position: relative;
  z-index: 100;
  width: 4px;
  height: 100%;
  background: transparent;
  background-color: #fff;
  border-left: 1px solid var(--eas-border-color);
  cursor: col-resize;
  transition: all 0.3s;

  &.drag-bar,
  &:hover {
    background-color: var(--eas-color-primary);
    border: 0;
  }
}

.analysis-layout-resizer-sql {
  position: relative;
  z-index: 100;
  width: 1px;
  height: 100%;
  background: transparent;
  background-color: #fff;
  border-left: 1px solid var(--eas-border-color);
}

.rotate-icon {
  transform: rotateY(180deg);
}

.report-about {
  @extend %flex-center-center;

  &__title {
    max-width: 178px;
    margin-right: 5px;
    font-size: var(--eas-font-size-base);
    color: var(--eas-text-color-2);
  }
}

.analysis-operator {
  @extend %flex-center-center;

  .el-button + .el-button {
    margin-left: 10px;
  }
}

.view-sql-box {
  width: 550px;
  height: 500px;
}

.view-sql__title {
  width: 100%;
  height: 62px;
  font-size: var(--eas-font-size-medium);
  font-weight: bold;
  color: #333;
  padding: 20px 0px 21px 32px;
}

.view-sql__body {
  width: 100%;
  height: calc(100% - 134px);
  padding: 10px 32px 0px 32px;

  .sql-content {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    :deep(.el-textarea__inner) {
      width: 100%;
      height: 100%;
      color: #333;
      line-height: 28px;
      background-color: var(--eas-hover-color);
      font-size: var(--eas-font-size-base);
      box-shadow: none;
    }
  }
}

.view-sql__footer {
  width: 100%;
  height: 72px;
  @extend %flex-center;
  justify-content: space-between;
  font-size: var(--eas-font-size-base);
  color: var(--eas-text-color-light);
  padding: 0px 32px;
  &_tip {
    @extend %flex-center;
  }
}

.report-view-box {
  width: 100%;
  height: 100%;
}

.report-view-footer {
  width: 100%;
  height: 64px;
  padding-right: 20px;
  @extend %flex-center;
  justify-content: flex-end;
}
.disable-async {
  pointer-events: none;
  cursor: not-allowed;
  color: var(--eas-text-color-light-1) !important;
}
</style>
<style lang="scss">
.el-dropdown__popper.view-sql__dropdown {
  box-shadow: 0px 3px 6px 1px rgba(28, 39, 80, 0.2);
  border-radius: 10px 10px 10px 10px;

  .el-popper__arrow {
    display: none;
  }
}

.report-drawer {
  background-color: #fff;

  .el-drawer__header {
    margin-bottom: 10px;
    align-items: center;
    justify-content: center;
    padding: 20px 32px;
  }

  .el-drawer__title {
    font-size: 16px;
    color: var(--eas-text-color);
    font-weight: bold;
  }

  .el-drawer__body {
    padding: 0px 32px;
  }

  .el-drawer__footer {
    padding: 0px;
  }
}
</style>
