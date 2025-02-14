<template>
  <CommonDialog
    className="nd-user-data-detail-dialog"
    v-model="state.show"
    fullscreen
    :show-close="false"
    :needFooter="false"
    @close="close">
    <template #header>
      <DialogFullScreenHeader @close="state.show = false">
        <i class="ccbd0d6 ml20 mr20">|</i>
        {{ state.params.reportName }}
        <i class="ccbd0d6 ml20 mr20">|</i>
        <el-radio-group
          v-model="state.exploreOrVisualization"
          @change="changeVisual">
          <el-radio-button :label="1" :value="1">{{
            t('dashboard.explore')
          }}</el-radio-button>
          <el-radio-button
            v-if="state.params.graphConfig"
            :label="2"
            :value="2">
            {{ t('dashboard.visualization') }}</el-radio-button
          >
        </el-radio-group>
      </DialogFullScreenHeader>
    </template>
    <div
      v-show="state.exploreOrVisualization === 1"
      :class="[
        state.exploreCollapse && 'nd-explore-hide',
        'nd-explore-container',
      ]">
      <div
        v-if="
          (state.dynamic_list.length && state.params.reportType === 7) ||
          state.params.reportType !== 7
        "
        class="nd-explore-l"
        v-loading="state.loading">
        <div class="nd-explore-l-filter">
          <div class="nd-explore-indicator">
            <!-- 除了SQL -->
            <template v-if="state.params.reportType !== 7">
              <div class="c545e6e txt-bold flex-center flex-between">
                <span class="nd-collapse-hide">
                  {{
                    t(
                      `dashboard.${state.params.reportType === 4 ? 'userMatch' : 'metricFilter'}`
                    )
                  }}</span
                >
                <SvgIcon
                  @click="updExploreCollapse"
                  class="c-pointer fz18 elem-hover c86919d"
                  :name="`menu-${state.exploreCollapse ? 'open' : 'close'}`" />
              </div>
              <AnalysisGlobalFilter
                :isAnalyze="false"
                title=""
                :appId="state.appId"
                :limit="conditionLimit"
                class="mt10 mb20 nd-collapse-hide"
                v-model="state.condition"
                :data="state.filedsData"
                @add="addCondition"
                @remove="deleteCondition" />
              <template v-if="showAddGroup">
                <div class="c545e6e txt-bold mb10 nd-collapse-hide">
                  {{ t('analysis.groupItems') }}
                </div>
                <AnalysisGroups
                  title=""
                  :appId="state.appId"
                  class="nd-collapse-hide"
                  :isAnalyze="false"
                  v-model="state.groupList"
                  :filterable="groupsLimit.filterable"
                  :limit="groupsLimit.limit"
                  :data="groupFieldsData"
                  :disabledGroups="disabledGroups"
                  @remove="(val) => removeGroupItem(val)">
                  <template #btn>
                    <el-button
                      type="primary"
                      text
                      @click="addGroupItem"
                      v-if="state.groupList.length < groupQuantityLimit">
                      <SvgIcon name="add-index" class="fz16 mr3" />
                      {{ t('analysis.addGroup') }}
                    </el-button>
                  </template>
                </AnalysisGroups>
              </template>
            </template>
            <div v-else>
              <div class="c545e6e txt-bold mb20 flex-center flex-between">
                <span class="nd-collapse-hide">{{
                  t('dashboard.parameterList')
                }}</span>
                <SvgIcon
                  @click="updExploreCollapse"
                  class="c-pointer fz18 elem-hover c86919d"
                  :name="`menu-${state.exploreCollapse ? 'open' : 'close'}`" />
              </div>
              <div
                class="nd-collapse-hide"
                v-for="(item, index) in state.dynamic_list"
                :key="index">
                <DynamicParams
                  v-model="state.dynamic_list[index]"
                  v-model:list="state.dynamic_list"
                  :index="index"
                  :operate="false"></DynamicParams>
              </div>
            </div>
          </div>
        </div>
        <div
          @click="updExploreCollapse"
          v-show="state.exploreCollapse"
          class="h100-percentage flex-center flex-level-center hide-text">
          {{ t('common.filterConditions') }}
        </div>
        <el-button
          type="primary"
          class="flex-align-self-end m20 nd-collapse-hide"
          @click="handleCalculate('exploreCalc')"
          >{{ t('btn.calculate') }}</el-button
        >
      </div>
      <div class="nd-explore-r">
        <div class="nd-explore-r-title">
          {{ t('dashboard.visualizationArea') }}
        </div>
        <section class="nd-explore-r-body">
          <component
            ref="componentRef"
            :explore="true"
            :is="componentNames[state.params.reportType]"
            :params="getParams()"
            :info="state.params"
            :w="state.params.newW" />
        </section>
      </div>
    </div>
    <div v-show="state.exploreOrVisualization === 2" class="h100-percentage">
      <VisualChartContent
        :columns="state.visualConf.columns"
        :data="state.visualConf.tableData"
        :headers="state.visualConf.headers"
        :rows="state.visualConf.rows"
        :config="state.visualConf.config"
        :settings="state.visualConf.settings"
        v-model:graphType="state.visualConf.graphType"
        :showChartLabel="state.visualConf.showChartLabel"></VisualChartContent>
    </div>
  </CommonDialog>
