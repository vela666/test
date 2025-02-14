<script setup>
import { ref, provide, computed } from 'vue'
import useDashboardEvent from './hooks/useDashboardEvent.js'
import DropDownSelector from '@/views/analysis/event/components/DropDownSelector/index.vue'
import TableComparativeSelect from '@/views/analysis/event/components/TableComparativeSelect/index.vue'
import ChartCardHeader from '@/views/see-plate/components/Dashboard/components/ChartCardHeader/index.vue'
import RateLabel from './components/RateLabel.vue'
import MiniView from './components/MiniView.vue'
import { dataSegmentation } from '@/views/analysis/hooks/utils.js'
import { thousandsFilter } from '@/utils'
import ResultClusterDialog from '@/views/analysis/components/ResultClusterDialog/index.vue'
import ResultUserListDialog from '@/views/analysis/components/ResultUserListDialog/index.vue'
import { isObject } from 'lodash-es'
import authEnum from '@/views/analysis/enum.js'
import { createEventResultSegmentation } from '@/api/modules/common'
import EventDetail from '@/views/analysis/event/components/EventDetail/index.vue'

defineOptions({
  name: 'EventAnalysis',
})
const props = defineProps({
  info: {
    type: Object,
    default: () => null,
  },
  w: {
    type: Number,
    default: 0,
  },
  explore: {
    // 探索
    type: Boolean,
    default: false,
  },
  params: {
    type: Object,
    default: () => null,
  },
})

const emits = defineEmits(['updReportSet'])
const resTableRef = ref(null)
const {
  state,
  dataCache,
  dashboardState,
  groupSortChange,
  dashboardChartTypeList,
  diffCalculation,
  loading,
  reCalculateData,
  chartTypeChange,
  eventCheckChange,
  changeTableType,
  showRateLabel,
  getData,
  reSetDataview,
  toExportData,
  getInfo,
  showCluster,
  resetTableRow,
  getClusterParams,
  showEventDetail,
  getEventDetailParams,
  requestId,
  cancelFetchRequest,
  disableExport,
  getSetting,
} = useDashboardEvent({ props, emits, resTableRef })

const resultClusterRef = ref(null)
const openClustDialog = (params = {}) => {
  resultClusterRef.value?.open(isObject(params) ? params : {})
}

const userListRef = ref(null)
const openUserListDialog = (params = {}) => {
  userListRef.value?.open(isObject(params) ? params : {})
}

const appId = computed(
  () => props?.params?.appId || sessionStorage.getItem('appId')
)

provide('appId', appId)

defineExpose({
  getData,
  chartTypeList: dashboardChartTypeList,
  isMini: () => dashboardState.mini,
  getInfo,
  loading,
  export: toExportData,
  disableExport,
  getSetting,
})
</script>

