<script setup>
import { ref, reactive, onMounted } from 'vue'
import { CaretTop, CaretBottom } from '@element-plus/icons-vue'
import { isString } from 'lodash-es'
import { t } from '@/locales/i18n'
defineOptions({
  name: 'RateTip',
})
const props = defineProps({
  rate: {
    type: String,
    default: () => null,
  },
  desc: {
    type: String,
    default: () => '',
  },
  w: {
    type: Number,
    default: 0,
  },
})

const showIcon = (rate) => rate && isString(rate) && parseFloat(rate) !== 0

const getColorClass = (rate) => {
  if (showIcon(rate)) {
    return rate.includes('-') ? 'decrease-color' : 'increase-color'
  }
  return ''
}

const getShowContent = (desc, rate) => {
  return t('analysis.event.rateTooltip', {
    date: desc,
    type:
      rate !== '0.0%'
        ? rate && rate.includes('-') && rate !== '0.0%'
          ? t('analysis.event.decreased')
          : t('analysis.event.increased')
        : t('analysis.event.noChange'),
    rate: rate === '0.0%' || rate === null ? '' : rate.replace('-', ''),
  })

  // return `对比${desc}，${
  //   rate !== '0.0%'
  //     ? rate && rate.includes('-') && rate !== '0.0%'
  //       ? '下降了'
  //       : '增涨了'
  //     : '没有变化'
  // }${rate === '0.0%' || rate === null ? '' : rate.replace('-', '')}`
}
</script>

<template>
  <el-popover
    placement="top-start"
    :hide-after="0"
    :width="200"
    popper-class="dashboard-rate-tip"
    trigger="hover"
    :disabled="rate === null"
    :content="getShowContent(desc, rate)">
    <template #reference>
      <span :class="['ml10', getColorClass(rate)]">
        <template v-if="showIcon(rate)">
          <el-icon class="top-2">
            <CaretTop v-if="!rate?.includes('-')" />
            <CaretBottom v-else />
          </el-icon>
        </template>
        <span>{{ rate ? (rate?.replace('-', '') ?? rate) : '-' }}</span>
      </span>
    </template>
  </el-popover>
</template>

<style scoped lang="scss">
.top-2 {
  top: 2px;
}
.increase-color {
  color: var(--eas-color-success) !important;
}
.decrease-color {
  color: var(--eas-color-danger) !important;
}
</style>
<style lang="scss">
.el-popover.el-popper.dashboard-rate-tip {
  color: var(--eas-text-color-primary);
}
</style>