</template>

<script setup>
import { computed, markRaw, nextTick, reactive, shallowRef } from 'vue'
import { getFieldList } from '@/api/modules/analysis/common'

import useOperate from '@/components/PropsFilter/useOperate'
import useAanlysisUtils from '@/views/analysis/hooks/useAanlysisUtils'
import VisualChartContent from '@/views/analysis/sqlquery/components/VisualChartContent.vue'
import DynamicParams from '@/views/analysis/sqlquery/components/DynamicParams.vue'

import { componentSettingTemp, conditionInItVal } from '@/views/see-plate/enum'
import { omitAttr, tableKeysArr } from '@/enumeration'
import { ElMessage } from 'element-plus'
import { v4 as uuidv4 } from 'uuid'
import Interval from '@/views/see-plate/components/Dashboard/chart/Interval.vue'
import Attr from '@/views/see-plate/components/Dashboard/chart/Attr.vue'
import EventAnalysis from '@/views/see-plate/components/Dashboard/chart/eventAnalysis/index.vue'
import Ltv from '@/views/see-plate/components/Dashboard/chart/Ltv.vue'
import Retention from '@/views/see-plate/components/Dashboard/chart/Retention.vue'
import Sql from '@/views/see-plate/components/Dashboard/chart/Sql.vue'
import Scatter from '@/views/see-plate/components/Dashboard/chart/Scatter.vue'
import Funnel from '@/views/see-plate/components/Dashboard/chart/Funnel.vue'
import Attributed from '@/views/see-plate/components/Dashboard/chart/Attributed.vue'

import { filterCondition } from '@/views/see-plate/utils.js'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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
}

const {
  handleDelConditionData,
  handleAddConditionData,
  parseFiltersFromRes,
  getConditionResult,
  getFirsCondition,
} = useOperate()

const { setGroupByDisplay, getGroupData } = useAanlysisUtils()

const initVal = () => {
  return {
    appId: '',
    loading: false,
    params: {},
    condition: conditionInItVal(),
    reqConditionParam: {},
    show: false,
    exploreOrVisualization: 1,
    groupList: [],
    groupBy: {},
    filedsData: {},
    groupData: {},
    // 记录事件拆分数据
    eventSplit: [],
    dateRange: {
      date: [],
      diff: '',
    },
    // 可视化配置
    visualConf: {},
    dynamic_list: [],
    exploreCollapse: JSON.parse(
      sessionStorage.getItem('exploreCollapse') || 'false'
    ),
  }
}
const componentRef = shallowRef()
const state = reactive(initVal())

const componentSetting = computed(() => {
  return componentRef.value?.getSetting?.() || componentSettingTemp
})

