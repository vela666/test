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
                v-if="authEnum.add && ![2, 3].includes(state.createType)"
                text
                type="primary"
                @click="
                  buttonMethods.updData(state.basicInfoData, state.createType)
                ">
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
                  <el-button
                    v-if="[1, 8].includes(state.createType)"
                    text
                    type="primary"
                    @click="viewConfig">
                    {{ $t('user.viewConfig') }}
                  </el-button>
                </div>
                <template v-else-if="item.prop === 'createType'">
                  {{ groupTypeListMap[state.basicInfoData[item.prop]] }}
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
                    $t('user.userGroup.usersExceeding', [
                      state.basicInfoData.excludeSegmentationDay,
                    ])
                  }}
                </template>
                <template v-else-if="item.prop === 'property'">
                  {{ state.basicInfoData?.qp?.propertyNameDisplay }}
                </template>
                <template v-else-if="item.prop === 'defaultCluster'">
                  {{ defaultGroupType[state.basicInfoData.defaultCluster] }}
                </template>
                <template v-else-if="item.prop === 'belongCluster'">
                  {{
                    belongNotBelongGroupType[state.basicInfoData.belongCluster]
                  }}
                </template>
                <template v-else-if="item.prop === 'analyseId'">
                  {{ mapAnalyseId(state.basicInfoData.analyseId) }}
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
            <!--          <div class="c545e6e mb20">数据详情</div>-->
            <div v-loading="chartLoading" v-if="showChart">
              <div class="flex-between flex-center">
                <div class="c545e6e flex-center">
                  {{ $t('user.userGroup.groupHistoricalTrends') }}
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
                        <SvgIcon name="histogram1" />
                        <template #content> {{ $t('chart.bar') }} </template>
                      </Tooltip>
                    </el-radio-button>
                    <el-radio-button label="line" value="line">
                      <Tooltip>
                        <SvgIcon name="line1" />
                        <template #content> {{ $t('chart.line') }} </template>
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
  <IdGroup ref="idGroupRef" @getData="getData" />
  <SqlGroup ref="sqlGroupRef" @getData="getData" />
  <ConditionGroup ref="conditionGroupRef" @getData="getData" />
  <ResultClusterDialog showName ref="resultClusterRef" @getData="getData" />
</template>

<script setup>
import { computed, markRaw, reactive, ref, shallowRef } from 'vue'
import { useRoute } from 'vue-router'
import DefaultTable from './DefaultTable.vue'
import ViewConfig from './ViewConfig.vue'
import SqlGroup from '@/views/user/user-group/components/SqlGroup.vue'
import ConditionGroup from '@/views/user/user-group/components/ConditionGroup.vue'
import IdGroup from '@/views/user/user-group/components/IdGroup.vue'
// import ReportNum from '@/views/user/components/ReportNum.vue'
import ResultClusterDialog from '@/views/analysis/components/ResultClusterDialog/index.vue'

import useEvent from '@/views/user/user-group/hooks/useEvent'
import { asyncGetByIdGroupInfo } from '@/api/modules/user-group'

import { past7DayEnd, past7DayStart } from '@/enumeration/date'
import {
  dataUpdTypeListtMap,
  groupTypeListMap,
} from '@/enumeration/user/common'
import useChart from './useChart.js'
import { authEnum, authEnumDesc } from '../user-group/enum.js'
import { recordBehavior } from '@/utils/record-behavior.js'
import {
  modelType,
  defaultGroupType,
  belongNotBelongGroupType,
} from '@/enumeration/user/user-group.js'

import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数

