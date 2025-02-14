<script setup>
import { computed } from 'vue'
import { groupBy } from 'lodash-es'
import { thousandsFilter } from '@/utils/index.js'

const props = defineProps({
  params: {
    type: Array,
    default: () => [],
  },
})

const data = computed(() => {
  return groupBy(props.params, 'name')
})

const filterData = (value) => {
  return value.filter((item) => item.value !== '-')
}

const sum = (value) => {
  return filterData(value).reduce((p, c) => (p += c.value), 0)
}

defineOptions({
  name: 'ChartTooltip',
})
</script>

<template>
  <div class="nd-chart-tootip flex-direction-column gap5">
    <template v-for="(value, key) of data" :key="key">
      <div class="flex-center flex-between">
        <span class="c86919d"> {{ key }}</span>
        <span>{{ thousandsFilter(sum(value)) }}</span>
      </div>
      <div
        class="flex-center flex-between"
        v-for="(sub, index) of filterData(value)"
        :key="index">
        <div class="flex-center gap10">
          <span
            class="mr5 nd-chart-tooltip-shape"
            :style="`background-color:${sub.color}`"></span>
          <span :title="sub.seriesName" class="ellipsis w180">
            {{ sub.seriesName }}</span
          >
        </div>
        <div class="flex-center gap10 ml20">
          <span>{{ thousandsFilter(sub.value) }}</span>
          <span>{{ ((sub.value / sum(value)) * 100).toFixed(2) }}%</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
@import '../tooltip.scss';
</style>
