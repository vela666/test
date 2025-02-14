<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import RateTip from './RateTip.vue'
import Tooltip from '@/components/Tooltip/index.vue'

const route = useRoute()

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  w: {
    type: Number,
    default: 3,
  },
  time: {
    type: [String, Object, Date],
    default: '',
  },
  info: {
    type: Object,
    default: () => ({
      creator: '',
      appName: '',
    }),
  },
  rate: {
    type: Boolean,
    default: true,
  },
  dateRange: {
    type: Object,
    default: () => {},
  },
  particleType: {
    type: Object,
    default: () => {},
  },
})

const showAppName = computed(() => {
  return route.path === '/unified-panel'
})

defineOptions({
  name: 'MiniView',
})
</script>

<template>
  <div class="dashboard-event__mini">
    <div class="flex-center flex-between">
      <DateRangeSelect
        v-if="particleType?.particle === 'summary'"
        :modelValue="dateRange"
        :dateTextOnly="true" />
      <div v-else class="w100-percentage mr5" v-showTips>
        {{ data.numDesc }}
      </div>
      <div class="flex-center nd-hide-operate">
        <Tooltip>
          <div class="flex-center">
            <SvgIcon name="member-manage" class="fz16 c86919d" />
            <span class="creator__text">
              {{ info.creator.slice(0, 1) }}
            </span>
          </div>
          <template #content> {{ info.creator }}</template>
        </Tooltip>

        <Tooltip v-if="showAppName">
          <div class="flex-center">
            <SvgIcon name="app1" class="fz16 c86919d ml10" />
            <span class="creator__text" v-showTips>
              {{ info.appName.slice(0, 1) }}
            </span>
          </div>

          <template #content> {{ info.appName }}</template>
        </Tooltip>
      </div>
    </div>
    <div class="flex-center flex-between mgt20">
      <div>
        <span class="text-bold__mini">{{ data.num?.toLocaleString() }}</span>
        <span class="text-bold__unit ml10">{{ data.unit }}</span>
      </div>
      <AnalysisUpdateTime :time="time" />
    </div>
    <div class="flex-center mgt20" v-if="rate">
      <div class="flex-center">
        <span>{{ $t('analysis.event.yoy') }}</span>
        <RateTip :rate="data.huanbi" :desc="data.huanbiDesc" />
      </div>
      <div class="flex-center ml40">
        <span>{{ $t('analysis.event.mom') }}</span>
        <RateTip :rate="data.tongbi" :desc="data.tongbiDesc" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard-event__mini {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding-top: 15px;
  color: var(--eas-text-color-primary);
}
.mgt20 {
  margin-top: 20px;
}
.ml40 {
  margin-left: 40px;
}
.text-bold__mini {
  font-weight: 400;
  font-size: 30px;
}
.text-bold__unit {
  font-weight: 400;
  font-size: 18px;
}
.creator__text {
  max-width: 70px;
  height: 19px;
  margin-left: 3px;
  color: var(--eas-text-color-light);
}
</style>