const groupsLimit = computed(() => {
  const temp = componentSetting.value.groupLimit || []
  let limit = tableKeysArr.filter((item) => !temp.includes(item))
  /*let filterable = true
   // 用户分析
  if (state.params.reportType === 4) {
    filterable = false
    limit = limit.filter((item) => item !== 'eventField')
  }*/
  return {
    limit,
    filterable: componentSetting.value.filterable ?? true,
  }
})

const conditionLimit = computed(() => {
  /*let limit = tableKeysArr.filter(
    (item) => !componentSetting.value.conditionLimit.includes(item)
  )
  // 用户分析
  if (state.params.reportType === 4) {
    limit = limit.filter((item) => item !== 'eventField')
  }*/
  const temp = componentSetting.value.conditionLimit || []
  return tableKeysArr.filter((item) => !temp.includes(item))
})

// 用户分析且是人群时、归因分析 不展示
const showAddGroup = computed(() => {
  if (state.params.reportType === 14) return false
  const qp = JSON.parse(state.params.qp)
  return !qp.userCrowds?.length
})

// 在选择分组项中需要禁用掉的事件属性
const disabledGroups = computed(() => {
  const group = []
  for (const item of state.groupList) {
    if (
      group.findIndex(
        (el) =>
          el.fEn === item.fEn && el.customTableName === item.customTableName
      ) === -1
    ) {
      group.push({ ...item })
    }
  }
  return [...group, ...state.eventSplit]
})

/*
分组限制
事件、留存、间隔、LTV   5
漏斗 1
分布 10
属性 2
*/
const analysisGruopLimt = {
  1: 5,
  2: 5,
  8: 5,
  9: 5,
  3: 1,
  6: 10,
  4: 2,
  14: 5,
}

// 分组可添加数量限制
const groupQuantityLimit = computed(() => {
  return analysisGruopLimt[state.params.reportType]
})

// 添加分组
const addGroupItem = () => {
  if (state.groupList.length > groupQuantityLimit.value) return
  if (!Object.keys(groupFieldsData).length) {
    ElMessage.warning(t('analysis.noGroupAdd'))
    return
  }
  state.groupList.push({
    id: uuidv4(),
    ...getFirsCondition({
      conditionList: groupFieldsData.value,
      groups: disabledGroups.value,
      noLimit: groupsLimit.value.limit,
    }),
    timeType: '',
    range: {
      propertyRange: [],
      propertyRangeType: 1,
    },
  })
}

const getParams = () => {
  return {
    condition: state.condition,
    reqConditionParam: state.reqConditionParam,
    dateRange: state.dateRange,
    groupBy: state.groupBy,
    dynamic_list: state.dynamic_list,
    appId: state.appId,
  }
}

// 删除一项分组项
const removeGroupItem = (index) => {
  if (!Number.isInteger(index)) return
  state.groupList.splice(index, 1)
}

// 添加全局筛选项
const addCondition = (index) => {
  state.condition = handleAddConditionData({
    condition: state.condition,
    noLimit: conditionLimit.value,
    conditionList: state.filedsData,
    index,
  })
}

// 全局筛选删除一项
const deleteCondition = (index, subIndex) => {
  state.condition = handleDelConditionData({
    condition: state.condition,
    index,
    subIndex,
  })
}

// 获取对应事件的事件属性和用户属性、用户分群、用户标签
const asyncGetFieldList = async (params) => {
  const { data } = await getFieldList(params)
  // console.log(data)
  return data
}

// 根据groupsLimit的filterable过滤 omitAttr 中包含的属性
// 分组项是否过滤掉属性中的 '__fid', '__bid', '__did'
const groupFieldsData = computed(() => {
  const temp = {}
  for (const key in state.groupData) {
    const data = state.groupData[key]
    if (tableKeysArr.includes(key)) {
      temp[key] = groupsLimit.value.filterable
        ? data.filter((el) => !omitAttr.includes(el.fEn))
        : data
    } else {
      temp[key] = data
    }
  }
  return temp
})

const close = () => {
  Object.assign(state, initVal())
}

