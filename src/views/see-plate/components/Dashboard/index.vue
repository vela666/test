<template>
  <div class="nd-dashboard" v-loading="state.operateLoading">
    <div class="nd-dashboard-t">
      <div
        class="flex-center flex-between"
        v-show="seePlateStore.selectedInfo.businessId">
        <div class="flex-center gap10">
          <div
            style="max-width: 180px"
            class="nd-title c1c2028 fz18"
            v-showTips>
            {{ seePlateStore.selectedInfo.name }}
          </div>
          <ReportCreator :data="seePlateStore.shareList" />
        </div>
        <div class="flex-center gap10 nd-dashboard-t-operate">
          <DateRangeSelect
            ref="dateRangeSelectRef"
            isChecked
            closeIcon
            :needDynamic="false"
            @change="execReportGetData('date')"
            v-model="state.dateRange" />
          <TimeZone @change="execReportGetData('timeZone')" />
          <FilterCondition
            v-model="state.condition"
            @getData="execReportGetData('condition')"
            v-model:reqConditionParam="state.reqConditionParam"
            ref="filterConditionRef" />
          <Tooltip>
            <el-button
              @click="execReportGetData('refresh')"
              class="fz18 w32 m0">
              <SvgIcon name="refresh1" />
            </el-button>
            <template #content>
              {{ t('btn.refresh') }}
            </template>
          </Tooltip>

          <Tooltip
            v-if="
              seePlateStore.selectedInfo.authority > 1 &&
              +route.query.moduleType !== 2
            ">
            <el-button class="w32 m0 fz18" @click="handleShared">
              <SvgIcon name="kanban-share1" />
            </el-button>
            <template #content>{{ t('dashboard.shareDashboard') }}</template>
          </Tooltip>

          <Tooltip>
            <DropDownItemSelection>
              <el-button class="w32 m0 fz18">
                <SvgIcon name="event-group-manage" />
              </el-button>
              <template #content>
                <el-dropdown-item @click="updateRegularlyFn">
                  {{ t('common.scheduledUpdate') }}
                </el-dropdown-item>
                <el-dropdown-item @click="showOperateLog">
                  {{ t('common.operationLog') }}
                </el-dropdown-item>
              </template>
            </DropDownItemSelection>
            <template #content>{{ t('dashboard.dashboardSettings') }}</template>
          </Tooltip>
          <Tooltip>
            <el-button class="w32 m0 fz18" @click="handleCollect">
              <!-- star 收藏看板-->
              <!-- star-filled 取消看板收藏 class="c5473e8"-->
              <SvgIcon
                :class="seePlateStore.selectedInfo.starOrNot && 'c5473e8'"
                :name="
                  seePlateStore.selectedInfo.starOrNot ? 'star-filled' : 'star'
                " />
            </el-button>
            <template #content>
              {{
                t(
                  `common.${seePlateStore.selectedInfo.starOrNot ? 'cancelFavorite' : 'favorite'}`
                )
              }}
            </template>
          </Tooltip>

          <DropDownItemSelection
            v-if="seePlateStore.selectedInfo.authority > 1">
            <el-button class="m0 skip" type="primary">
              <SvgIcon name="kanban-create1" class="mr5" />
              {{ t('dashboard.addContent') }}
            </el-button>
            <template #content>
              <el-dropdown-item @click="addReport(true)">
                {{ t('dashboard.createReport') }}
              </el-dropdown-item>
              <el-dropdown-item @click="addReport(false)">
                {{ t('dashboard.addExistingReport') }}
              </el-dropdown-item>
            </template>
          </DropDownItemSelection>
        </div>
      </div>
    </div>
    <div class="nd-dashboard-content">
      <GridLayout
        v-if="seePlateStore.selectedReportNoteList.length"
        margin="10"
        cellHeight="110px"
        @layoutChange="layoutChange"
        parentCls=".nd-dashboard-content"
        boxCls="nd-grid-content"
        :minRow="4"
        :staticGrid="!authorityNot1"
        dragHandle="nd-drag"
        ref="gridLayoutRef"
        :list="seePlateStore.reportAndNoteList"
        v-model="seePlateStore.selectedReportNoteList">
        <template #default="{ item, removeItem }">
          <div
            :style="
              item.backgroundColor &&
              `background-color:${noteBgColorListMap[item.backgroundColor]};`
            "
            v-if="item"
            :class="[
              item.type === 1 && 'skip',
              'flex-column h100-percentage nd-grid-item',
            ]">
            <div
              :class="[
                authorityNot1 ? 'c-move nd-drag' : '',
                'flex-center flex-between component-head',
              ]">
              <div class="flex-center gap5 overflow-hidden">
                <a
                  :style="[
                    [3, 6].includes(item.newW) &&
                      `max-width:${item.newW !== 3 ? '300px' : '150px'};`,
                    item.titleStyle &&
                      `font-size:${noteTitleFontSizeListMap[item.titleStyle]}`,
                  ]"
                  v-showTips
                  :class="[
                    item.type === 1 ? 'c-default' : 'c-pointer fz16',
                    'c545e6e elem-hover txt-bold',
                  ]"
                  :href="openAnalysis(item)"
                  target="_blank">
                  {{ item.reportName }}
                </a>
                <Tooltip v-if="item.type === 2 && item.reportDesc">
                  <SvgIcon
                    class="c86919d fz14 c-pointer nd-hide-operate"
                    name="warning2" />
                  <template #content>{{ item.reportDesc }}</template>
                </Tooltip>

                <div
                  v-if="item.newW !== 3 && item.type !== 1"
                  class="c86919d flex-center ml10 nd-hide-operate">
                  <SvgIcon name="member-manage" class="fz16" />
                  <span :class="[item.newW === 6 && 'w80']" v-showTips>{{
                    item.creator
                  }}</span>
                </div>
              </div>

              <div
                v-if="item.type === 1"
                class="nd-operate ml20 flex-center gap10">
                <template v-if="authorityNot1">
                  <Tooltip>
                    <el-button @click="addOrEditNote(item)" class="p0 m0" text>
                      <SvgIcon class="fz16" name="edit1" />
                    </el-button>
                    <template #content>
                      {{ t('dashboard.editLabel') }}
                    </template>
                  </Tooltip>
                  <Tooltip>
                    <el-button
                      @click="removeData(item, removeItem)"
                      class="p0 m0"
                      text>
                      <SvgIcon class="fz16" name="delete1" />
                    </el-button>
                    <template #content>
                      {{ t('dashboard.removeLabel') }}
                    </template>
                  </Tooltip>
                </template>
              </div>

              <div
                v-else
                class="flex-center gap14 ml20 c86919d nd-hide-operate">
                <template v-if="!state.componentsRefs[item.mark]?.loading">
                  <Tooltip>
                    <el-button
                      @click="execReportGetData('refresh', item)"
                      class="p0 m0 nd-operate-btn-active fz28"
                      text>
                      <SvgIcon class="fz18" name="refresh1" />
                    </el-button>
                    <template #content>{{ t('btn.refresh') }}</template>
                  </Tooltip>

                  <Tooltip>
                    <el-button
                      @click="explore(item)"
                      class="p0 m0 nd-operate-btn-active fz28"
                      text>
                      <SvgIcon class="fz16" name="full-screen1" />
                    </el-button>
                    <template #content> {{ t('dashboard.explore') }}</template>
                  </Tooltip>

                  <Tooltip
                    v-if="
                      authorityNot1 || analysisAuthEnum[item.reportType].export
                    ">
                    <span class="inline-flex">
                      <DropDownItemSelection trigger="click">
                        <el-button
                          class="p0 m0 nd-operate-btn-active fz28 nd-report-more"
                          text>
                          <SvgIcon class="fz16" name="kanban-more1" />
                        </el-button>
                        <template #content>
                          <el-dropdown-item
                            @click="reportSet(item)"
                            v-if="authorityNot1">
                            <div>
                              <SvgIcon
                                name="setting"
                                class="c86919d fz18 mr3" />
                              {{ t('dashboard.reportSettings') }}
                            </div>
                          </el-dropdown-item>
                          <Auth
                            :value="analysisAuthEnum[item.reportType].export">
                            <el-dropdown-item
                              @click="dataExport(item)"
                              :disabled="
                                state.componentsRefs[item.mark]?.disableExport
                              ">
                              <Tooltip placement="right">
                                <template #content>
                                  {{ t('dashboard.dataExportNote') }}
                                </template>
                                <div>
                                  <SvgIcon
                                    name="download"
                                    :class="{
                                      c86919d:
                                        !state.componentsRefs[item.mark]
                                          ?.disableExport,
                                    }"
                                    class="fz18 mr3" />
                                  {{ t('btn.dataExport') }}
                                </div>
                              </Tooltip>
                            </el-dropdown-item>
                          </Auth>
                          <el-dropdown-item
                            v-if="authorityNot1"
                            @click="removeData(item, removeItem)">
                            <div>
                              <SvgIcon
                                name="delete1"
                                class="c86919d fz16 mr3" />
                              {{ t('dashboard.removeReport') }}
                            </div>
                          </el-dropdown-item>
                        </template>
                      </DropDownItemSelection>
                    </span>
                    <template #content>{{ t('btn.more') }}</template>
                  </Tooltip>
                </template>
              </div>
            </div>
            <div :class="[item.type === 1 && 'skip', 'component-report']">
              <component
                :ref="(el) => setRefs(item, el)"
                :is="componentNames[item.reportType]"
                :params="getParams(item)"
                @updReportSet="updReportSet"
                :info="item"
                :w="item.newW" />
            </div>
          </div>
        </template>
      </GridLayout>

      <div
        v-else
        class="h100-percentage flex-column flex-vertical-center flex-level-center">
        <Empty
          :desc="
            t('dashboard.noDataAvailable', [
              t(`dashboard.${route.query.kanBanId ? 'report' : 'dashboard'}`),
            ])
          " />
        <div class="mt26">
          <template v-if="route.query.kanBanId">
            <template v-if="authorityNot1">
              <el-button class="mr20" type="primary" @click="addReport(true)">
                {{ t('dashboard.createReport') }}
              </el-button>
              <el-button class="m0" type="primary" @click="addReport(false)">
                {{ t('dashboard.addExistingReport') }}
              </el-button>
            </template>
          </template>
          <!-- 看板 -->
          <Auth :value="getButtonAuth().authEnum.addDash" v-else>
            <el-button type="primary" @click="addKanbanFn(false)">
              {{ t('dashboard.addDash') }}
            </el-button>
          </Auth>
        </div>
      </div>
    </div>
  </div>
  <UpdateRegularly ref="updateRegularlyRef" />
  <Shared
    @getInfo="seePlateStore.getShareMemberList"
    direction="rtl"
    :businessId="route.query.kanBanId"
    ref="sharedRef" />
  <OperateLog
    :data="state.operateLogData"
    :loading="state.loading"
    v-model="state.operateLogVisible" />
  <AddKanBan @getData="emit('getData')" ref="addKanBanRef" />
  <AddReportDialog moduleName="数据看板" ref="addReportDialogRef" />
  <AddReportDrawer @getData="getInfo" ref="addReportDrawerRef" />
  <ReportSetDialog @updReport="updReportSet" ref="reportSetDialogRef" />
  <ExploreDialog ref="exploreDialogRef" />
  <AddOrEditNoteDialog @updNote="updNote" ref="addorEditNoteDialogRef" />
