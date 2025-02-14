<script setup>
import { computed } from 'vue'
import { timeZoneList } from '@/enumeration/report'
import useTimeZoneStore from '@/store/modules/time-zone.js'
import SvgButton from '@/components/AnalysisLayout/SvgButton.vue'
defineOptions({
  name: 'TimeZone',
})
const timeZoneStore = useTimeZoneStore()

const emit = defineEmits(['change'])

const handleChange = (val) => {
  emit('change', val)
}

const timeZone = computed({
  get() {
    return `${timeZoneStore.timeZone}`
  },
  set(value) {
    localStorage.setItem('timeZone', value)
    timeZoneStore.timeZone = `${value}`
  },
})
</script>

<template>
  <DropSelectorSingle
    type="custom"
    v-model="timeZone"
    :data="timeZoneList"
    @change="handleChange">
    <template #default="{ label }">
      <svg-button icon="time-zone">
        {{ label }}
      </svg-button>
    </template>
  </DropSelectorSingle>
</template>

<style scoped lang="scss">
.w93 {
  width: 93px;
}
</style>