const open = async (val, info) => {
  state.show = true
  state.params = val
  const qp = JSON.parse(val.qp)
  state.appId = info.appId || val.appId

  if (qp.dynamic_list && qp.dynamic_list.length) {
    // SQL查询动态参数
    const dynamic_list = []
    qp.dynamic_list.forEach((item) => {
      if (item.type === 'Selector') {
        dynamic_list.push({
          ...item,
          value:
            item.dataType === 'sql'
              ? item.value
              : item.value
                ? item.value.split(':::')
                : '',
          dataType: !item.dataType ? 'sql' : item.dataType,
        })
      } else {
        dynamic_list.push(item)
      }
    })
    state.dynamic_list = dynamic_list
  }

  // 分组项 除了用户分析要把对应的 事件名字带上
  if (qp.eventSplit) {
    if (!Array.isArray(qp.eventSplit)) {
      // 兼容1.0单个拆分为对象情况
      qp.eventSplit = [qp.eventSplit]
    }
    state.eventSplit = qp.eventSplit.map((item) => {
      return {
        fEn: item.propertyName,
        tableType: item.tableType,
      }
    })
  }

  state.groupList = setGroupByDisplay(qp.groupBy)
  state.dateRange = info.dateRange

  nextTick(async () => {
    const {
      conditionEventNames,
      groupEventNames,
      conditionLimit = [],
    } = componentSetting.value
    // reportType = src/enumeration/report.js的reportTypeList
    // const limit = val.reportType === 4 ? ['eventField'] : conditionLimit
    state.condition = filterCondition(info.condition, conditionLimit)
    handleCalculate()
    state.filedsData = await asyncGetFieldList({
      eventNames: conditionEventNames,
      appId: state.appId,
    })
    state.groupData = await asyncGetFieldList({
      eventNames: groupEventNames,
      appId: state.appId,
    })
  })
}

const handleCalculate = async (type = '') => {
  try {
    state.reqConditionParam = await getConditionResult({
      condition: state.condition,
    })
    state.groupBy = getGroupData(state.groupList)
    nextTick(() => {
      state.loading = true
      componentRef.value.getData?.({ type })?.finally((_) => {
        state.loading = false
      })
    })
  } catch (error) {
    ElMessage.warning(error)
  }
}

const changeVisual = (val) => {
  if (val === 2) {
    state.visualConf = componentRef.value.getExploreVisualData()
  }
}

const updExploreCollapse = () => {
  state.exploreCollapse = !state.exploreCollapse
  sessionStorage.setItem('exploreCollapse', state.exploreCollapse)
}

defineExpose({
  open,
})
defineOptions({
  name: 'ExploreDialog',
})
</script>

<style lang="scss" scoped>
.nd-explore-container {
  display: flex;
  gap: 20px;
  height: 100%;
  padding: 20px;
  background-color: var(--eas-color-primary-light-1);
  > div {
    background-color: #fff;
  }

  .nd-explore-l {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 540px;
    overflow: hidden;
    height: 100%;
    .nd-explore-l-filter {
      display: flex;
      width: 100%;
      padding: 20px 20px 0;
      overflow-y: auto;
      > div {
        width: 100%;
      }
    }
    .nd-explore-indicator {
      position: relative;
    }
  }
  .nd-explore-r {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0 20px 20px 20px;

    > .nd-explore-r-title {
      flex-shrink: 0;
      padding: 20px 0 10px 0;
      line-height: 1;
      font-size: var(--el-font-size-base);
      font-weight: bold;
      color: var(--eas-text-color-primary);
    }

    > .nd-explore-r-body {
      overflow: hidden;
      flex-grow: 1;
    }
    :deep() {
      .analysis-update-time {
        color: var(--eas-text-color-primary);
      }
    }
  }
}

.nd-explore-hide {
  .nd-explore-l {
    width: 40px;
  }
  .nd-collapse-hide {
    display: none;
  }
  .nd-explore-l-filter {
    overflow: hidden;
    padding: 20px 10px !important;
  }
  .hide-text {
    cursor: default;
    writing-mode: vertical-lr;
  }
}
</style>