</template>

<script setup>
import { computed, markRaw, nextTick, reactive, shallowRef } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import {
  componentSettingTemp,
  conditionInItVal,
  kanbanExploreKey,
  viewSize,
  getButtonAuth,
} from '@/views/see-plate/enum.js'
// import useUserStore from '@/store/modules/user.js'
import useSeePlateStore from '@/store/modules/see-plate.js'
import UpdateRegularly from './components/UpdateRegularly.vue'
import FilterCondition from './components/FilterCondition/index.vue'
import Shared from '../Shared.vue'
import {
  noteBgColorListMap,
  noteTitleFontSizeListMap,
} from '@/enumeration/note.js'
import AddKanBan from '@/views/see-plate/components/SideKanBan/components/AddKanBan.vue'
import AddReportDrawer from './components/AddReportDrawer/index.vue'
import ReportSetDialog from './components/ReportSetDialog.vue'
import ExploreDialog from './components/ExploreDialog/index.vue'
// import AddReportDialog from '@/components/AddReportDialog/index.vue'
import GridLayout from './components/GridLayout/index.vue'
import { reportTypeObjListMap } from '@/enumeration/report'
import { operationLogInfo } from '@/api/modules/analysis'
import AddOrEditNoteDialog from './components/AddReportDrawer/AddOrEditNoteDialog.vue'

