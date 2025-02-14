<template>
  <CommonDetailPage
    :title="$t('user.dataDetails')"
    v-loading="state.fullLoaing">
    <CommonLayout>
      <div class="nd-user-data-detail flex fz14">
        <div class="nd-user-data-detail-l flex-column flex-between">
          <div class="flex-column gap20">
            <div class="c545e6e flex-center flex-between">
              {{ $t('login.basicInformation') }}
              <el-button
                @click="
                  buttonMethods.updData(state.basicInfoData, state.createType)
                "
                v-if="authEnum.add"
                text
                type="primary">
                <SvgIcon name="refresh1" class="mr5" />
                {{ $t('user.refreshData') }}
              </el-button>
            </div>
            <div
              class="flex flex-between"
              v-for="(item, index) of detailList"
              :key="index">
              <div class="c86919d nd-base-info-label">{{ item.label }}</div>
              <div class="c545e6e nd-base-info-value">
                <div
                  class="flex-center no-wrap gap10"
                  v-if="item.prop === 'name'">
                  <span class="nd-name" v-showTips>{{
                    state.basicInfoData[item.prop]
                  }}</span>
                  <el-button @click="viewConfig" text type="primary">
                    {{ $t('user.viewConfig') }}
                  </el-button>
                </div>

                <template v-else-if="item.prop === 'createType'">
                  {{ tagTypeListMap[state.basicInfoData[item.prop]] }}
                </template>
                <div
                  class="flex-center"
                  v-else-if="item.prop === 'refreshType'">
                  {{ dataUpdTypeListtMap[state.basicInfoData[item.prop]] }}
                  <span v-if="state.basicInfoData[item.prop] === 1">
                    ({{
                      state.basicInfoData.accumulation === 0
                        ? $t('user.cover')
                        : $t('user.increment')
                    }})
                  </span>
                </div>
                <!--                <template v-else-if="item.prop === 'reportNum'">
                  <span v-if="!state.basicInfoData[item.prop]">{{
                    state.basicInfoData[item.prop]
                  }}</span>
                  <ReportNum :row="state.basicInfoData" v-else>
                    {{ state.basicInfoData[item.prop] }}
                  </ReportNum>
                </template>-->
                <template v-else-if="item.prop === 'excludeSegmentationToggle'">
                  {{
                    $t('user.userTag.userTagExceeding', [
                      state.basicInfoData.excludeSegmentationDay,
                    ])
                  }}
                </template>
                <template v-else>
                  {{ state.basicInfoData[item.prop] }}
                </template>
              </div>
            </div>
          </div>
          <div class="nd-user-data-detail-operate">
            <div class="flex gap20 flex-center flex-level-center">
              <template v-for="(item, index) of btns" :key="item.type">
                <el-button
                  text
                  @click="
                    buttonMethods[item.type](
                      state.basicInfoData,
                      state.createType
                    )
                  ">
                  <SvgIcon :name="item.icon" class="mr5" />
                  {{ item.label }}
                </el-button>
                <div class="line" v-show="index !== btns.length - 1" />
              </template>
            </div>
          </div>
        </div>
        <div class="nd-user-data-detail-r">
          <div>
            <div v-loading="chartLoading">
              <div class="flex-between flex-center">
                <div class="c545e6e flex-center">
                  {{ $t('user.userTag.tagHistoryDetails') }}
                  <Tooltip
                    v-if="!!errorList.length"
                    effect="light"
                    placement="right">
                    <template #content>
                      <div>
                        <div v-for="item of errorList" :key="item">
                          {{ item.dayStr }}： {{ item.extraInfo }}
                        </div>
                      </div>
                    </template>
                    <SvgIcon name="warning1" class="cf53f3f ml3 fz16" />
                  </Tooltip>
                </div>
                <div class="flex-center gap10">
                  <DateRangeSelect
                    v-model="state.date"
                    @change="getChartData"
                    :needDynamic="false" />
                  <el-radio-group
                    class="nd-chart-type-cutover"
                    v-model="chartType">
                    <el-radio-button label="bar" value="bar">
                      <Tooltip>
                        <SvgIcon name="chart-stackbar" />
                        <template #content>{{ $t('chart.barStack') }}</template>
                      </Tooltip>
                    </el-radio-button>
                  </el-radio-group>
                </div>
              </div>
              <Chart
                class="mb20"
                height="300px"
                ref="chartRef"
                :options="chartsOption" />
            </div>
            <DefaultTable
              :groupName="state.basicInfoData.name"
              ref="defaultTableRef"
              v-model:customColumn="state.customColumnSelected" />
          </div>
        </div>
      </div>
    </CommonLayout>
  </CommonDetailPage>
  <ViewConfig ref="viewConfigRef" />
  <FirstLastFeature ref="firstLastFeatureRef" @getData="getData" />
  <SqlTag ref="sqlTagRef" @getData="getData" />
  <ConditionTag ref="conditionTagpRef" @getData="getData" />
  <Indicator ref="indicatorRef" @getData="getData" />
