<script setup>
import { computed } from 'vue'
import RateTip from './RateTip.vue'
defineOptions({
  name: 'RateLabel',
})
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  w: {
    type: Number,
    default: 0,
  },
})
</script>

<template>
  <div class="rate-label">
    <div class="c86919d">{{ data.numDesc }}</div>
    <div class="flex-center flex-between c545e6e">
      <div class="flex">
        <div>
          <span class="text-bold fz22">{{ data.num }}</span>
          <span class="ml2">{{ data.unit }}</span>
        </div>
        <div class="flex-center pdt-5 ml26">
          <span>{{ $t('analysis.event.mom') }}</span>
          <RateTip :rate="data.huanbi" :desc="data.huanbiDesc" :w="w" />
        </div>
        <div class="flex-center pdt-5 ml20">
          <span>{{ $t('analysis.event.yoy') }}</span>
          <RateTip :rate="data.tongbi" :desc="data.tongbiDesc" :w="w" />
        </div>
      </div>
      <div class="flex-center">
        <div>
          <span>{{ $t('analysis.event.sum') }}</span>
          <span class="text-bold ml2 fz22">{{ data.summary }}</span>
          <span class="ml2">{{ data.unit }}</span>
        </div>
        <div class="ml20">
          <span>{{ $t('analysis.event.average') }}</span>
          <span class="text-bold ml2 fz22">{{ data.avg }}</span>
          <span class="ml2">{{ data.unit }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.rate-label {
  height: 54px;
}
.text-bold {
  font-weight: 400;
}
.fz22 {
  font-size: 22px;
}
.ml2 {
  margin-left: 2px;
}
.ml20 {
  margin-left: 20px;
}
.ml26 {
  margin-left: 26px;
}
.pdt-5 {
  padding-top: 5px;
}
</style>
