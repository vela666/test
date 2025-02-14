<template>
  <CommonLayout>
    <template #hl>
      <div class="flex-center gap15">
        <el-select v-model="filterConfig.field" placeholder="维度" class="w220">
          <template #label="{ label }">
            <span>{{ $t('system.usage.dimension') }} </span>
            <span>{{ label }}</span>
          </template>
          <el-option
            v-for="item in state.fieldList"
            :key="item.value"
            :label="item.label"
            :value="item.value" />
        </el-select>

        <el-select
          v-model="filterConfig.appIdList"
          multiple
          collapse-tags
          clearable
          filterable
          :reserve-keyword="false"
          collapse-tags-tooltip
          :placeholder="$t('system.usage.filterApp')"
          class="w220">
          <el-option
            v-for="item of state.appList"
            :key="item.appId"
            :label="item.appName"
            :value="item.appId" />
        </el-select>
        <!-- 合同服务期 -->
        <el-select
          v-if="filterConfig.field === 2"
          v-model="filterConfig.contractPeriod"
          filterable
          :placeholder="$t('system.usage.contractService')"
          class="w220">
          <el-option
            v-for="(item, index) of state.contractPeriodList"
            :key="index"
            :label="item"
            :value="item" />
        </el-select>

        <!-- 用量日期 -->
        <template v-if="filterConfig.field === 1">
          <el-date-picker
            v-model="filterConfig.date"
            type="daterange"
            :range-separator="$t('common.to')"
            style="width: 240px"
            :clearable="false"
            :disabled-date="(time) => time.getTime() > Date.now()"
            value-format="YYYY-MM-DD"
            :editable="false" />
          <el-radio-group v-model="filterConfig.type">
            <el-radio-button
              v-for="item in state.typeList"
              :key="item.value"
              :label="item.label"
              :value="item.value" />
          </el-radio-group>
        </template>

        <div>
          {{
            `${$t('system.usage.totalUsage')}(${
              domesticOverseasMark() === 1
                ? $t('common.domestic')
                : $t('common.abroad')
            })：`
          }}{{ thousandQuantileProcessing(state.dataQuantityTotal)
          }}{{
            state.abbreviationTotal === '0'
              ? ''
              : `（${state.abbreviationTotal}）`
          }}
        </div>
      </div>
    </template>
    <template #hr>
      <Tooltip>
        <SvgIcon
          @click="usageAnalysisFn"
          name="chart-barchart"
          class="fz20 c5473e8 c-pointer" />
        <template #content>{{ $t('system.usage.usageAnalysis') }}</template>
      </Tooltip>
    </template>
    <el-table
      v-loading="state.exhibitLoading"
      class="nd-table-custom"
      :data="state.pagedData"
      border>
      <el-table-column
        v-for="column of columns"
        :prop="column.prop"
        :key="column.label"
        :label="column.label"
        v-bind="{ ...column }"
        :show-overflow-tooltip="!!column.prop">
        <template #header>
          <div v-if="column.prop === 'contractPeriod'">
            {{
              filterConfig.field === 1
                ? $t('system.usage.usageDate')
                : $t('system.usage.contractServicePeriod')
            }}
          </div>
        </template>

        <template #default="{ row }">
          <el-button
            @click="detailsFn(row)"
            v-if="column.prop === 'useDetail'"
            text
            type="primary">
            {{ $t('system.usage.usageDetails') }}
          </el-button>
          <template v-else>
            {{
              thousandQuantileProcessing(
                row[column.prop],
                column.prop === 'dataQuantity'
              )
            }}
          </template>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <Pagination
        v-model:limit="filterConfig.size"
        v-model:page="filterConfig.page"
        :total="state.pageTotal" />
    </template>
  </CommonLayout>

  <CommonDrawer
    v-model="state.showDetails"
    size="700px"
    :loading="state.operateLoading"
    :title="$t('system.usage.usageDetails')"
    :showBtn="false"
    @close="closeDetails">
    <template #title>
      <div class="flex-center">
        <div class="mr20">{{ $t('system.usage.usageDetails') }}</div>
        <div class="c86919d fz14">
          <span class="mr20">{{ detailsState.detailsData.appName }}</span>
          <span>{{ detailsState.detailsData.appId }}</span>
        </div>
      </div>
    </template>
    <div class="flex-center flex-between c545e6e mb10">
      <span
        >{{ t('system.usage.contractServicePeriod') }}：{{
          detailsState.detailsData.contractPeriod
        }}</span
      >
      <span
        >{{ $t('system.usage.totalUsage') }}：
        {{
          thousandQuantileProcessing(detailsState.detailsData.dataQuantityTotal)
        }}</span
      >
    </div>
    <el-table
      class="nd-table-custom"
      :data="detailsState.detailsData.pageInfo.list"
      @sort-change="sortChange"
      border>
      <el-table-column
        prop="ptDate"
        :label="$t('common.date')"
        show-overflow-tooltip
        sortable="custom" />
      <el-table-column
        prop="total"
        :label="$t('system.usage.usage')"
        show-overflow-tooltip
        sortable="custom">
        <template #default="{ row }">
          {{ thousandQuantileProcessing(row.total) }}
        </template>
      </el-table-column>
    </el-table>
    <template #footer-r>
      <Pagination
        v-model:limit="detailsState.detailsSize"
        v-model:page="detailsState.detailsPage"
        :total="detailsState.detailsTotal"
        @getData="getDetails" />
    </template>
  </CommonDrawer>

  <CommonDrawer
    :loading="state.filterRuleLoading"
    :title="$t('system.usage.usageAnalysis')"
    size="850px"
    :needFooter="false"
    @close="closeUsageAnalysis"
    v-model="state.showUsageAnalysis">
    <el-collapse v-model="state.activeCollapse" class="nd-usage-analysis">
      <el-collapse-item
        v-for="(item, index) of state.usageAnalysisData"
        :key="index"
        :title="`${item.contractPeriod}${item.contractStatus ? `(${item.contractStatus})` : ''}`"
        :name="index">
        <div class="flex-center">
          <Chart
            width="320px"
            height="350px"
            ref="chartRef"
            :options="item.roundOption" />

          <Chart
            width="480px"
            height="350px"
            ref="chartRef"
            :options="item.barOption" />
        </div>
      </el-collapse-item>
    </el-collapse>
  </CommonDrawer>