import EventAnalysis from './chart/eventAnalysis/index.vue'
import Sql from './chart/Sql.vue'
import Interval from './chart/Interval.vue'
import Note from './Note/index.vue'
import Attr from './chart/Attr.vue'
import Ltv from './chart/Ltv.vue'
import Retention from './chart/Retention.vue'
import Scatter from './chart/Scatter.vue'
import Funnel from './chart/Funnel.vue'
import Attributed from './chart/Attributed.vue'

import {
  asyncCancelCollectKanBan,
  asyncCollectKanBan,
  asyncReportBinding,
  asyncSaveViewPosition,
} from '@/api/modules/see-plate/dashboard.js'
import { ElMessage } from 'element-plus'
import { useTipModal } from '@/components/TipDialog/index.js'
import { cloneDeep, debounce } from 'lodash-es'
import Tooltip from '@/components/Tooltip/index.vue'
import analysisAuthEnum from '@/views/analysis/enum.js'
import useOperate from '@/components/PropsFilter/useOperate.js'
import { filterCondition } from '@/views/see-plate/utils.js'
import { useI18n } from 'vue-i18n'
import Auth from '@/components/Auth/index.vue'

const emit = defineEmits(['getData', 'execLoading'])

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
// const userStore = useUserStore()
const seePlateStore = useSeePlateStore()

