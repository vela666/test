<!--
 * **************************************************
 * @file 组件
 * @author fengsi<294068744@qq.com>
 * @date 2024-03-05 15:57:24
 * @since v
 * **************************************************
-->

<script setup>
import { reactive, computed, useAttrs } from 'vue'
import { ChartType } from '@/views/analysis/components/AnalysisMain'
import { t } from '@/locales/i18n'

defineOptions({
  name: 'GraphTypeSelector',
})
const attrs = useAttrs()
const props = defineProps({
  type: {
    type: String,
    default: 'button', // button | dropdown
  },
  limit: {
    type: Array,
    default() {
      return [8, 3, 12, 13]
    },
  },
})

const state = reactive({})
const graphTypeOptions = computed(() => {
  return [
    {
      label: t('chart.boxplot'),
      title: t('chart.boxplot'),
      value: 8,
      icon: 'chart-boxplot',
    },
    {
      label: t('chart.histogram'),
      title: t('chart.histogram'),
      value: 3,
      icon: 'chart-transform',
    },
    {
      label: t('chart.aggregateDataTable'),
      title: t('chart.aggregateDataTable'),
      value: 12,
      icon: 'chart-table',
    },
    {
      label: t('chart.distributionDataTable'),
      title: t('chart.distributionDataTable'),
      value: 13,
      icon: 'chart-table',
    },
  ].filter((item) => props.limit.includes(item.value))
})
const graphTypeOptions2 = computed(() => {
  return graphTypeOptions.value.map((item) => ({
    ...item,
    title: item.label,
  }))
})

defineExpose({
  getData() {
    return graphTypeOptions.value
  },
})
</script>

<template>
  <SortDrop
    v-if="type === 'dropdown'"
    :type-list="graphTypeOptions"
    :show-border="false"
    :show-text="true"
    v-bind="attrs" />

  <ChartType v-else :data="graphTypeOptions" v-bind="attrs" />
</template>

<style scoped lang="scss"></style>
