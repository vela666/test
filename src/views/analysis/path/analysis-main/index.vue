<template>
  <AnalysisMain show-header :status="analysisResult.status" v-bind="attrs">
    <template #header>
      <div class="flex-center">
        <DateRangeSelect
          v-model="analysisResult.dateRange"
          placement="bottom-start"
          @change="reCalcute" />
        <span class="c86919d ml10 mr20">{{
          $t('analysis.path.maxQueryTimeRange')
        }}</span>
        <AnalysisUpdateTime
          v-if="analysisResult.status !== -1"
          :time="analysisResult.resultGenerateTime" />
      </div>
    </template>

    <template #table>
      <div style="height: calc(100% - 60px)">
        <el-scrollbar>
          <div class="fz16" style="text-align: center">
            {{ analysisResult.option.title.text }}
          </div>
          <Chart
            :ref="(ref) => (analysisResult.chartRef = ref)"
            :options="analysisResult.option"
            height="100%"
            :width="analysisResult.chartWidth" />
        </el-scrollbar>
      </div>
    </template>
  </AnalysisMain>

  <div v-show="nodeList.visible" id="node" @click="nodeList.visible = false">
    <div id="msgbox">
      <div class="detail-info">
        <span
          v-if="!nodeList.clickedNodeList.includes(nodeList.clickedNode.name)"
          class="menu-item"
          @click="highLightNode">
          {{ $t('analysis.path.highlightNode') }}
        </span>
        <span
          v-if="nodeList.selectedNodeList.includes(nodeList.clickedNode.name)"
          class="menu-item"
          @click="cancelHighLight">
          {{ $t('analysis.path.cancelAllSelected') }}
        </span>
        <span class="menu-item" @click="showNodeDetail">{{
          $t('analysis.path.viewNodeDetail')
        }}</span>
      </div>
    </div>
  </div>

  <NodeListDetail
    v-model="nodeList.detailDialog"
    :clickedNode="nodeList.clickedNode"
    :analysisResult="analysisResult" />
</template>

<script setup>
import { computed, useAttrs } from 'vue'
import { AnalysisMain } from '@/views/analysis/components/AnalysisMain/index.js'
import { usePathResultHooks } from '../hooks/pathResultHooks'
import NodeListDetail from './NodeListDetail.vue'

const emit = defineEmits(['calcute'])
const attrs = useAttrs()

const {
  analysisResult,
  nodeList,
  reCalcute,
  echoGlobalFilters,
  getEchartsData,
  highLightNode,
  cancelHighLight,
  showNodeDetail,
} = usePathResultHooks(emit)

const dateRange = computed(() => analysisResult.dateRange)

defineExpose({
  dateRange,
  echoGlobalFilters,
  getEchartsData,
})

defineOptions({
  name: 'PathAnalysisMain',
})
</script>

<style scoped lang="scss">
:deep() {
  .el-scrollbar__view {
    height: 100%;
  }
}

#node {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  width: 100%;
  height: 100%;
  background-color: transparent;
}

#msgbox {
  position: absolute;
  top: 0;
  left: 0;
  background-color: #fff;
  border-radius: 4px;
  .detail-info {
    cursor: pointer;
    max-height: 280px;
    padding: 4px;
    overflow-y: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    .menu-item {
      display: block;
      min-width: 80px;
      padding: 4px 8px;
      color: var(--eas-text-color-primary);
      font-size: 13px;
      &:hover {
        background-color: var(--eas-hover-color);
      }
    }
  }
}
</style>