const sharedRef = shallowRef(null)
const addKanBanRef = shallowRef(null)
const gridLayoutRef = shallowRef(null)
const exploreDialogRef = shallowRef(null)
const dateRangeSelectRef = shallowRef(null)
const addReportDrawerRef = shallowRef(null)
const addReportDialogRef = shallowRef(null)
const filterConditionRef = shallowRef(null)
const updateRegularlyRef = shallowRef(null)
const reportSetDialogRef = shallowRef(null)
const addorEditNoteDialogRef = shallowRef(null)

const authorityNot1 = computed(() => {
  return seePlateStore.selectedInfo.authority > 1
})

/*const userId = computed(() => {
  return userStore.userInfo.userId
})*/

const componentNames = {
  1: markRaw(EventAnalysis),
  2: markRaw(Retention),
  3: markRaw(Funnel),
  4: markRaw(Attr),
  6: markRaw(Scatter),
  7: markRaw(Sql),
  8: markRaw(Interval),
  9: markRaw(Ltv),
  14: markRaw(Attributed),
  Note: markRaw(Note),
}
const { getConditionResult } = useOperate()
const state = reactive({
  // 没有执行请求的节点列表
  notExecList: {},
  condition: conditionInItVal(),
  reqConditionParam: {},
  dateRange: {
    date: [],
    diff: '',
  },
  operateLogVisible: false,
  operateLogData: [],
  detailInfo: {},
  componentsRefs: {},
})

const getParams = (val) => {
  const setting =
    state.componentsRefs[val.mark]?.getSetting?.() || componentSettingTemp
  return {
    condition: state.condition,
    // reqConditionParam: state.reqConditionParam,
    reqConditionParam: getConditionResult({
      condition: filterCondition(state.condition, setting.conditionLimit || []),
      noPromise: true,
    }),
    dateRange: state.dateRange,
  }
}

const handleCollect = async () => {
  const fn = seePlateStore.selectedInfo.starOrNot
    ? asyncCancelCollectKanBan
    : asyncCollectKanBan
  await fn({
    businessId: route.query.kanBanId,
    dataOrigin: route.query.moduleType,
    dataType: 1,
    moduleType: route.query.moduleType,
  })
  seePlateStore.selectedInfo.starOrNot = !seePlateStore.selectedInfo.starOrNot
  ElMessage.success(
    t(
      `common.${seePlateStore.selectedInfo.starOrNot ? 'favoriteSuccess' : 'unfavoriteSuccess'}`
    )
  )
  emit('getData')
}

const setRefs = (val, el) => {
  state.componentsRefs[val.mark] = el
}

const explore = (val) => {
  const newInfo = state.componentsRefs[val.mark].getInfo?.() || val
  localStorage.setItem(
    kanbanExploreKey,
    JSON.stringify({
      newInfo,
      params: {
        condition: state.condition,
        reqConditionParam: state.reqConditionParam,
        dateRange: state.dateRange,
      },
    })
  )
  window.open(window.location.href, '_blank')

  /* exploreDialogRef.value.open(
    newInfo,
    cloneDeep({
      condition: state.condition,
      reqConditionParam: state.reqConditionParam,
      dateRange: state.dateRange,
    })
  )*/
}

nextTick(() => {
  if (localStorage.getItem(kanbanExploreKey)) {
    const { newInfo, params } = JSON.parse(
      localStorage.getItem(kanbanExploreKey)
    )
    exploreDialogRef.value.open(newInfo, params)
    localStorage.removeItem(kanbanExploreKey)
  }
})

