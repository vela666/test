<script setup>
import { cloneDeep } from 'lodash-es'
import { reactive, ref, watch, useAttrs } from 'vue'
import VisualChartView from './VisualChartView.vue'

const attrs = useAttrs()
const props = defineProps({
  graphConfig: {
    type: Object,
    default: () => {},
  },
})

watch(
  () => props.graphConfig,
  (newVal) => {
    setValue(newVal)
  },
  {
    deep: true,
  }
)

const state = reactive({
  config: {},
  settings: {},
  graphType: 1,
  showChartLabel: false,
})

const setValue = (newVal) => {
  const cfg = cloneDeep(newVal)
  state.config = {
    groupX: cfg.groupX || [],
    groupChildX: cfg.groupChildX || [],
    groupY: cfg.groupY || [],
    groupRY: cfg.groupRY || [],
    showGroupRY: !!cfg.showGroupRY,
    sortArr: cfg.sortArr || [],
  }
  state.settings = cfg.graphSettings?.settings || { y: {}, xy: {} }
  state.graphType = cfg.graphType
  state.showChartLabel = cfg.showChartLabel
}

const emit = defineEmits(['changShowChartLabel', 'remove', 'getSortArr'])

const handleGetShowChartLabel = (showChartLabel) => {
  emit('changShowChartLabel', showChartLabel)
}

const handleRemove = () => {
  emit('remove')
}

const getSortArr = (arr) => {
  emit('getSortArr', arr)
}

defineOptions({
  name: 'SearchResultChart',
})
</script>
<template>
  <div class="h100-percentage">
    <VisualChartView
      :config="state.config"
      :settings="state.settings"
      v-model:graphType="state.graphType"
      v-model:showChartLabel="state.showChartLabel"
      :titleFlag="false"
      :graphTypeFlag="false"
      @changShowChartLabel="handleGetShowChartLabel"
      @getSortArr="getSortArr"
      v-bind="attrs">
      <template #remove>
        <!-- 移除 -->
        <el-button class="m0 skip" @click="handleRemove">
          <SvgIcon class="fz16" name="visualization" />
          <span class="fz14">
            {{ $t('analysis.sqlquery.remove') }}
          </span>
        </el-button>
      </template>
    </VisualChartView>
  </div>
</template>
<style lang="scss" scoped></style>
