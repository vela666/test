<script setup>
import { computed, ref } from 'vue'
import EventSidebar from './components/EventSidebar/index.vue'
import useEventAnalysis from './hooks/useEventAnalysis.js'
import DropDownSelector from './components/DropDownSelector/index.vue'
import TableComparativeSelect from './components/TableComparativeSelect/index.vue'
import { ChartType } from '@/views/analysis/components/AnalysisMain/index.js'
import { dataSegmentation } from '@/views/analysis/hooks/utils.js'
import { thousandsFilter } from '@/utils'
import ResultClusterDialog from '@/views/analysis/components/ResultClusterDialog/index.vue'
import ResultUserListDialog from '@/views/analysis/components/ResultUserListDialog/index.vue'
import { isObject } from 'lodash-es'
import { createEventResultSegmentation } from '@/api/modules/common'
import authEnum from '@/views/analysis/enum.js'
import EventDetail from './components/EventDetail/index.vue'

defineOptions({
  name: 'Event',
})
const eventSidebarRef = ref(null)
const resTableRef = ref(null)
const {
  state,
  fetchRequestData,
  changeGraphType,
  changeTableType,
  loading,
  changeTimeValue,
  showChartTypeList,
  handleCheckedGroupChange,
  eventCheckChange,
  groupSortChange,
  filterGroupChange,
  exportTableData,
  diffCalculation,
  analysisData,
  reportInfo,
  dataCache,
  exportDataHandle,
  showCluster,
  resetTableRow,
  getClusterParams,
  showEventDetail,
  getEventDetailParams,
  requestId,
  cancelFetchRequest,
  getSortArr,
  clearView,
} = useEventAnalysis({ eventSidebarRef, resTableRef })
const selectInnerWidth = computed(() => state.selectInnerWidth)
const resultClusterRef = ref(null)
const openClustDialog = (params = {}) => {
  resultClusterRef.value?.open(isObject(params) ? params : {})
}
const userListRef = ref(null)
const openUserListDialog = (params = {}) => {
  userListRef.value?.open(isObject(params) ? params : {})
}
</script>