// 报表设置
const reportSet = (val) => {
  /***SQL查询单独处理方式***/
  const chartTypeList = cloneDeep(
    state.componentsRefs[val.mark].chartTypeList || []
  )
  let graphType = val.graphType
  chartTypeList.forEach((item) => {
    if (item.value === 'data') {
      item.value = 6
    } else if (item.value === 'chart') {
      item.value = 5
    }
  })
  /******/
  reportSetDialogRef.value.open({
    ...val,
    chartTypeList,
    graphType,
    dashboardBusinessId: route.query.kanBanId,
    dataType: 1,
    isMini: state.componentsRefs[val.mark]?.isMini?.(),
    moduleType: route.query.moduleType,
  })
}

const handleShared = () => {
  sharedRef.value.open()
}

const addKanbanFn = (empty) => {
  if (!getButtonAuth().authEnum.addDash) return
  addKanBanRef.value.open(empty)
}

const layoutChange = debounce(async (val) => {
  await asyncSaveViewPosition({
    businessId: route.query.kanBanId,
    viewConfig: JSON.stringify(
      val.map((item) => {
        return {
          id: item.reportId,
          i: item.reportId,
          // 存储业务id
          mark: item.businessId,
          w: item.w,
          h: item.h,
          x: item.x,
          y: item.y,
          type: item.type,
        }
      })
    ),
  })
}, 100)

const addReport = (newAdd) => {
  const params = {
    kanBanId: route.query.kanBanId,
  }
  if (newAdd) {
    addReportDialogRef.value.open(params)
    return
  }
  addReportDrawerRef.value.open(params)
}

const updateRegularlyFn = () => {
  updateRegularlyRef.value.open()
}

/**
 * @description 仅执行可视区的报表请求
 * @param {string} type refresh(刷新)/date(日期)/timeZone(时区)/condition(条件)/notReq(不要请求)
 * @param {Object} current 当前单个执行目标信息
 */
let observer = null
const execReportGetData = (type = '', current) => {
  if (current) {
    state.componentsRefs[current.mark]?.getData?.({ type })
    return
  }
  // 终止对所有目标元素可见性变化的观察
  observer && observer.disconnect()
  nextTick(() => {
    if (!gridLayoutRef.value?.el) return
    const els = gridLayoutRef.value.el.querySelectorAll('.sub-grid-stack-item')
    observer = new IntersectionObserver(async (entries) => {
      for (const item of entries) {
        const mark = item.target.getAttribute('gs-id')
        // 元素是否可见
        if (item.isIntersecting) {
          // 是否显示过
          const has = state.notExecList[mark]
          // 执行获取数据方法 保证没显示过的一定要初始化执行事件、留存。ltv
          state.componentsRefs[mark]
            ?.getData?.({ type: has ? type : '' })
            ?.catch(() => {})
          state.notExecList[mark] = true
          observer.unobserve(item.target)
        } else {
          state.notExecList[mark] = !!state.notExecList[mark]
        }
      }
    })
    els.forEach((node) => {
      observer.observe(node)
    })
  })
}

// src/views/see-plate/components/SideKanBan/index.vue 组件调用
// 不然会出现请求不存在的看板数据
const getInfo = async () => {
  state.notExecList = {}
  state.operateLoading = true
  emit('execLoading', true)
  await filterConditionRef.value.getAllData(true).catch((e) => e)
  await seePlateStore.getReportNoteDetails().finally((_) => {
    state.operateLoading = false
  })
  gridLayoutRef.value?.initLayout()
  execReportGetData()
  seePlateStore.getShareMemberList()
  nextTick(() => {
    dateRangeSelectRef.value?.handleDelete(true)
    emit('execLoading', false)
  })
}

const openAnalysis = (val) => {
  const { reportId, reportType } = val
  const found = reportTypeObjListMap[reportType]
  if (found) {
    const { path } = found
    const routeUrl = router.resolve({
      path,
      query: {
        id: reportId,
        kanBanId: route.query.kanBanId,
        virtualAppId: sessionStorage.getItem('appId'),
      },
    })
    return routeUrl.href
  }
}

const dataExport = (item) => {
  state.componentsRefs[item.mark].export?.()
}

const showOperateLog = async () => {
  state.operateLogVisible = true
  const { data } = await operationLogInfo({
    businessId: route.query.kanBanId,
    logModuleType: 2,
  })
  state.operateLogData = markRaw(data)
}

const addOrEditNote = (val) => {
  addorEditNoteDialogRef.value.open(val)
}

