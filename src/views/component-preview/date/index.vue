<template>
  <div class="flex-column">
    <div>
      <DateRangeSelect
        @change="dateChange"
        :show-border="true"
        :needDynamic="true"
        v-model="value"
        :disabledDate="disabledDate">
        <EventComparison :date="value" v-model="value.versus" />
      </DateRangeSelect>
      <div>
        <TableComparativeSelect
          v-model="selectedStageTableIndex"
          v-model:versus="value.versus" />
      </div>
    </div>
    <div class="flex-column mt20">
      <DateRangeSelect
        isChecked
        closeIcon
        :needDynamic="false"
        v-model="value1" />
    </div>
  </div>
  <ConsolePanel
    :data="{
      value,
      selectedStageTableIndex,
      value1,
    }" />
</template>

<script setup>
import { watch, ref, reactive } from 'vue'
import EventComparison from '@/components/DateRangeSelect/EventComparison/index.vue'
import TableComparativeSelect from '@/components/DateRangeSelect/EventComparison/TableComparativeSelect.vue'
const value = ref({
  timeZone: '8',
  timeParticle: 'hour',
  recentDay: '0-26',
  startTime: '2024-03-01 00:00:00',
  endTime: '2024-03-27 23:59:59',
  graphType: 1,
  versus: [
    {
      date: ['2024-03-20', '2024-03-26'],
      diff: '1-',
      mainName: '2024-03-20 ~ 昨日',
      startTime: '2024-03-20 00:00:00',
      endTime: '2024-03-26 23:59:59',
      tableCurrentSelectionStage: true,
      recentDay: '1-',
      shortcutType: 'certainDayToYesterday',
    },
    {
      date: ['2024-03-20', '2024-03-27'],
      diff: '0-',
      mainName: '2024-03-20 ~ 今日',
      startTime: '2024-03-20 00:00:00',
      endTime: '2024-03-27 23:59:59',
      tableCurrentSelectionStage: false,
      recentDay: '0-',
      shortcutType: 'certainDayToToday',
    },
  ],
  date: ['2024-03-01', '2024-03-27'],
  diff: '0-26',
  mainName: '本月',
  shortcutType: 'currentMonth',
})
const selectedStageTableIndex = ref(1)
const value1 = ref({
  date: [],
  diff: '',
})
const dateChange = (val) => {
  console.log(val)
}

const disabledDate = (val) => {
  return false
}

defineOptions({
  name: 'Test',
})
</script>

<style lang="scss"></style>
