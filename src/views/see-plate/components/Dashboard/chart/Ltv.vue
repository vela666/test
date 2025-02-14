<script setup>
import { ref, toRef, provide, computed } from 'vue'
import useDashboardLtv from '@/views/analysis/ltv/hooks/useDashboardLtv.js'
import GroupDetailTable from '@/views/analysis/ltv/components/ltv-main/GroupDetailTable.vue'
import ChartCardHeader from '@/views/see-plate/components/Dashboard/components/ChartCardHeader/index.vue'
import { dataTypeList } from '@/enumeration/index.js'
import { thousandsFilter } from '@/utils/index.js'
import authEnum from '@/views/analysis/enum.js'
import ResultClusterDialog from '@/views/analysis/components/ResultClusterDialog/index.vue'
import ResultUserListDialog from '@/views/analysis/components/ResultUserListDialog/index.vue'
import { createLtvResultSegmentation } from '@/api/modules/common'
import { isObject } from 'lodash-es'

defineOptions({
  name: 'Ltv',
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

const {
  state,
  changeGraphType,
  shoWSameTime,
  showGroupDrop,
  hasGroup,
  showDetailBtn,
  showDetailTable,
  showTips,
  showCluster,
  dashboardChartTypeList,
  exportTableData,
  reCalculateData,
  changeDataView,
  getData,
  getInfo,
  requestId,
  cancelFetchRequest,
  disableExport,
  getClusterParams,
  getSetting,
} = useDashboardLtv(props, emits)

const groupDetailRef = ref(null)
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
  getInfo,
  loading: toRef(state, 'loading'),
  export: exportTableData,
  disableExport,
  getSetting,
})
</script>

<template>
  <CancelModal
    :loading="state.loading"
    :requestId="requestId"
    @cancelCalculate="cancelFetchRequest">
    <div class="dashboard-analysis-card">
      <chart-card-header>
        <template #left>
          <DateRangeSelect
            :showBorder="false"
            :dateIcon="false"
            v-model="state.dateRange"
            placement="bottom-start"
            @change="() => reCalculateData(false)" />
          <KeepCycle
            :showBorder="false"
            placement="bottom"
            v-model="state.unitCycle"
            @change="(val) => reCalculateData(false, val, 'unitCycle')" />
          <DropSelectorSingle
            :showBorder="false"
            width="150"
            v-model="state.dateType"
            :data="
              dataTypeList.filter(
                (v) => state.unitCycle.type === 'day' || v.value === 0
              )
            "
            @change="() => reCalculateData(false)" />
          <template v-if="state.graphType !== 6">
            <GroupSelect
              v-if="showGroupDrop"
              :showBorder="false"
              placement="bottom"
              v-model="state.groupOptions"
              :data="state.unionGroups"
              :title="hasGroup ? $t('analysis.group') : $t('analysis.time')"
              @change="changeDataView" />
          </template>
          <SettingShow
            :unitCycle="state.unitCycle.type"
            v-model="state.keyDays"
            :showBorder="false"
            placement="bottom"
            @change="changeDataView" />
          <AnalysisUpdateTime :time="state.resultGenerateTime" />
        </template>
        <template #right>
          <ShowChartLabel
            :showBorder="false"
            v-model="state.showChartLabel"
            v-if="state.graphType !== 6"
            @updChart="changeDataView" />
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
            <Auth :value="authEnum[9].export">
              <el-tooltip
                :content="$t('analysis.exportDataTip')"
                placement="top"
                :hide-after="0">
                <el-button
                  class="p0 m0 nd-operate-btn-active fz28"
                  text
                  @click="exportTableData">
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
            @change="changeGraphType"></sort-drop>
        </template>
      </chart-card-header>
      <div class="chart-view-body">
        <empty
          v-if="[0, -1].includes(state.status)"
          :desc="state.descMsg"></empty>
        <template v-else>
          <chart
            v-if="state.graphType !== 6"
            :options="state.options"
            height="100%"></chart>
          <VxeTableSort
            v-else
            :columns="state.columnList"
            :data="state.tableData"
            min-height="100"
            width="100%"
            max-height="100%"
            :empty-text="
              state.loading ? $t('analysis.loading') : $t('common.noData')
            ">
            <template #customColumn="{ row, column, index }">
              <div v-if="index === 0">
                <span v-if="showDetailBtn(row, index)">
                  <svg-icon
                    name="add1"
                    class="mr5 c-pointer"
                    v-if="showDetailBtn(row, index, 'btn')"
                    @click="showDetailTable(row, groupDetailRef)" />
                </span>
                <span>{{ row[column.field] }}</span>
              </div>
              <template v-else>
                <template v-if="showTips(row, index)">
                  <el-tooltip placement="top" :hide-after="0">
                    <template #content>
                      * {{ $t('analysis.ltv.onlyDisplay') }}
                    </template>
                    <div style="width: 100%">
                      <div>
                        <span>{{ thousandsFilter(row[column.field]) }}</span>
                      </div>
                      <div v-if="row[column.field + '_user'] !== undefined">
                        <span>{{
                          thousandsFilter(row[column.field + '_user'])
                        }}</span>
                      </div>
                      <div class="table_tip__info">*</div>
                    </div>
                  </el-tooltip>
                </template>
                <template v-else>
                  <div>
                    <div>
                      <template
                        v-if="
                          showCluster(
                            row,
                            index,
                            column.field,
                            state.onlyUserAction ? 2 : 1
                          )
                        ">
                        <span
                          class="text-underline c-pointer"
                          @click="
                            openUserListDialog(
                              getClusterParams(
                                { row, column },
                                index,
                                state.onlyUserAction ? 2 : 1
                              )
                            )
                          ">
                          {{ thousandsFilter(row[column.field]) }}
                        </span>
                        <svg-icon
                          class="ml5 c-pointer"
                          name="creator1"
                          @click="
                            openClustDialog(
                              getClusterParams(
                                { row, column },
                                index,
                                state.onlyUserAction ? 2 : 1
                              )
                            )
                          " />
                      </template>
                      <span v-else>{{
                        thousandsFilter(row[column.field])
                      }}</span>
                    </div>
                    <div v-if="row[column.field + '_user'] !== undefined">
                      <template
                        v-if="
                          showCluster(row, index, column.field + '_user', 2)
                        ">
                        <span
                          class="text-underline c-pointer"
                          @click="
                            openUserListDialog(
                              getClusterParams({ row, column }, index, 2)
                            )
                          ">
                          {{ thousandsFilter(row[column.field + '_user']) }}
                        </span>
                        <svg-icon
                          class="ml5 c-pointer"
                          name="creator1"
                          @click="
                            openClustDialog(
                              getClusterParams({ row, column }, index, 2)
                            )
                          " />
                      </template>
                      <span v-else>{{
                        thousandsFilter(row[column.field + '_user'])
                      }}</span>
                    </div>
                  </div>
                </template>
              </template>
            </template>
          </VxeTableSort>
        </template>
      </div>
    </div>
  </CancelModal>
  <group-detail-table ref="groupDetailRef"></group-detail-table>
  <ResultClusterDialog
    ref="resultClusterRef"
    :qp="{}"
    :api="createLtvResultSegmentation" />
  <ResultUserListDialog ref="userListRef" :analysisType="9" />
</template>

<style scoped lang="scss">
.table_tip__info {
  position: absolute;
  top: -3px;
  right: 5px;
}
</style>
