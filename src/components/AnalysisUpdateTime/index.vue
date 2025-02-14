<script setup>
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  time: {
    type: [String, Object, Date],
    default: dayjs().format('YYYYMMDD HHmmss'),
  },
})

defineOptions({
  name: 'AnalysisUpdateTime',
})
</script>

<template>
  <div class="analysis-update-time">
    {{ t('common.updatedAt') }} {{ dayjs(time).fromNow() }}
  </div>
</template>

<style scoped lang="scss">
.analysis-update-time {
  display: inline-flex;
  font-size: var(--eas-font-size-base);
  color: var(--eas-color-warning);
}
</style>
