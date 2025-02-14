<script setup>
import { ref, reactive, computed, watch, nextTick, useAttrs } from 'vue'
import VisualDraggableField from './VisualDraggableField.vue'
import VisualChartSettings from './VisualChartSettings.vue'
import VisualChartView from './VisualChartView.vue'
import { cloneDeep } from 'lodash-es'
import { ElMessage, ElMessageBox } from 'element-plus'
import { t } from '@/locales/i18n'

const attrs = useAttrs()
const props = defineProps({
  config: {
    type: Object,
    default: () => {},
  },
  settings: {
    type: Object,
    default: () => {},
  },
  graphType: {
    type: Number,
    default: 1,
  },
  showChartLabel: {
    type: Boolean,
    default: false,
  },
})

const settingDefault = ref({
  y: {
    max: 0,
    min: 0,
    maxAuto: true,
    minAuto: true,
    valueDisplaySelect: 1, // 1 实数展示 2 百分比展示
    label: {
      show: false,
    },
  },
  ry: {
    max: 0,
    min: 0,
    maxAuto: true,
    minAuto: true,
    valueDisplaySelect: 1, // 1 实数展示 2 百分比展示
    label: {
      show: false,
    },
  },
})

const state = reactive({
  operate: 0,
  name: '',
  fieldList: [],
  fieldFilterList: [],
  newConfig: {},
  newGraphType: 1,
  propsSettings: cloneDeep(settingDefault.value),
  showChartLabel: null,
  sortArr: [],
})

const propsConfig = computed(() => {
  return props.config
})

const propsGraphType = computed(() => {
  return props.graphType
})

watch(
  () => props.graphType,
  () => {
    handleGetGraphType(props.graphType)
  },
  { deep: true }
)

watch(
  () => props.settings,
  () => {
    const y = Object.assign(
      {},
      state.propsSettings.y,
      (props.settings &&
        props.settings.settings &&
        props.settings.settings.y) ||
        {}
    )
    const ry = Object.assign(
      {},
      state.propsSettings.ry,
      (props.settings &&
        props.settings.settings &&
        props.settings.settings.ry) ||
        {}
    )
    Object.assign(state.propsSettings, { y, ry })
  },
  { immediate: true, deep: true }
)

watch(
  () => props.showChartLabel,
  (newVal) => {
    state.showChartLabel = !!newVal
  }
)

const VisualChartViewRef = ref()

const handleTab = (type) => {
  state.operate = type
}

const handleGetConfig = (config) => {
  state.newConfig = config
}

const handleGetGraphType = (graphType) => {
  state.newGraphType = graphType
}

const getSortArr = (arr) => {
  state.sortArr = arr
}

/**
 * @description 暂存
 */
const handleSave = (func) => {
  if (
    (JSON.stringify(state.newConfig) !== '{}' &&
      (!(state.newConfig.groupX.length || state.newConfig.groupChildX.length) ||
        !(state.newConfig.groupY.length || state.newConfig.groupRY.length)) &&
      state.newGraphType !== 6) ||
    (!VisualChartViewRef.value.tableData?.length && state.newGraphType === 6)
  ) {
    ElMessage({
      message: t('analysis.sqlquery.necessaryConditions'),
      type: 'warning',
    })
    return
  }
  ElMessageBox.confirm(
    t('analysis.sqlquery.storeConfiguration'),
    t('common.tip'),
    {
      type: 'warning',
      confirmButtonText: t('btn.confirm'),
      cancelButtonText: t('btn.cancel'),
      customClass: 'nd-message-box-424',
    }
  ).then(() => {
    const newGraphSettings = {}
    newGraphSettings.settings = state.propsSettings
    if (newGraphSettings.settings.y.maxAuto) {
      newGraphSettings.settings.y.max = 1
      newGraphSettings.settings.y.min = 0
    }
    if (newGraphSettings.settings.ry.maxAuto) {
      newGraphSettings.settings.ry.max = 1
      newGraphSettings.settings.ry.min = 0
    }
    const config = {
      groupX: state.newConfig.groupX,
      groupChildX: state.newConfig.groupChildX,
      groupY: state.newConfig.groupY,
      groupRY: state.newConfig.groupRY,
      graphType: state.newGraphType,
      showGroupRY: state.newConfig.showGroupRY,
      graphSettings: newGraphSettings,
      showChartLabel: !!state.showChartLabel,
      sortArr: state.sortArr,
    }
    func(config)
  })
}

defineOptions({
  name: 'VisualChartContent',
})

defineExpose({
  handleSave,
})
</script>
<template>
  <div class="visual p20 flex">
    <div class="visual-left">
      <div class="visual-left-operate flex-center mt10 ml10 mb20">
        <div
          :class="['mr20', 'c-pointer', state.operate === 0 ? 'active' : '']"
          @click="handleTab(0)">
          {{ $t('analysis.sqlquery.chartData') }}
        </div>
        <div
          :class="['ml10', 'c-pointer', state.operate === 1 ? 'active' : '']"
          @click="handleTab(1)">
          {{ $t('analysis.sqlquery.chartConfig') }}
        </div>
      </div>
      <div class="visual-left-content flex">
        <VisualDraggableField
          v-show="state.operate === 0"
          :graphType="state.newGraphType"
          @getConfig="handleGetConfig"
          v-model="propsConfig"
          v-bind="attrs"></VisualDraggableField>
        <VisualChartSettings
          v-show="state.operate === 1"
          v-model="state.propsSettings"></VisualChartSettings>
      </div>
    </div>
    <div class="visual-right ml20 p20">
      <VisualChartView
        ref="VisualChartViewRef"
        :config="state.newConfig"
        :settings="state.propsSettings"
        v-model:graphType="propsGraphType"
        v-model:showChartLabel="state.showChartLabel"
        @changGraphType="handleGetGraphType"
        @getSortArr="getSortArr"
        v-bind="attrs"></VisualChartView>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.visual {
  height: 100%;
  overflow: hidden;
  background: var(--eas-color-primary-light-1);
  &-left {
    padding: 10px 0 0 10px;
    background: #ffffff;
    &-operate {
      > div {
        padding-bottom: 10px;
      }
    }
    .active {
      position: relative;
      color: var(--eas-color-primary);
      &:before {
        content: '';
        position: absolute;
        left: 0;
        bottom: 0;
        width: 100%;
        height: 4px;
        border-radius: 2px;
        background: var(--eas-color-primary);
      }
    }
    &-content {
      height: calc(100% - 61px);
    }
  }
  &-right {
    flex: 1;
    background: #ffffff;
    overflow: hidden;
  }
}
</style>
