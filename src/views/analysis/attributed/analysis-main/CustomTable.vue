<script setup>
import { computed, ref, useAttrs } from 'vue'
import { AnalysisTable } from '@/views/analysis/components/AnalysisMain/index.js'
import { getPercentColor } from '@/utils/index.js'

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
    :pagination="false"
    :cell-style="cellStyle"
    :file-name="$t('analysis.attributed.analysisName')"
    :ref="(ref) => (resValue.analysisTableRef = ref)"
    :needHeader="false"
    :analysisType="14"
    v-bind="attrs">
    <template #column="{ item, row }">
      <div v-if="item.prop === 'efftCount'" class="flex flex-direction-column">
        <span>{{ row[item.prop]?.toLocaleString() ?? '-' }}</span>
        <span>{{ row.efftLv ?? '-' }}</span>
      </div>
      <el-progress
        v-else-if="item.prop === 'totalLv'"
        :percentage="parseFloat(row[item.prop])" />
      <template v-else>
        {{ row[item.prop]?.toLocaleString() ?? '-' }}
      </template>
    </template>
  </AnalysisTable>
</template>
<style lang="scss" scoped></style>
