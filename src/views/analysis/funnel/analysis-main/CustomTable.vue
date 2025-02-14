<script setup>
import { computed, ref, useAttrs } from 'vue'
import { AnalysisTable } from '@/views/analysis/components/AnalysisMain/index.js'
import { getPercentColor, isValidNumByCluster } from '@/utils/index.js'
import GroupDetailTable from './GroupDetailTable.vue'
import authEnum from '@/views/analysis/enum.js'
import { recordBehavior } from '@/utils/record-behavior.js'
import { t } from '@/locales/i18n'

const attrs = useAttrs()
const props = defineProps({
  result: {
    type: Object,
    default: () => ({}),
  },
  getStepTitle: {
    type: String,
    default: '',
  },
  hlFlag: {
    type: Boolean,
    default: true,
  },
  hrFlag: {
    type: Boolean,
    default: true,
  },
  titleFlag: {
    type: Boolean,
    default: true,
  },
  chartType: {
    type: String,
    default: 'bar',
  },
  stepStart: {
    type: Number,
    default: null,
  },
  stepEnd: {
    type: Number,
    default: null,
  },
})

const emits = defineEmits(['update:result', 'download'])

const resValue = computed({
  get: () => {
    return props.result
  },
  set: (val) => {
    emits('update:result', val)
  },
})

const download = () => {
  emits('download')
}

const groupDetailRef = ref(null)

const cellStyle = ({ row, columnIndex }) => {
  if (columnIndex >= 2) {
    let params
    params = row[`${resValue.value.funnelType}_rate_current_${columnIndex}`]
    const per = parseFloat(params)

    const pColor = getPercentColor(per)
    return {
      backgroundColor: pColor,
    }
  }
  return ''
}

// 漏斗结果分群参数
const getFunnelClusterParams = ({ row, item, i }) => {
  const type = 3
  const level = item.field.split('_')[1]
  const params = {
    appId: sessionStorage.getItem('appId'),
    data: {
      funnelResultClusterSql: resValue.value.resultClusterSql,
      level,
      resDay: '__all',
      retention: resValue.value.funnelType === 'cover' || i === 1 ? 1 : 2, //i === 1  表格第二列（下标为1）的都是留存用户计算
    },
    qp: JSON.stringify(resValue.value.dataQP),
    type,
    groupValue: row.group === t('analysis.total') ? [] : [row.group],
  }
  return params
}

defineOptions({ name: 'CustomTable' })
</script>
<template>
  <AnalysisTable
    :columns="resValue.columns[resValue.funnelType]"
    :data="resValue.tableData[resValue.funnelType]"
    :qp="resValue.dataQP"
    :cell-style="cellStyle"
    fileName="漏斗分析"
    :ref="(ref) => (resValue.analysisTableRef = ref)"
    v-bind="attrs"
    :analysisType="3">
    <template v-if="hlFlag" #hl>
      <el-radio-group v-model="resValue.funnelType">
        <el-radio-button value="cover" label="cover">{{
          $t('analysis.funnel.conversion')
        }}</el-radio-button>
        <el-radio-button value="loss" label="loss">{{
          $t('analysis.funnel.loss')
        }}</el-radio-button>
      </el-radio-group>
    </template>
    <template v-if="hrFlag" #hr>
      <Auth :value="authEnum[3].export">
        <el-button @click="download">
          <svg-icon name="async-export" class="fz16" />
          {{ $t('common.download') }}
        </el-button>
      </Auth>
    </template>
    <template v-if="titleFlag" #title>
      <div class="mb20 flex flex-level-center">
        {{ getStepTitle }}
        {{ $t('analysis.funnel.totalStep', [resValue.dataQP.events.length]) }}
        {{
          resValue.funnelType === 'cover'
            ? $t('analysis.funnel.conversionRate')
            : $t('analysis.funnel.lossRate')
        }}
      </div>
    </template>
    <template #column="{ item, row, i }">
      <span v-if="item.prop === 'group'" class="flex-center">
        <svg-icon
          name="add1"
          class="fz16 mr3 c-pointer"
          @click="groupDetailRef?.open(row[item.prop])" />
        {{ row[item.prop] }}
      </span>
      <!-- 转化/流失 -->
      <template v-else>
        <span v-if="i === 1">
          <template
            v-if="isValidNumByCluster(row[`${resValue.funnelType}_${i}`])">
            <span
              class="text-underline c-pointer"
              @click="
                resValue?.analysisTableRef?.openUserListDialog(
                  getFunnelClusterParams({
                    row,
                    item,
                    i,
                  })
                )
              ">
              {{ row[`${resValue.funnelType}_${i}`]?.toLocaleString() }}
            </span>
            <Tooltip
              :content="$t('analysis.createResultGroup')"
              placement="right">
              <svg-icon
                name="creator1"
                class="c-pointer"
                @click="
                  resValue.analysisTableRef.createCluster(
                    getFunnelClusterParams({
                      row,
                      item,
                      i,
                    })
                  )
                " />
            </Tooltip>
          </template>
          <template v-else>
            {{ row[`${resValue.funnelType}_${i}`]?.toLocaleString() }}
          </template>
        </span>
        <div v-else style="color: #1c2028">
          <div v-if="isValidNumByCluster(row[`${resValue.funnelType}_${i}`])">
            <span
              class="text-underline c-pointer"
              @click="
                resValue?.analysisTableRef?.openUserListDialog(
                  getFunnelClusterParams({
                    row,
                    item,
                    i,
                  })
                )
              ">
              {{ row[`${resValue.funnelType}_${i}`]?.toLocaleString() }}
            </span>
            <Tooltip
              :content="$t('analysis.createResultGroup')"
              placement="right">
              <svg-icon
                name="creator1"
                class="c-pointer"
                @click="
                  resValue.analysisTableRef.createCluster(
                    getFunnelClusterParams({
                      row,
                      item,
                      i,
                    })
                  )
                " />
            </Tooltip>
          </div>
          <div v-else>
            {{ row[`${resValue.funnelType}_${i}`]?.toLocaleString() }}
          </div>
          <div>
            <el-tooltip
              placement="right"
              :content="`${item.title}${$t('analysis.funnel.singleStep')}${resValue.funnelType === 'cover' ? $t('analysis.funnel.conversionRate') : $t('analysis.funnel.lossRate')}`"
              popper-class="table-column-popper">
              <span
                >{{ row[`${resValue.funnelType}_rate_current_${i}`] }}%</span
              >
            </el-tooltip>
          </div>
          <div>
            <el-tooltip
              placement="right"
              :content="`${item.title}${$t('analysis.funnel.tableTipTotal')}${resValue.funnelType === 'cover' ? $t('analysis.funnel.conversionRate') : $t('analysis.funnel.lossRate')}`"
              popper-class="table-column-popper">
              <span>{{ row[`${resValue.funnelType}_rate_total_${i}`] }}%</span>
            </el-tooltip>
          </div>
        </div>
      </template>
    </template>
  </AnalysisTable>
  <GroupDetailTable
    ref="groupDetailRef"
    :columns="resValue.columns[resValue.funnelType]"
    :data="resValue.dataSource"
    :resultClusterSql="resValue.resultClusterSql"
    :qp="resValue.dataQP"
    :chart-type="chartType"
    :funnelType="resValue.funnelType"
    :step-start="stepStart"
    :step-end="stepEnd" />
</template>
<style lang="scss" scoped></style>
