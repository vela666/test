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
  typeName: {
    type: String,
    default: '',
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
</script>

<template>
  <div ref="tootip" class="nd-chart-tootip flex-direction-column gap5">
    <template v-for="(value, key) of data" :key="key">
      <div class="flex-center flex-between">
        <span class="c86919d"> {{ key }}</span>
        <span>{{
          thousandsFilter(value.reduce((p, c) => (p += c.value), 0))
        }}</span>
      </div>
      <div
        class="flex-center flex-between"
        v-for="(sub, index) of value"
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
          <SvgIcon
            v-if="sub.value > 0"
            class="ccbd0d6 fz12"
            name="view-field" />
        </div>
      </div>
    </template>

    <div
      ref="tootipMore"
      class="flex-column gap10 ml10 nd-chart-tootip-more"
      v-show="show">
      <span
        class="c1c2028 txt-bold ellipsis"
        :title="`${showMoreData.seriesName}各应用${typeName}`"
        >{{ showMoreData.seriesName }}各应用{{ typeName }}</span
      >
      <el-table
        v-if="showMoreData?.data?.appList"
        :data="showMoreData.data.appList"
        class="nd-table-custom">
        <el-table-column prop="targetName" label="应用" />
        <el-table-column prop="total" :label="`${typeName}`" align="right">
          <template #default="{ row }">
            {{ thousandsFilter(row.total) }}
          </template>
        </el-table-column>
      </el-table>
      <div :style="`${markPos}:19px`" class="nd-chart-tootip-more-mask"></div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '../../tooltip.scss';
</style>
