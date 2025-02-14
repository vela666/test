<template>
  <div class="nd-dashboard" v-loading="state.operateLoading">
    <div class="nd-dashboard-t">
      <div
        class="flex-center flex-between"
        v-show="seePlateStore.selectedInfo.businessId">
        <div class="flex-center gap10">
          <div class="nd-dashboard-t-name" v-showTips>
            {{ seePlateStore.selectedInfo.name }}
          </div>
          <!--          <ReportCreator :data="seePlateStore.shareList" />-->
        </div>
        <div class="flex-center gap10 nd-dashboard-t-operate">
          <!--          <TimeZone @change="execReportGetData('timeZone')" />-->
          <FilterCondition
            v-model="state.condition"
            @getData="execReportGetData('condition')"
            v-model:reqConditionParam="state.reqConditionParam"
            ref="filterConditionRef" />
        </div>
      </div>
    </div>
    <div class="nd-dashboard-content">
      <GridLayout
        noDrag
        noResize
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
            <div class="flex-center flex-between component-head">
              <div class="flex-center gap5 overflow-hidden">
                <span
                  :style="[
                    [3, 6].includes(item.newW) &&
                      `max-width:${item.newW !== 3 ? '300px' : '150px'};`,
                    item.titleStyle &&
                      `font-size:${noteTitleFontSizeListMap[item.titleStyle]}`,
                  ]"
                  v-showTips
                  class="c545e6e">
                  {{ item.reportName }}
                </span>
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { watch, computed, markRaw, nextTick, reactive, shallowRef } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import {
  componentSettingTemp,
  conditionInItVal,
  viewSize,
} from '@/views/see-plate/enum.js'
// import useUserStore from '@/store/modules/user.js'
import useSeePlateStore from '@/store/modules/see-plate.js'
import FilterCondition from './components/FilterCondition/index.vue'
import {
  noteBgColorListMap,
  noteTitleFontSizeListMap,
} from '@/enumeration/note.js'
import GridLayout from '@/views/see-plate/components/Dashboard/components/GridLayout/index.vue'
import EventAnalysis from '@/views/see-plate/components/Dashboard/chart/eventAnalysis/index.vue'
import Sql from '@/views/see-plate/components/Dashboard/chart/Sql.vue'
import Interval from '@/views/see-plate/components/Dashboard/chart/Interval.vue'
import Note from '@/views/see-plate/components/Dashboard/Note/index.vue'
import Attr from '@/views/see-plate/components/Dashboard/chart/Attr.vue'
import Ltv from '@/views/see-plate/components/Dashboard/chart/Ltv.vue'
import Retention from '@/views/see-plate/components/Dashboard/chart/Retention.vue'
import Scatter from '@/views/see-plate/components/Dashboard/chart/Scatter.vue'
import Funnel from '@/views/see-plate/components/Dashboard/chart/Funnel.vue'
import Attributed from '@/views/see-plate/components/Dashboard/chart/Attributed.vue'

import {
  asyncReportBinding,
  asyncSaveViewPosition,
} from '@/api/modules/see-plate/dashboard.js'
import { ElMessage } from 'element-plus'
import { useTipModal } from '@/components/TipDialog/index.js'
import { debounce } from 'lodash-es'
import Tooltip from '@/components/Tooltip/index.vue'
import useOperate from '@/components/PropsFilter/useOperate.js'
import { filterCondition } from '@/views/see-plate/utils.js'
import { useI18n } from 'vue-i18n'
import eventBus from '@/plugins/event-bus.js'

const { t } = useI18n()
const route = useRoute()
// const userStore = useUserStore()
const seePlateStore = useSeePlateStore()

const addKanBanRef = shallowRef(null)
const gridLayoutRef = shallowRef(null)
const exploreDialogRef = shallowRef(null)
const dateRangeSelectRef = shallowRef(null)
const filterConditionRef = shallowRef(null)

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

const setRefs = (val, el) => {
  state.componentsRefs[val.mark] = el
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
  eventBus.emit('execLoading', true)
  await filterConditionRef.value.getAllData(true).catch((e) => e)
  await seePlateStore.getReportNoteDetails().finally((_) => {
    state.operateLoading = false
  })
  gridLayoutRef.value?.initLayout()
  execReportGetData()
  seePlateStore.getShareMemberList()
  nextTick(() => {
    dateRangeSelectRef.value?.handleDelete(true)
    eventBus.emit('execLoading', false)
  })
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

eventBus.on('getInfo', (val) => {
  getInfo()
})

onBeforeRouteLeave(() => {
  seePlateStore.reset()
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
    .chart-card-header {
      pointer-events: none;
    }
  }
}
</style>

<style scoped lang="scss">
.nd-dashboard {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.nd-report-more {
  transform: rotate(90deg);
}
.nd-dashboard-t {
  //padding-right: 9px;
  > div {
    width: 100%;
    //background: #fff;
    height: 50px;
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
.nd-dashboard-t-name {
  max-width: 150px;
  color: #1c2028;
  font-size: 16px;
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
