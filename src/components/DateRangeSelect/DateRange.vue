<template>
  <!-- @pick="change" -->
  <Calendar
    v-if="isDefault"
    v-model:value="dateVal"
    type="date"
    :getClasses="setClass"
    :disabledDate="disabledDate"
    class="nd-date-range" />
  <CalendarRange
    v-else
    class="nd-date-range"
    :disabledDate="disabledDate"
    multiple
    type="date"
    v-model:value="dateVal" />
</template>

<script setup>
import { computed } from 'vue'
import DatePicker from 'vue-datepicker-next'
import 'vue-datepicker-next/index.css'
import 'vue-datepicker-next/locale/zh-cn.es'
import 'vue-datepicker-next/locale/en.es'
import dayjs from 'dayjs'
import { dateFormat1 } from '@/enumeration/date'

let isEn = localStorage.getItem('Accept-Language') === 'en-US'

DatePicker.locale(isEn ? 'en' : 'zh-cn')

const {
  Calendar,
  CalendarRange,
  /*
  TimePanel,
  TimeRange,
  DateTime,
  DateTimeRange,*/
} = DatePicker

/*
let startDate = dayjs().subtract(7, 'day').format(dateFormat1)
// 计算过去7天的日期
const endDate = dayjs().format(dateFormat1)
*/

// toDate() 获取原生的 Date
// const value = ref([dayjs('2023-07-18').toDate(), dayjs('2023-08-30').toDate()])

const props = defineProps({
  modelValue: {
    type: [String, Array],
    // default: () => dayjs().toDate(),
    // 2023-10-15
    default: '',
  },
  disabledDate: {
    type: Function,
    default: (value, innerValue) => {
      return value.getTime() > Date.now()
    },
  },
  selectedDate: {
    type: String,
    // 2023-10-15
    default: '',
  },
  isDefault: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue', 'change'])
const dateVal = computed({
  get() {
    if (props.isDefault) {
      return dayjs(props.modelValue).toDate()
    }
    return props.modelValue.map((item) => {
      return dayjs(item).toDate()
    })
  },
  set(val) {
    const tmp = props.isDefault
      ? dayjs(val).format(dateFormat1)
      : val.map((item) => dayjs(item).format(dateFormat1))
    emit('update:modelValue', tmp)
    emit('change', tmp)
  },
})

const setClass = (value, innerValue) => {
  const a = dayjs(value).format(dateFormat1)
  // .startOf('day') 当天 00:00
  const b = dayjs(props.selectedDate).format(dateFormat1)
  // 选中的日期一致
  if (dayjs(dateVal.value).format(dateFormat1) === b) return ''
  if (a === b) return 'active select-date-active'
  /*
   (): 开区间，表示不包含左边界值和右边界值。例如，(3, 7) 表示大于3小于7的范围，不包括3和7。
   []: 闭区间，表示包含左边界值和右边界值。例如，[3, 7] 表示大于等于3且小于等于7的范围，包括3和7。
   [): 左闭右开区间，表示包含左边界值但不包含右边界值。例如，[3, 7) 表示大于等于3且小于7的范围，包括3但不包括7。
   (]: 左开右闭区间，表示不包含左边界值但包含右边界值。例如，(3, 7] 表示大于3小于等于7的范围，不包括3但包括7。
  */
  const isWithinRange = dayjs(a).isBetween(
    dayjs(dateVal.value),
    dayjs(b),
    'day',
    '()'
  )
  if (isWithinRange) return 'in-range'
}

defineOptions({
  name: 'DateRange',
})
</script>

<style lang="scss">
.nd-date-range {
  border: none !important;
  padding: 0 !important;
  .mx-btn {
    &:hover {
      color: var(--eas-color-primary);
      border-color: var(--eas-color-primary);
    }
  }

  .mx-calendar {
    padding: 0;
    & + .mx-calendar {
      border-left: none;
      margin-left: 33px;
    }
  }

  &.mx-calendar-panel-date {
    .mx-calendar-content {
      height: auto;
    }
  }

  .mx-table-year,
  .mx-table-month {
    .cell {
      &:not(.disabled):not(.active) {
        &:hover {
          background-color: var(--eas-color-primary-light-1);
        }
      }
      &.active {
        background-color: var(--eas-color-primary);
      }
      &.disabled {
        //background-color: var(--eas-text-color-light-1);
        //color: var(--eas-text-color-light);
      }
    }
  }

  .mx-table-date {
    .mx-date-row {
      > .cell {
        background-color: transparent;
        padding: 4px 0;
        &:hover {
          background-color: transparent;
        }

        > div {
          height: 32px;
          line-height: 32px;
        }

        &:not(.disabled) {
          > div {
            color: var(--eas-text-color-primary);
            &:hover {
              background-color: var(--eas-color-primary-light-1);
            }
          }

          &.not-current-month {
            color: currentColor;
          }
        }
        &.today {
          > div {
            color: var(--eas-color-primary);
          }
        }
        &.in-range {
          > div {
            background-color: var(--eas-color-primary-light-1);
          }
        }

        &.active {
          background-color: transparent;
          > div {
            color: #fff;
            background-color: var(--eas-color-primary) !important;
            border-radius: 4px;
          }
        }

        &.select-date-active {
          > div {
            background-color: var(--eas-color-bac6f5) !important;
          }
        }
      }
    }
    .mx-active-week {
      background-color: var(--eas-color-primary-light-1);
    }
  }
  &.mx-calendar-week-mode .mx-date-row {
    &:hover {
      background-color: var(--eas-color-primary-light-1);
    }
  }
}
</style>