recordBehavior({
  moduleName: '用户',
  submoduleName: '用户分群',
  operate: '进入数据详情页面',
})
const route = useRoute()
const options = shallowRef({
  tooltip: {
    trigger: 'axis',
    enterable: true, //鼠标可进入提示框浮层中
    confine: true, //将 tooltip 框限制在图表的区域内
    axisPointer: {
      type: 'shadow',
    },
    formatter(params) {
      let html = ''
      params.forEach((v) => {
        html += ` <div>
        <span class="fz14 txt-bold c86919d">${v.name}：</span><span class="c545e6e">${v.value}</span>
      </div>`
        // 标签值
        /*state.chartData.tagStatsList[v.dataIndex].forEach((item, index) => {
          html += `
             <div class="flex-center">
               <span class="mr5 nd-chart-tooltip-shape" style="background-color:${chartColor[index]}"></span>
               <span>${item.tagValue}：</span>
               <span>${item.usersNum}</span>
             </div>`
        })*/
      })
      return html
    },
  },
  /* legend: {
    itemHeight: 10,
    itemWidth: 10,
    // orient: 'vertical',
    icon: 'circle',
    // left: 'left',
    // 解决circle文字不对齐问题
  },*/
  grid: {
    // left: '8%',
    top: '7%',
    right: '4',
    // height: '65%',
    width: '92%',
  },
  xAxis: {
    type: 'category',
    // axisTick: { show: false, alignWithLabel: true },
    axisLabel: {
      color: '#86919d',
    },
    axisPointer: {
      //单个展示增加配置 只有hover柱状图 才显示提示
      show: true,
      type: 'shadow',
      label: {
        show: false,
      },
    },
    axisLine: {
      lineStyle: {
        color: '#cbd0d6',
      },
    },
  },
  yAxis: {
    type: 'value',
    axisLine: {
      // show: true,
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: '#e7e7ea',
        type: 'dashed',
      },
    },
  },
  dataZoom: {
    realtime: false,
    type: 'slider',
    show: true,
    xAxisIndex: [0],
    // realtime: false,
    filterMode: 'filter',
    // zoomLock: true,
    brushSelect: false,
    // throttle: 300,
    bottom: 5,
    left: '3%',
    start: 0,
    end: 100,
    // backgroundColor: '#F5F7FE',
    // left: '10%',
    // right: '10%',
    // width: '90%',
    // animation: false,
    // rangeMode: ['value', 'value'],
    // handleSize: 0,
    showDetail: false,
    showDataShadow: false,
    height: '6%',
  },
})

const chartRef = ref(null)
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
  chartType,
  showChart,
  errorList,
  chartsOption,
  chartLoading,
  getChartData,
} = useChart(state)

const btns = computed(() => {
  return [
    {
      type: 'edit',
      label: authEnumDesc.upd,
      show: authEnum.upd,
      icon: 'edit2',
    },
    /* {
      type: 'updData',
      label: '更新数据',
      show: authEnum.add && ![2, 3].includes(state.createType),
    },*/
    {
      type: 'saveAs',
      label: t('analysis.saveAs'),
      icon: 'save-as',
      show: authEnum.add && ![2, 3].includes(state.createType),
    },
    {
      type: 'export',
      label: t('user.userGroup.downloadConfigFile'),
      icon: 'download1',
      show: authEnum.exportIdConfig && state.createType === 2,
    },
    /* {
      type: 'delete',
      label: '删除',
      show: true,
    },*/
  ].filter((item) => item.show)
})

// 条件分群、自定义SQL分群
const conditionCustom = [1, 8]
const detailList = computed(() => {
  return [
    {
      label: `${t('user.userGroup.groupName')}：`,
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
      label: `${t('user.userGroup.groupType')}：`,
      prop: 'createType',
      show: true,
    },
    {
      label: `${t('user.updateMethod')}：`,
      prop: 'refreshType',
      show: true,
    },
    // 后端未做暂时隐藏
    /*  {
      prop: 'excludeSegmentationToggle',
      show:
        state.basicInfoData.excludeSegmentationToggle &&
        state.basicInfoData.refreshType === 1 &&
        state.basicInfoData.accumulation === 1,
      label: '移出分群：',
    },*/
    /* {
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
    {
      prop: 'property',
      show: state.createType === 2,
      label: t('user.userGroup.relatedFields'),
    },
    {
      prop: 'defaultCluster',
      show: conditionCustom.includes(state.createType),
      label: t('user.userGroup.defaultGroup'),
    },
    {
      prop: 'belongCluster',
      show:
        conditionCustom.includes(state.createType) &&
        state.basicInfoData.defaultCluster === 1,
      label: t('user.userGroup.belongingNotBelonging'),
    },
    {
      prop: 'analyseId',
      show:
        conditionCustom.includes(state.createType) &&
        state.basicInfoData.defaultCluster === 1,
      label: t('user.analysisModel'),
    },
  ].filter((item) => item.show)
})

const mapAnalyseId = (val) => {
  if (val) {
    const m = val.split(',')
    return modelType.reduce((p, item) => {
      if (m.includes(item.type)) {
        p += `${p ? ',' : ''}${item.label}`
      }
      return p
    }, '')
  }
  return '--'
}

const getBasicInfo = async () => {
  const { data } = await asyncGetByIdGroupInfo(state.id)
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
  idGroupRef,
  sqlGroupRef,
  resultClusterRef,
  conditionGroupRef,
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
@import './index.scss';
</style>