</template>

<script setup>
import { watch, reactive, markRaw, ref } from 'vue'
import {
  asyncGetDetailed,
  asyncGetList,
  asyncGetReport,
  asyncGetSelectAppList,
  asyncGetSelectContractPeriodList,
} from '@/api/modules/usage-statistics.js'
import {
  delNullProperty,
  thousandQuantileProcessing,
} from '@/utils/dataProcessing'
import { debounce } from 'lodash-es'
import { past30DayStart, past30DayEnd } from '@/enumeration/date'
import { domesticOverseasMark } from '@/utils/domesticOverseas.js'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数

const initColumns = () => [
  {
    prop: 'appName',
    label: t('system.apps.appName'),
  },
  {
    prop: 'appId',
    label: 'App Id',
  },
  {
    prop: 'contractPeriod',
    label: t('system.usage.contractServicePeriod'),
  },
  {
    prop: 'dataQuantity',
    label: t('system.usage.usage'),
    align: 'right',
  },
  {
    prop: 'useDetail',
    label: t('system.usage.usageDetails'),
    IS_SHOW: true,
  },
]

const columns = ref(initColumns())

const initVal = () => {
  return {
    state: {
      pagedData: [],
      appList: [],
      abbreviationTotal: '0',
      dataQuantityTotal: 0,
      contractPeriodList: [],
      activeCollapse: [],
      showDetails: false,
      showUsageAnalysis: false,
      rowData: {},
      operateLoading: false,
      exhibitLoading: false,
      pageTotal: 0, // 总数

      usageAnalysisData: [],
      fieldList: [
        {
          value: 1,
          label: t('system.usage.usageDate'),
        },
        {
          value: 2,
          label: t('system.usage.contractServicePeriod'),
        },
      ],
      typeList: [
        {
          value: 1,
          label: t('common.day'),
        },
        {
          value: 2,
          label: t('common.week'),
        },
        {
          value: 3,
          label: t('common.month'),
        },
      ],
    },
    filterConfig: {
      appIdList: [],
      contractPeriod: '',
      // 分页器配置
      page: 1, // 当前页码
      size: 20, // 每页数量
      type: 1,
      field: 2,
      date: [past30DayStart, past30DayEnd],
    },
    // 明细数据
    details: {
      detailsData: {
        pageInfo: {
          list: [],
        },
      },
      detailsPage: 1,
      detailsSize: 20,
      detailsTotal: 0,
      sort: 'desc',
      sortFiled: 'ptDate',
    },
  }
}
const state = reactive(initVal().state)
const filterConfig = reactive(initVal().filterConfig)
const detailsState = reactive(initVal().details)