// 更新本地的便签数据
const updNote = (val) => {
  const data = seePlateStore.selectedReportNoteList.find(
    (item) => item.businessId === val.businessId
  )
  if (data) {
    // 中图
    const w = val.viewSizeType === 1 ? 6 : 12
    const params = {
      w,
      newW: w,
      minW: w,
      maxW: w,
    }
    Object.assign(data, {
      ...val,
      ...params,
    })
    gridLayoutRef.value.updateInfo(data.mark, {
      ...params,
      x: 12 === data.newW ? 0 : data.x,
    })
  }
}

// 更新报表本地数据 必须有的两个字段
// val.businessId 报表业务ID
// val.viewSizeType	视窗大小:1 小图，2中图，3大图，默认为中图
const updReportSet = (val) => {
  const data = seePlateStore.selectedReportNoteList.find(
    (item) => item.businessId === val.businessId
  )
  const viewSizeType = data?.viewSizeType
  const w = data?.w
  if (data) {
    Object.assign(data, {
      ...val,
      ...viewSize[val.viewSizeType],
    })
    // 新旧视窗值不一致或宽不一致
    if (val.viewSizeType !== viewSizeType || w !== data.w) {
      // 暂未处理中图的x计算
      gridLayoutRef.value.updateInfo(data.mark, {
        ...viewSize[val.viewSizeType],
        // x: [12, 6].includes(data.newW) ? 0 : data.x,
        x: 12 === data.newW ? 0 : data.x,
      })
    }
    execReportGetData('notReq', data)
  }
}

const removeData = async (val, removeCallback) => {
  const title = t(`dashboard.${val.type === 1 ? 'note' : 'report'}`)
  useTipModal({
    content: t('dashboard.removeConfirmation', {
      title,
      reportName: val.reportName,
    }),
    iconType: 3,
    btnSwap: true,
    needLoading: true,
    title: t('dashboard.removeData', [title]),
    // 传事件
    async onSubmit(cb) {
      const data = gridLayoutRef.value
        .getSaveLayout()
        .filter((item) => item.businessId !== val.businessId)
      await asyncReportBinding({
        businessId: route.query.kanBanId,
        dataType: 1,
        moduleType: route.query.moduleType,
        ...data.reduce(
          (p, item) => {
            p[item.type === 1 ? 'noteIds' : 'reportBusinessIds'].push(
              item.businessId
            )
            return p
          },
          { reportBusinessIds: [], noteIds: [] }
        ),
      }).finally((_) => {
        cb()
      })
      removeCallback()
      ElMessage.success(t('common.removeSuccessfully'))
    },
  })
}
/*
watch(
  () => route.query.kanBanId,
  () => {
    getInfo()
  }
)
*/

onBeforeRouteLeave(() => {
  seePlateStore.reset()
})
defineExpose({
  getInfo,
  addKanbanFn,
})
defineOptions({
  name: 'Dashboard',
})
</script>

<style lang="scss">
#nd-grid-content {
  .grid-stack-item-content {
    .nd-grid-item {
      background-color: #fff;
      &:not(.skip) {
        padding: 16px;
      }
      &.skip {
        padding: 16px 16px 8px;
        gap: 2px;
      }
      .nd-operate {
        display: none;
      }

      &:hover {
        .nd-operate {
          display: flex;
        }
      }
    }
    .nd-hide-operate {
      visibility: hidden;
      [aria-expanded='true'] {
        visibility: visible;
      }
    }
    &:hover {
      .nd-hide-operate {
        visibility: visible;
      }
    }
  }
}
</style>

<style scoped lang="scss">
.nd-dashboard {
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
}
.nd-report-more {
  transform: rotate(90deg);
}
.nd-dashboard-t {
  //padding-right: 9px;
  margin-top: 20px;

  > div {
    width: 100%;
    //background: #fff;
    height: 60px;
    border-radius: 4px;
    padding: 0 20px;
  }
  .nd-dashboard-t-operate {
    :deep(.nd-date-label) {
      border: none;
    }
    :deep(.el-button) {
      &:not(.skip) {
        background-color: #fff;
      }
    }
  }
}

.nd-dashboard-content {
  padding: 0 10px;
  margin-top: 10px;
  margin-bottom: 10px;
  overflow-y: auto;
  height: 100%;

  &::-webkit-scrollbar-track-piece {
    background-color: transparent;
  }

  :deep(.analysis-update-time) {
    color: var(--eas-text-color-primary);
  }
}
.component-head {
  height: 24px;
}
.component-report {
  &:not(.skip) {
    height: calc(100% - 24px);
  }
  &.skip {
    height: 100%;
    overflow: auto;
    overscroll-behavior: contain;
  }
}
</style>