<template>
  <CancelModal
    :loading="loading"
    :requestId="requestId"
    @cancelCalculate="cancelFetchRequest">
    <MiniView
      v-if="w == 3 && !explore"
      :dateRange="state.dateRange"
      :particleType="state.particleType"
      :data="dashboardState.compareData"
      :time="state.resultGenerateTime"
      :info="info" />
    <div v-else class="dashboard-analysis-card">
      <chart-card-header>
        <template #left>
          <DateRangeSelect
            :showBorder="false"
            :dateIcon="false"
            v-model="state.dateRange"
            placement="bottom-start"
            @change="reCalculateData(false)">
            <EventComparison
              :date="state.dateRange"
              :needStage="false"
              v-model="state.versus"
              @apply="reCalculateData(false)" />
          </DateRangeSelect>
          <div>
            <PeriodTypeSelect
              :showBorder="false"
              v-model="state.particleType"
              :limit="['day', 'hour', 'summary']"
              @change="reCalculateData(false)" />
          </div>
          <template v-if="state.graphType !== 6">
            <!-- 阶段 -->
            <template v-if="state.versus.length > 1">
              <DropDownSelector placement="bottom" :showBorder="false">
                <template #default>{{ $t('dateRangeSelect.stage') }}</template>
                <template #content>
                  <el-checkbox-group
                    class="custom-checkbox-group"
                    v-model="state.selectedStageChartIndex"
                    @change="groupSortChange">
                    <el-checkbox
                      class="custom-content-item"
                      v-for="(item, index) in state.versus"
                      :key="`versus` + index"
                      :value="index + 1"
                      :label="index + 1">
                      <div class="custom-content-item__label" v-showTips>
                        {{ item.mainName }}
                      </div>
                    </el-checkbox>
                  </el-checkbox-group>
                </template>
              </DropDownSelector>
            </template>
            <!-- 指标选择 -->
            <template v-if="dataCache?.y?.length > 1">
              <DropDownSelector placement="bottom" :showBorder="false">
                <template #default>{{ $t('analysis.indicators') }}</template>
                <template #content>
                  <el-checkbox-group
                    class="custom-checkbox-group"
                    v-model="state.eventCheckList"
                    @change="eventCheckChange">
                    <el-checkbox
                      class="custom-content-item"
                      v-for="(item, index) in state.eventCheckOptions"
                      :key="`custom-content-item_${index}`"
                      :value="item"
                      :label="item">
                      <div class="custom-content-item__label" v-showTips>
                        {{ item }}
                      </div>
                    </el-checkbox>
                  </el-checkbox-group>
                </template>
              </DropDownSelector>
            </template>
            <!-- 分组选择 -->
            <template v-if="state.unionGroups.length > 1">
              <GroupSelect
                :showBorder="false"
                v-model="state.groupOptions"
                :data="state.unionGroups"
                placement="bottom"
                @change="reSetDataview" />
            </template>
            <!-- 分组排序 -->
            <template
              v-if="state.unionGroups.length > 1 && state.graphType !== 5">
              <sort-drop
                :showBorder="false"
                placement="bottom"
                v-model="state.sortType"
                @change="groupSortChange"></sort-drop>
            </template>
          </template>
          <AnalysisUpdateTime :time="state.resultGenerateTime" />
        </template>
        <template #right>
          <!--  对比阶段 -->
          <TableComparativeSelect
            :showBorder="false"
            v-show="state.versus.length > 1 && state.graphType === 6"
            v-model="state.selectedStageTableIndex"
            :versus="state.versus"
            @change="changeTableType" />
          <!-- 图表数值展示 -->
          <ShowChartLabel
            :showBorder="false"
            v-model="state.showChartLabel"
            :show="![5, 6].includes(state.graphType)"
            @updChart="groupSortChange" />
          <!-- 探索展示 -->
          <template v-if="explore">
            <el-tooltip
              :content="$t('common.refresh')"
              placement="top"
              :hide-after="0">
              <el-button
                class="p0 m0 nd-operate-btn-active fz28"
                text
                @click="reCalculateData(true)">
                <SvgIcon class="fz16 c86919d" name="refresh1" />
              </el-button>
            </el-tooltip>
            <Auth :value="authEnum[1].export">
              <el-tooltip
                :content="$t('analysis.exportDataTip')"
                placement="top"
                :hide-after="0">
                <el-button
                  class="p0 m0 nd-operate-btn-active fz28"
                  text
                  @click="toExportData">
                  <SvgIcon class="fz18 c86919d" name="download" />
                </el-button>
              </el-tooltip>
            </Auth>
          </template>
          <!-- 图表类型 -->
          <sort-drop
            v-model="state.graphType"
            :typeList="dashboardChartTypeList"
            :showBorder="false"
            showText
            @change="chartTypeChange"></sort-drop>
        </template>
      </chart-card-header>
      <div class="chart-view-body">
        <empty
          v-if="[0, -1].includes(state.viewStatus)"
          :desc="dashboardState.descMsg"></empty>
        <template v-else>
          <VxeTableSort
            v-if="state.graphType === 6"
            ref="resTableRef"
            :columns="state.columnList"
            :data="state.tableData"
            min-height="100"
            width="100%"
            max-height="100%">
            <template #customColumn="{ row, column, index }">
              <div v-if="state.versus.length > 0" class="is-show-diff">
                <div style="height: 100%">
                  <div
                    v-for="(stageVal, stageIndex) of dataSegmentation(
                      row[column.field]
                    )"
                    :key="`${column.field}_${index}_${stageIndex}`">
                    <template
                      v-if="
                        showCluster(
                          resetTableRow(
                            row,
                            column.field,
                            stageVal,
                            stageIndex
                          ),
                          index,
                          column.field
                        )
                      ">
                      <span
                        class="text-underline c-pointer"
                        @click="
                          openUserListDialog(
                            getClusterParams(
                              { row, column },
                              params,
                              stageIndex
                            )
                          )
                        "
                        >{{ thousandsFilter(stageVal) }}</span
                      >
                      <el-tooltip
                        :content="$t('analysis.createResultGroup')"
                        :hide-after="0"
                        placement="top">
                        <svg-icon
                          class="c-pointer ml3"
                          name="creator1"
                          @click="
                            openClustDialog(
                              getClusterParams(
                                { row, column },
                                params,
                                stageIndex
                              )
                            )
                          " />
                      </el-tooltip>
                    </template>
                    <template v-else>
                      <span
                        class="text-underline c-pointer"
                        v-if="
                          showEventDetail(
                            resetTableRow(
                              row,
                              column.field,
                              stageVal,
                              stageIndex
                            ),
                            index,
                            column.field
                          )
                        "
                        @click="
                          state.eventDetailRef.open(
                            getEventDetailParams(
                              { row, column },
                              params,
                              stageIndex
                            )
                          )
                        ">
                        {{ thousandsFilter(stageVal) }}
                      </span>
                      <span v-else>
                        {{ thousandsFilter(stageVal) }}
                      </span>
                    </template>
                  </div>
                </div>
                <div
                  v-if="column.showDiff && state.versus.length"
                  style="align-self: flex-end">
                  <span
                    v-if="!isNaN(diffCalculation(row[column.field]))"
                    :class="[
                      diffCalculation(row[column.field]) >= 0
                        ? 'c00b42a'
                        : 'cf53f3f',
                    ]">
                    {{
                      `${
                        diffCalculation(row[column.field]) >= 0 ? '+' : ''
                      }${diffCalculation(row[column.field])}`
                    }}%
                  </span>
                  <span v-else>{{ diffCalculation(row[column.field]) }}</span>
                </div>
              </div>
              <div v-else>
                <div style="height: 100%">
                  <template v-if="showCluster(row, index, column.field)">
                    <span
                      class="text-underline c-pointer"
                      @click="
                        openUserListDialog(
                          getClusterParams({ row, column }, params)
                        )
                      "
                      >{{ thousandsFilter(row[column.field]) }}</span
                    >
                    <el-tooltip
                      :content="$t('analysis.createResultGroup')"
                      :hide-after="0"
                      placement="top">
                      <svg-icon
                        class="c-pointer ml3"
                        name="creator1"
                        @click="
                          openClustDialog(
                            getClusterParams({ row, column }, params)
                          )
                        " />
                    </el-tooltip>
                  </template>
                  <template v-else>
                    <span
                      class="text-underline c-pointer"
                      v-if="showEventDetail(row, index, column.field)"
                      @click="
                        state.eventDetailRef.open(
                          getEventDetailParams({ row, column }, params)
                        )
                      ">
                      {{ thousandsFilter(row[column.field]) }}
                    </span>
                    <span v-else>
                      {{ thousandsFilter(row[column.field]) }}
                    </span>
                  </template>
                </div>
              </div>
            </template>
          </VxeTableSort>
          <el-carousel
            v-else-if="
              state.graphType === 5 &&
              (explore || state.pieOptionData.length !== 2)
            "
            loop
            :autoplay="false"
            indicator-position="outside"
            class="pie-container"
            :arrow="state.pieOptionData.length === 1 ? 'never' : 'hover'"
            style="width: 100%; height: 100%"
            :type="w > 6 && !explore ? 'card' : ''">
            <el-carousel-item
              v-for="(item, index) in state.pieOptionData"
              :key="`pieOptionData_${index}`"
              :style="{
                width: w > 6 && !explore ? '50%' : '100%',
                height: '100%',
              }">
              <chart :options="item" height="100%"></chart>
            </el-carousel-item>
          </el-carousel>
          <div
            v-else-if="
              state.graphType === 5 &&
              !explore &&
              state.pieOptionData.length === 2
            "
            class="flex"
            style="width: 100%; height: 100%">
            <div
              v-for="(item, index) in state.pieOptionData"
              :key="`pieTweOptionData_${index}`"
              style="width: 50%; height: 100%">
              <chart :options="item" height="100%"></chart>
            </div>
          </div>
          <template v-else>
            <div v-if="showRateLabel" class="rate-label-view">
              <RateLabel :data="dashboardState.compareData" :w="w" />
              <chart
                :options="state.options"
                style="height: calc(100% - 54px)"></chart>
            </div>
            <chart v-else :options="state.options" height="100%"></chart>
          </template>
        </template>
      </div>
    </div>
  </CancelModal>
  <ResultClusterDialog
    ref="resultClusterRef"
    :qp="{}"
    :api="createEventResultSegmentation" />
  <ResultUserListDialog ref="userListRef" :analysisType="1" />

  <!-- 事件详情 -->
  <EventDetail :ref="(ref) => (state.eventDetailRef = ref)" />
</template>

<style scoped lang="scss">
.rate-label-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.is-show-diff {
  width: 100%;
  display: flex;
  justify-content: space-between;
}
</style>