</template>

<script setup>
import { computed, markRaw, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import DefaultTable from './DefaultTable.vue'
import ViewConfig from './ViewConfig.vue'
import ConditionTag from '@/views/user/user-tag/components/ConditionTag/index.vue'
import FirstLastFeature from '@/views/user/user-tag/components/FirstLastFeature/index.vue'
import SqlTag from '@/views/user/user-tag/components/SqlTag.vue'
import Indicator from '@/views/user/user-tag/components/Indicator/index.vue'
// import ReportNum from '@/views/user/components/ReportNum.vue'

import useEvent from '@/views/user/user-tag/hooks/useEvent'
import { asyncGetByIdTagInfo } from '@/api/modules/user-tag'

import { past7DayEnd, past7DayStart } from '@/enumeration/date'
import { dataUpdTypeListtMap, tagTypeListMap } from '@/enumeration/user/common'

import useChart from './useChart.js'
import { authEnum, authEnumDesc } from '../user-tag/enum.js'
import { recordBehavior } from '@/utils/record-behavior.js'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数

recordBehavior({
  moduleName: '用户',
  submoduleName: '用户标签',
  operate: '进入数据详情页面',
})

const route = useRoute()

const viewConfigRef = ref(null)
const defaultTableRef = ref(null)
const initVal = () => {
  return {
    state: {
      date: {
        date: [past7DayStart, past7DayEnd],
        diff: '',
      },
      // 页面数据总数
      pageTotal: 0,
      id: '',
      createType: '',
      basicInfoData: {},
      customColumnSelected: [],
      fullLoaing: false,
    },
  }
}

const state = reactive(initVal().state)

const { id, createType } = route.query
if (id && createType) {
  state.id = +id
  state.createType = +createType
}

const {
  chartRef,
  chartType,
  errorList,
  chartsOption,
  chartLoading,
  getChartData,
} = useChart(state)

const btns = [
  {
    type: 'edit',
    label: authEnumDesc.upd,
    show: authEnum.upd,
    icon: 'edit2',
  },
  /* {
    type: 'updData',
    label: '更新数据',
    show: authEnum.add,
  },*/
  {
    type: 'saveAs',
    label: t('analysis.saveAs'),
    icon: 'save-as',
    show: authEnum.add,
  },
  /* {
    type: 'delete',
    label: '删除',
    show: true,
  },*/
].filter((item) => item.show)

const detailList = computed(() => {
  return [
    {
      label: `${t('user.userTag.tagName')}：`,
      prop: 'name',
      show: true,
    },
    {
      label: `${t('user.displayName')}：`,
      prop: 'displayName',
      show: true,
    },
    {
      label: `${t('user.numberPeople')}：`,
      prop: 'usersNum',
      sortable: 'custom',
      show: true,
    },
    {
      label: `${t('user.userTag.tagType')}：`,
      prop: 'createType',
      show: true,
    },
    {
      label: `${t('user.updateMethod')}：`,
      prop: 'refreshType',
      show: true,
    },
    {
      prop: 'excludeSegmentationToggle',
      show:
        state.basicInfoData.excludeSegmentationToggle &&
        state.basicInfoData.refreshType === 1 &&
        state.basicInfoData.accumulation === 1,
      label: `${t('user.userTag.removeTag')}：`,
    },
    /*  {
      label: '应用报表数：',
      prop: 'reportNum',
      show: true,
    },*/
    {
      label: `${t('common.createBy')}：`,
      prop: 'creator',
      show: true,
    },
    {
      label: `${t('user.dataUpdateTime')}：`,
      prop: 'refreshTime',
      show: true,
    },
    {
      label: `${t('common.remark')}：`,
      prop: 'remark',
      show: true,
    },
  ].filter((item) => item.show)
})

const getBasicInfo = async () => {
  const { data } = await asyncGetByIdTagInfo(state.id)
  state.basicInfoData = markRaw({ ...data, qp: JSON.parse(data.qp) })
}

const getData = async (isSaveAs) => {
  if (isSaveAs) return
  try {
    state.fullLoaing = true
    await getBasicInfo()
    defaultTableRef.value.getTableData(state.id)
    getChartData()
  } catch (e) {
    console.log(e)
  }
  state.fullLoaing = false
}
const {
  sqlTagRef,
  conditionTagpRef,
  indicatorRef,
  firstLastFeatureRef,
  buttonMethods,
} = useEvent(getData)

const viewConfig = () => {
  viewConfigRef.value.open(state.basicInfoData)
}

getData()
defineOptions({
  name: 'DataDetail',
})
</script>

<style scoped lang="scss">
:deep(.common-layout-container) {
  padding-right: 0;
}
@import '@/views/user/group-data-detail/index';
</style>
