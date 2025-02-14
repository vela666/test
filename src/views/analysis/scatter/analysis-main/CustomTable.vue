<script setup>
import { computed, ref, useAttrs } from 'vue'
import { AnalysisTable } from '@/views/analysis/components/AnalysisMain/index.js'
import GroupDetailTable from './GroupDetailTable.vue'
import {
  getPercentColor,
  formatDateWithWeek,
  isValidNumByCluster,
} from '@/utils/index.js'

const attrs = useAttrs()
const props = defineProps({
  result: {
    type: Object,
    default: () => ({}),
  },
})

const emits = defineEmits(['update:result'])

const resValue = computed({
  get: () => {
    return props.result
  },
  set: (val) => {
    emits('update:result', val)
  },
})

const groupDetailRef = ref(null)

const cellStyle = ({ row, columnIndex }) => {
  if (columnIndex >= 2) {
    let params
    params = row[`col_rate_${columnIndex}`]
    const per = parseFloat(params)
    const pColor = getPercentColor(per)
    return {
      backgroundColor: pColor,
    }
  }
  return ''
}

// 分布分析结果分群参数
// { title: '离散数字',fEh: 'def' },
// { title: '自定义区间',fEh: 'user_defined' },
// { title: '默认区间',fEh: 'def_interval' },
const getScatterClusterParams = ({ row, item, i }) => {
  const intervalType = resValue.value.dataQP?.events.intervalType
  let minValue = ''
  let maxValue = ''
  if (/\d+/.test(item.title)) {
    const numReg = /(\[|\()(\d+(\.\d+)?|-∞)(~|,)(\d+(\.\d+)?|\+?∞)\).*/
    const range = item.title.replace(numReg, '$2$4$5').split('~')
    if (range.length === 2) {
      if (item.title.includes('-∞')) {
        minValue = ''
        maxValue = range[1]
      } else if (item.title.includes('∞')) {
        minValue = range[0]
        maxValue = ''
      } else {
        minValue = range[0]
        maxValue = range[1]
      }
    } else {
      minValue = maxValue = range[0]
    }
  }

  const params = {
    data: {
      clusterSql: resValue.value.resultClusterSql,
      minValue,
      maxValue,
      statisticDate: formatDateWithWeek(row.date, true),
      type:
        intervalType === 'def' ? 0 : intervalType === 'def_interval' ? 1 : 2, // 类型：0 离散 1 默认区间 2 自定义区间
    },
    qp: JSON.stringify(resValue.value.dataQP),
    type: 6,
    groupValue: [],
  }
  return params
}

defineExpose({
  getTableRef() {
    return resValue.value.analysisTableRef?.getTableRef()
  },
})

defineOptions({
  name: 'CustomTable',
})
</script>
<template>
  <AnalysisTable
    :columns="resValue.columns"
    :data="resValue.tableData"
    :exportable="false"
    :cell-style="cellStyle"
    file-name="分布分析"
    :ref="(ref) => (resValue.analysisTableRef = ref)"
    :needHeader="false"
    :analysisType="6"
    v-bind="attrs">
    <template #column="{ item, row, i }">
      <span v-if="item.prop === 'date'" class="flex-center">
        <svg-icon
          name="add1"
          class="fz16 mr3 c-pointer"
          @click="groupDetailRef?.open(row)"
          v-if="resValue.dataQP.groupBy?.length > 0" />
        {{ row[item.prop] }}
      </span>
      <template v-else>
        <div :style="{ color: i === 1 ? '' : '#1C2028' }">
          <div v-if="isValidNumByCluster(row[`col_${i}`])">
            <span
              class="text-underline c-pointer"
              @click="
                resValue?.analysisTableRef?.openUserListDialog(
                  getScatterClusterParams({
                    row,
                    item,
                    i,
                  })
                )
              ">
              {{ row[`col_${i}`]?.toLocaleString() }}
            </span>
            <Tooltip
              :content="$t('analysis.createResultGroup')"
              placement="right">
              <svg-icon
                name="creator1"
                class="c-pointer"
                @click="
                  resValue.analysisTableRef.createCluster(
                    getScatterClusterParams({
                      row,
                      item,
                      i,
                    })
                  )
                " />
            </Tooltip>
          </div>
          <div v-else>{{ row[`col_${i}`]?.toLocaleString() }}</div>
          <div v-if="i > 1">{{ row[`col_rate_${i}`] }}%</div>
        </div>
      </template>
    </template>
  </AnalysisTable>
  <GroupDetailTable
    ref="groupDetailRef"
    :data="resValue.dataSource"
    :resultClusterSql="resValue.resultClusterSql"
    :qp="resValue.dataQP"
    :dataDesc="resValue.dataDesc" />
</template>
<style lang="scss" scoped></style>
