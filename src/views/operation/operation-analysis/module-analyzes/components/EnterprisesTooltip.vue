<script setup>
import { ref, computed } from 'vue'
import { groupBy } from 'lodash-es'
import { thousandsFilter } from '@/utils/index.js'
import { ElTable, ElTableColumn } from 'element-plus'
import { createPopper } from '@popperjs/core'

const props = defineProps({
  params: {
    type: Array,
    default: () => [],
  },
})
const show = ref(false)
const showMoreData = ref(false)
const markPos = ref('right')
const tootip = ref()
const tootipMore = ref()
let requestIdleCallbackId = null

const showMore = (val) => {
  if (val.value <= 0) return
  show.value = true
  showMoreData.value = val
  createPopper(tootip.value, tootipMore.value, {
    strategy: 'fixed',
    placement: 'right',
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 20],
        },
      },
      {
        name: 'preventOverflow',
        options: {
          padding: 8,
        },
      },
    ],
  })
  requestIdleCallbackId && cancelIdleCallback(requestIdleCallbackId)
  requestIdleCallbackId = requestIdleCallback(() => {
    markPos.value = tootipMore.value.dataset.popperPlacement
  })
}

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
  name: 'EnterprisesTooltip',
})
</script>

<template>
  <div ref="tootip" class="nd-chart-tootip flex-direction-column gap5">
    <template v-for="(value, key) of data" :key="key">
      <div class="flex-center flex-between">
        <span class="c86919d"> {{ key }}</span>
        <span>{{ thousandsFilter(sum(value)) }}</span>
      </div>
      <div
        class="flex-center flex-between"
        v-for="(sub, index) of filterData(value)"
        :key="index"
        @click="showMore(sub)">
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
          <SvgIcon
            v-if="sub.value > 0"
            class="ccbd0d6 fz12"
            name="view-field" />
        </div>
      </div>
    </template>
  </div>
  <div
    ref="tootipMore"
    class="flex-column gap10 ml10 nd-chart-tootip-more"
    v-show="show">
    <span
      class="c1c2028 txt-bold ellipsis"
      :title="`${showMoreData.seriesName}各子模块访问次数`"
      >{{ showMoreData.seriesName }}各子模块访问次数</span
    >
    <el-table
      v-if="showMoreData?.data?.subPageList"
      :data="showMoreData.data.subPageList"
      class="nd-table-custom">
      <el-table-column prop="targetName" label="子模块" />
      <el-table-column prop="total" label="访问次数">
        <template #default="{ row }">
          {{ thousandsFilter(row.total) }}
        </template>
      </el-table-column>
    </el-table>
    <div :style="`${markPos}:19px`" class="nd-chart-tootip-more-mask"></div>
  </div>
</template>

<style scoped lang="scss">
@import '../../tooltip.scss';
</style>