const usageAnalysisFn = async () => {
  state.showUsageAnalysis = true
  const { data } = await asyncGetReport()
  state.activeCollapse = data.map((item, index) => index)
  state.usageAnalysisData = data.map((item) => {
    const roundOption = {
      title: [
        {
          text: `${item.usagePercentage}%`,
          top: '35%',
          left: 'center',
          textStyle: {
            fontSize: 16,
            color: '#1f1f1f',
            fontWeight: 700,
          },
        },
        {
          text: `${t('system.usage.domesticUsage')}: ${item.domesticDataQuantity} \n${t('system.usage.abroadUsage')}: ${item.abroadDataQuantity} `,
          subtext: `${t('analysis.event.total')}: ${item.purchaseVolume}`,
          left: 'center',
          top: '70%',
          textStyle: {
            fontSize: '14',
            fontWeight: '700',
            color: '#86919d',
            textAlign: 'center',
            lineHeight: 30,
          },
          subtextStyle: {
            fontSize: '14',
            fontWeight: '700',
            color: '#86919d',
            textAlign: 'center',
          },
          textAlign: 'left',
        },
      ],
      polar: {
        // 第一项是内半径，第二项是外半径
        radius: ['56%', '50%'],
        // 第一项是横坐标，第二项是纵坐标
        center: ['50%', '40%'],
      },
      angleAxis: {
        max: 100,
        show: false,
      },
      radiusAxis: {
        type: 'category',
        show: true,
        axisLabel: {
          show: false,
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
      },
      series: [
        {
          name: '',
          type: 'bar',
          roundCap: true,
          barWidth: 60,
          showBackground: true,
          backgroundStyle: {
            color: '#f6f6f9',
          },
          data: [item.usagePercentage],
          coordinateSystem: 'polar',
          itemStyle: {
            normal: {
              color: '#5473e8',
            },
          },
        },
      ],
    }
    const barOption = {
      tooltip: {
        trigger: 'axis',
        enterable: true, //鼠标可进入提示框浮层中
        // 是否限制在可视区域
        confine: true,
        axisPointer: {
          type: 'shadow',
        },
        position(point, params, dom, rect, size) {
          return [point[1], 0]
        },
        formatter(params) {
          let html = ''
          params.forEach((v) => {
            html += ` <div>
                  <span class="fz14 txt-bold c86919d">${v.name}：</span><span class="c545e6e">${v.value}</span>
          </div>`
          })
          return html
        },
      },
      /*  legend: {
        itemHeight: 10,
        itemWidth: 10,
        // orient: 'vertical',
        icon: 'circle',
        // left: 'left',
        // 解决circle文字不对齐问题
      },*/
      xAxis: {
        type: 'category',
        axisLabel: {
          color: '#86919d',
          rotate: 45,
          formatter(v) {
            if (String(v).length > 6) {
              return v.substring(0, 6) + '...'
            } else {
              return v
            }
          },
          /*textStyle: {
            color: '#A6B9C8',
          },*/
        },
        // triggerEvent: true,
        axisPointer: {
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
        data: item.xAxisDataList,
      },
      yAxis: {
        name: `${t('system.usage.topUsage')}(${
          domesticOverseasMark() === 1
            ? t('common.domestic')
            : t('common.abroad')
        })`,
        nameTextStyle: {
          fontSize: '14',
          fontWeight: '700',
          color: '#1f1f1f',
          textAlign: 'center',
          padding: [0, 0, 0, 100],
        },
        type: 'value',
        axisLabel: {
          //这种做法就是在y轴的数据的值旁边拼接单位，貌似也挺方便的
          formatter(value, index) {
            if (value === 0) return value
            return value + t('system.usage.hundredMillion')
          },
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#e7e7ea',
            type: 'dashed',
          },
        },
      },
      series: [
        {
          type: 'bar',
          barGap: 0,
          label: {
            show: false,
          },
          emphasis: {
            focus: 'series',
          },
          // 设置柱子最大宽度为 30
          barMaxWidth: 20,
          itemStyle: {
            color: '#5473e8',
          },
          data: item.yAxisDataList,
        },
      ],
    }
    return {
      ...item,
      roundOption,
      barOption,
    }
  })
}

const closeUsageAnalysis = () => {
  state.usageAnalysisData = []
}

const detailsFn = async (row) => {
  state.showDetails = true
  state.rowData = markRaw(row)
  getDetails()
}

/**
 * @description 表格排序
 */
const sortChange = ({ column, prop, order }) => {
  detailsState.sort = order === 'ascending' ? 'asc' : !order ? '' : 'desc'
  detailsState.sortFiled = order ? prop : ''
  getDetails()
}

const getDetails = async () => {
  state.operateLoading = true
  const {
    data,
    data: {
      pageInfo: { page },
    },
  } = await asyncGetDetailed({
    appId: state.rowData.appId,
    contractPeriod: state.rowData.contractPeriod,
    page: detailsState.detailsPage,
    size: detailsState.detailsSize,
    sort: detailsState.sort,
    sortFiled: detailsState.sortFiled,
  }).finally((_) => {
    state.operateLoading = false
  })

  detailsState.detailsTotal = page.totalCount
  detailsState.detailsData = data
}

const closeDetails = () => {
  Object.assign(detailsState, initVal().details)
}

const getSelectAppList = async () => {
  const { data } = await asyncGetSelectAppList()
  state.appList = markRaw(data)
}

const getSelectContractPeriodList = async () => {
  const { data } = await asyncGetSelectContractPeriodList()
  state.contractPeriodList = markRaw(data)
  filterConfig.contractPeriod = data[0]
}

const getList = async () => {
  state.exhibitLoading = true

  const params = { ...filterConfig }

  if (params.field === 1) {
    params.contractPeriod = `${params.date[0]} ~ ${params.date[1]}`
  } else {
    params.type = null
  }

  const {
    data: {
      abbreviationTotal,
      dataQuantityTotal,
      pageInfo: { list, page },
    },
  } = await asyncGetList({
    ...delNullProperty(params),
  }).finally((_) => {
    state.exhibitLoading = false
  })
  state.pageTotal = page.totalCount
  state.pagedData = list
  state.abbreviationTotal = abbreviationTotal
  state.dataQuantityTotal = dataQuantityTotal
}

getSelectAppList()
getSelectContractPeriodList()
watch(
  () => filterConfig,
  debounce((val) => {
    if (!filterConfig.contractPeriod) return
    getList()
  }, 200),
  {
    deep: true,
    immediate: true,
  }
)

/**
 * @description: 维度切换
 * @return {*}
 */
const fieldChange = (val) => {
  if (val === 1) {
    filterConfig.type = 1
    filterConfig.date = [past30DayStart, past30DayEnd]
    columns.value = columns.value.filter((item) => !item.IS_SHOW)
  }
  if (val === 2) {
    columns.value = initColumns()
    filterConfig.contractPeriod = state.contractPeriodList[0]
  }
}

watch(
  () => filterConfig.field,
  (val) => {
    fieldChange(val)
  },
  {
    immediate: true,
  }
)

defineOptions({
  name: 'UsageStatistics',
})
</script>

<style scoped lang="scss">
.nd-usage-analysis {
  &.el-collapse {
    border: none;
  }
  :deep() {
    .el-collapse-item {
      border: none;
      &:not(:last-of-type) {
        .el-collapse-item__wrap {
          border-bottom: none;
        }
      }
    }
    .el-collapse-item__wrap {
      border-left: 1px solid var(--eas-border-color-2);
      border-right: 1px solid var(--eas-border-color-2);
      .el-collapse-item__content {
        padding: 10px;
      }
    }
    .el-collapse-item__header {
      //height: 32px;
      padding: 10px;
      background-color: var(--eas-color-primary-light-1);
      border: none;
    }
  }
}
</style>