<template>
  <AnalysisLayout
    :titleTip="$t('analysis.event.analysisTips')"
    :sqlContent="state.sqlList"
    :reportType="1"
    asyncExport
    v-model:reportInfo="reportInfo"
    v-model:approx-val="state.approxVal"
    @calcute="(type) => analysisData(type)"
    @exportData="exportDataHandle">
    <template #lb>
      <EventSidebar
        ref="eventSidebarRef"
        @analysis="fetchRequestData"
        @clearView="clearView"
        :loading="loading"
        v-model:reportInfo="reportInfo"
        :parentState="state" />
    </template>
    <template #rb>
      <CancelModal
        :loading="loading"
        :requestId="requestId"
        @cancelCalculate="cancelFetchRequest">
        <div class="event-analysis-right">
          <div class="flex-center-space-between">
            <div class="flex-center">
              <DateRangeSelect
                v-model="state.dateRange"
                placement="bottom-start"
                @change="(val) => changeTimeValue(val, 'dateDropDown')">
                <EventComparison
                  :date="state.dateRange"
                  v-model="state.versus"
                  @apply="(val) => changeTimeValue(val, 'versus')" />
              </DateRangeSelect>
              <div class="ml10">
                <PeriodTypeSelect
                  v-model="state.particleType"
                  :limit="['day', 'hour', 'summary']"
                  @change="(val) => changeTimeValue(val, 'changeTimeValue')" />
              </div>
            </div>
            <ChartType
              v-if="![0, -1].includes(state.viewStatus)"
              v-model="state.graphType"
              :data="showChartTypeList"
              @change="changeGraphType" />
          </div>
          <div class="visualization" v-if="[0, -1].includes(state.viewStatus)">
            <empty :desc="state.descMsg"></empty>
          </div>
          <div v-else v-show="!loading">
            <div class="chart-container">
              <div class="chart-tool">
                <AnalysisUpdateTime :time="state.resultGenerateTime" />
                <div>
                  <DropDownSelector v-if="dataCache?.y?.length > 1">
                    <template #default>
                      {{ $t('analysis.event.indicatorSelected') }}
                      {{ state.eventCheckList.length }}/
                      {{ state.eventCheckOptions.length }}
                    </template>
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
                  <DropDownSelector v-if="state.versus.length > 1">
                    <template #default>
                      {{ $t('analysis.event.comparisonSelected') }}
                      {{ state.selectedStageChartIndex.length - 1 }}/
                      {{ state.versus.length }}
                    </template>
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
                  <GroupSelect
                    v-if="state.unionGroups.length > 1"
                    v-model="state.groupOptions"
                    :data="state.unionGroups"
                    @change="handleCheckedGroupChange" />
                  <sort-drop
                    v-if="state.unionGroups.length > 1 && state.graphType !== 5"
                    v-model="state.sortType"
                    class="mr10"
                    @change="groupSortChange"></sort-drop>
                  <ShowChartLabel
                    v-model="state.showChartLabel"
                    :show="state.graphType !== 5"
                    @updChart="groupSortChange" />
                </div>
              </div>
              <LimitNotice
                v-if="state.dataDesc"
                v-model="state.noticeFlag"
                :text="state.dataDesc" />
              <el-carousel
                v-if="state.graphType === 5"
                loop
                :autoplay="false"
                indicator-position="outside"
                class="pie-container"
                :arrow="state.pieOptionData.length === 1 ? 'never' : 'hover'">
                <el-carousel-item
                  v-for="(item, index) in state.pieOptionData"
                  :key="`pieOptionData_${index}`"
                  style="width: 100%; height: 400px">
                  <chart :options="item" height="400px"></chart>
                </el-carousel-item>
              </el-carousel>
              <chart v-else :options="state.options" height="400px"></chart>
            </div>
            <div class="table-container">
              <div class="table-tool">
                <div class="group-search">
                  <el-input
                    v-model="state.filterGroupsValue"
                    :placeholder="$t('analysis.event.filterGroup')"
                    v-if="state.unionGroups.length > 0"
                    @input="filterGroupChange">
                    <template #prepend>
                      <el-select
                        placeholder=""
                        v-model="state.filterGroups"
                        class="filter-group-select"
                        @change="filterGroupChange"
                        :style="{
                          width: selectInnerWidth,
                          'max-width': '350px',
                        }">
                        <el-option
                          v-for="(item, index) in state.filterGroupsOptions"
                          :key="'filterGroupsOptions' + index"
                          :label="item.label"
                          :value="item.value" />
                      </el-select>
                    </template>
                    <template #prefix>
                      <SvgIcon class="c86919d" name="search" />
                    </template>
                  </el-input>
                </div>
                <div>
                  <!--  对比阶段 -->
                  <TableComparativeSelect
                    v-show="state.versus.length > 1"
                    v-model="state.selectedStageTableIndex"
                    :versus="state.versus"
                    @change="changeTableType" />
                  <el-select
                    placeholder="请选择"
                    v-model="state.tableType"
                    style="width: 100px; margin-left: 10px"
                    @change="changeTableType">
                    <el-option
                      :label="$t('analysis.event.byDate')"
                      :value="1" />
                    <el-option
                      :label="$t('analysis.event.byEvent')"
                      :value="2" />
                    <el-option
                      :label="$t('analysis.event.byGroup')"
                      :value="3"
                      v-if="state.unionGroups.length > 0" />
                  </el-select>
                  <Auth :value="authEnum[1].export">
                    <el-button class="btn-w32 ml10" @click="exportTableData">
                      <svg-icon
                        name="async-export"
                        class="fz18 c545e6e"></svg-icon>
                      {{ $t('common.download') }}
                    </el-button>
                  </Auth>
                </div>
              </div>
              <div style="width: 100%">
                <VxeTableSort
                  ref="resTableRef"
                  :columns="state.columnList"
                  :data="state.tableData"
                  :min-height="100"
                  @getSortArr="getSortArr"
                  pageFlag>
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
                                    '',
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
                                      '',
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
                                    '',
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
                        <span v-else>{{
                          diffCalculation(row[column.field])
                        }}</span>
                      </div>
                    </div>
                    <div v-else>
                      <div style="height: 100%">
                        <template v-if="showCluster(row, index, column.field)">
                          <span
                            class="text-underline c-pointer"
                            @click="
                              openUserListDialog(
                                getClusterParams({ row, column })
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
                                  getClusterParams({ row, column })
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
                                getEventDetailParams({ row, column })
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
              </div>
            </div>
          </div>
        </div>
      </CancelModal>
    </template>
  </AnalysisLayout>
  <ResultClusterDialog
    ref="resultClusterRef"
    :qp="{}"
    :api="createEventResultSegmentation" />
  <ResultUserListDialog ref="userListRef" :analysisType="1" />

  <!-- 事件详情 -->
  <EventDetail :ref="(ref) => (state.eventDetailRef = ref)" />
</template>

<style scoped lang="scss">
.flex-center {
  display: flex;
  align-items: center;
}
.flex-center-space-between {
  @extend .flex-center;
  justify-content: space-between;
}
.flex-center-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
.event-analysis-right {
  width: 100%;
  height: 100%;
  padding: 20px;
  overflow: hidden auto;
}
.visualization {
  width: 100%;
  height: calc(100% - 32px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.chart-tool,
.table-tool {
  height: 32px;
  width: 100%;
  margin: 20px 0px;
}
.table-tool {
  @extend .flex-center-space-between;
}
.chart-tool {
  @extend .flex-center-space-between;
}
.chart-container {
  width: 100%;
}
.table-container {
  width: 100%;
}
.group-search {
  .el-input {
    min-width: 300px;
    :deep() {
      .el-input-group__prepend {
        background: #fff;
        .el-input__wrapper {
          border-radius: 4px 0px 0px 4px;
        }
      }
      .el-input__wrapper {
        border-radius: 0px 4px 4px 0px;
      }
    }
  }
}
.pie-container {
  width: 100%;
  height: 400px;
  :deep() {
    .el-carousel__container {
      width: 100%;
      height: 400px;
    }
  }
  .el-carousel__item {
    width: 100%;
    height: 400px;
  }
}
.is-show-diff {
  width: 100%;
  display: flex;
  justify-content: space-between;
}
</style>
