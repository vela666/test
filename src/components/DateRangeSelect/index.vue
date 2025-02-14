<template>
  <div :class="containerClass" :style="`height:${h}`">
    <template v-if="dateTextOnly">
      {{ `${state.start}${dateSeparator}${state.end}` }}
    </template>
    <el-popover
      v-else
      v-model:visible="state.visible"
      @before-enter="show"
      @hide="hide"
      :show-arrow="showArrow"
      width="810"
      :hide-after="0"
      :show-after="0"
      :placement="placement"
      :persistent="persistent"
      :popper-class="['nd-popover-date', className].join(' ')"
      :trigger="trigger"
      :offset="offset"
      :popper-options="popperConfig">
      <template #reference>
        <div
          class="nd-date-label"
          :class="[
            showBorder ? '' : 'not-border',
            state.highlight ? 'nd-highlight' : '',
          ]">
          <div class="flex-center">
            <SvgIcon v-show="dateIcon" name="calendar1" class="c86919d fz16" />
            <span :class="[dateIcon && 'ml5 mr5', 'fz14 c545e6e']">{{
              `${state.dynamicDateText || t('dateRangeSelect.timeFilter')}`
            }}</span>
            <el-icon
              class="fz16 c86919d nd-date-close"
              @click.stop="handleDelete()"
              v-if="closeIcon && state.dynamicDateText">
              <Close />
            </el-icon>
          </div>
        </div>
      </template>
      <div class="nd-popover-date-content">
        <div class="nd-popover-date-content-t">
          <div class="flex flex-direction-column">
            <div class="c86919d fz12">{{ t('dateRangeSelect.dateRange') }}</div>
            <div class="c545e6e fz14 flex-center">
              <span>
                {{
                  state.dynamicDateText ||
                  `${state.start}${dateSeparator}${state.end}`
                }}</span
              >
              <span v-show="!allStatic" class="ml5">
                ({{ `${state.start}${dateSeparator}${state.end}` }})
              </span>
            </div>
          </div>
          <div class="flex-center gap10">
            <el-radio-group @change="dateModeChange" v-model="state.dateMode">
              <el-radio class="mr15" value="1">{{
                t('dateRangeSelect.defaultMode')
              }}</el-radio>
              <el-radio value="2">{{ t('dateRangeSelect.freeMode') }}</el-radio>
            </el-radio-group>
            <Tooltip>
              <SvgIcon name="help2" class="c86919d" />
              <template #content>
                <div>
                  {{ t('dateRangeSelect.defaultModeDescription') }}
                </div>
                <div>{{ t('dateRangeSelect.freeModeDescription') }}</div>
              </template>
            </Tooltip>
          </div>
        </div>
        <div class="nd-popover-date-content-c">
          <div class="nd-popover-date-content-c-l">
            <div>
              <div
                @click="setDateByStr(item.type)"
                v-for="item of dateLabelList"
                :key="item.type"
                :class="{
                  'nd-shortcut-active': state.shortcutType === item.type,
                }">
                {{ t(`dateRangeSelect.${item.type}`) }}
              </div>
            </div>
          </div>
          <div
            class="nd-popover-date-content-c-r"
            :class="{ 'flex-direction-column': !isDefault }">
            <div :class="{ skip: !isDefault }">
              <div class="flex-column" v-for="item of 2" :key="item">
                <el-radio-group
                  @change="radioGroupChange(item)"
                  v-model="
                    state[
                      item === 1
                        ? 'startStaticOrDynamicType'
                        : 'endStaticOrDynamicType'
                    ]
                  ">
                  <el-radio-button
                    :disabled="item === 1 && state.endStaticOrDynamicType === 2"
                    v-if="needDynamic"
                    :value="1"
                    :label="1">
                    {{ t('dateRangeSelect.dynamicTime') }}
                  </el-radio-button>
                  <el-radio-button :value="2" :label="2">
                    {{ t('dateRangeSelect.staticTime') }}
                  </el-radio-button>
                </el-radio-group>
                <div class="nd-date-input">
                  <el-icon v-if="item === 2" class="arrow-right">
                    <ArrowRight />
                  </el-icon>
                  <CommonInput
                    v-if="
                      state[
                        item === 1
                          ? 'startStaticOrDynamicType'
                          : 'endStaticOrDynamicType'
                      ] === 1
                    "
                    v-model="
                      state[
                        item === 1 ? 'startDynamicInput' : 'endDynamicInput'
                      ]
                    "
                    :disabled="
                      state[
                        item === 1
                          ? 'startStaticOrDynamicType'
                          : 'endStaticOrDynamicType'
                      ] === 2
                    "
                    :clearable="false"
                    @input="(v) => dateInput(v, item)"
                    desc=""
                    :prefixSlot="false" />
                  <div v-else class="mr10 nd-fake-input nd-not-allowed">
                    {{ state[item === 1 ? 'start' : 'end'] }}
                  </div>
                  <span
                    v-show="
                      state[
                        item === 1
                          ? 'startStaticOrDynamicType'
                          : 'endStaticOrDynamicType'
                      ] === 1
                    "
                    class="ml10"
                    >{{ t('dateRangeSelect.day') }}</span
                  >
                </div>
                <DateRange
                  v-if="isDefault"
                  :isDefault="isDefault"
                  @change="(params) => dateChange(item, '', params)"
                  v-model="state[item === 1 ? 'start' : 'end']"
                  :selectedDate="state[item === 1 ? 'end' : 'start']"
                  :disabledDate="disabledDate" />
              </div>
            </div>
            <DateRange
              v-if="!isDefault"
              :isDefault="isDefault"
              @change="dateChange(true, '')"
              v-model="state.date"
              :disabledDate="disabledDate" />
          </div>
        </div>
        <div class="nd-popover-date-content-b">
          <div>
            <span class="cf53f3f" v-if="!hideInfo">
              {{ isShowInfo ? t('dateRangeSelect.timeWarning') : '' }}
            </span>
          </div>
          <div class="flex-center">
            <template v-if="isChecked">
              <el-checkbox v-model="state.filterDateChecked">
                <span class="c545e6e"
                  >{{ t('dateRangeSelect.saveTemporarily') }}
                </span>
              </el-checkbox>
              <Tooltip>
                <SvgIcon class="ml5" name="help2" />
                <template #content>
                  {{ t('dateRangeSelect.saveFilterDate') }}
                </template>
              </Tooltip>
            </template>
            <el-button class="skip ml20" @click="cancel">
              {{ t('btn.cancel') }}</el-button
            >
            <el-button type="primary" @click="apply">
              {{ t('btn.confirm') }}
            </el-button>
          </div>
        </div>
      </div>
    </el-popover>
    <slot></slot>
  </div>
</template>

<script setup>
import { watch, reactive, computed, useSlots } from 'vue'
import DateRange from './DateRange.vue'
import { ArrowRight, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  dateFormat1,
  past7DayStart,
  past7DayEnd,
  currentDate,
} from '@/enumeration/date'
import {
  dateLabelEnum,
  dateTypeEnum,
  skipKey,
  dateLabelList,
  todayAndYesterday,
  kanBanFilterDate,
  dateSeparator,
} from './enum'
import dayjs from 'dayjs'
import { debounce, cloneDeep, isEqual, isBoolean } from 'lodash-es'
import { matchNotNumberRegex } from '@/utils/regExp'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const slots = useSlots()
const containerClass = computed(() => {
  const bool = slots.default
  return [
    'flex-center',
    'nd-range-date',
    bool ? 'has-default-slot' : 'not-default-slot',
  ]
})
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {},
  },
  hideInfo: {
    type: Boolean,
    default: false,
  },
  // 自定义日期限制
  /*const verifyDate = (val) => {
    const start = dayjs(val.date[0])
    const end = dayjs(val.date[1])
    const diff = end.diff(start, 'days')
    if (diff > 30) {
      return '选择时间范围超过30天，请重新选择！'
    }
  }*/
  verifyDate: {
    type: Function,
    default() {
      return false
    },
  },
  disabledDate: {
    type: Function,
    default(value, innerValue) {
      return value.getTime() > Date.now()
    },
  },
  h: {
    type: String,
    default: '32px',
  },
  showDynamic: {
    type: Boolean,
    default: true,
  },
  dateIcon: {
    type: Boolean,
    default: true,
  },
  showBorder: {
    type: Boolean,
    default: true,
  },
  // 目前只有数据看板使用
  closeIcon: {
    type: Boolean,
    default: false,
  },
  isChecked: {
    type: Boolean,
    default: false,
  },
  config: {
    type: Object,
    default: () => {},
  },
  showArrow: {
    type: Boolean,
    default: false,
  },
  className: {
    type: String,
    default: '',
  },
  // 当 popover 组件长时间不触发且 persistent 属性设置为 false 时, popover 将会被删除
  persistent: {
    type: Boolean,
    default: true,
  },
  offset: {
    type: [String, Number],
    default: 4,
  },
  trigger: {
    type: String,
    default: 'click',
  },
  placement: {
    type: String,
    default: 'bottom',
  },
  // 需要动态时间
  needDynamic: {
    type: Boolean,
    default: true,
  },
  dateTextOnly: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['update:modelValue', 'show', 'hide', 'change'])
const initVal = () => {
  const start = skipKey.includes(props.modelValue.shortcutType)
    ? dayjs(props.modelValue.startTime).format(dateFormat1)
    : past7DayStart
  const end = past7DayEnd
  return {
    visible: false,
    dynamicDateText: '',
    date: [start, end],
    start,
    end,
    // 1 默认、2 自由
    dateMode: localStorage.getItem('dateMode') || '1',
    // 记录左侧快捷项类型
    shortcutType: '',
    highlight: false,
    filterDateChecked: false,
    // 动或静态类型 1是动态 2是静态
    startStaticOrDynamicType: props.needDynamic ? 1 : 2,
    startDynamicInput: 0,
    endDynamicInput: 0,
    // 动或静态类型
    endStaticOrDynamicType: props.needDynamic ? 1 : 2,
  }
}
let notConfirmed = true
const state = reactive(initVal())

const isDefault = computed(() => {
  return state.dateMode === '1'
})

const isShowInfo = computed(() => {
  return dayjs(state.end).diff(dayjs(state.start), 'day') > 30
})
const popperConfig = computed(() => {
  return {
    modifiers: [
      {
        name: 'flip',
        options: {
          padding: props.offset,
          fallbackPlacements: ['bottom', 'left', 'top', 'right'],
        },
      },
    ],
    ...props.config,
  }
})

const allStatic = computed(
  () =>
    state.startStaticOrDynamicType === 2 && state.endStaticOrDynamicType === 2
)
const endExceedStart = computed(() =>
  dayjs(state.end).isBefore(dayjs(state.start))
)

const updVal = (dateRange, execute = true) => {
  emit('update:modelValue', dateRange)
  execute && emit('change', dateRange)
}

const dateModeChange = () => {
  localStorage.setItem('dateMode', state.dateMode)
}

const show = () => {
  setDateSelected()
  state.highlight = true
  emit('show')
}

const hide = () => {
  notConfirmed &&
    setDateSelected(props.modelValue, props.modelValue.shortcutType)
  state.highlight = false
  notConfirmed = true
  if (
    props.isChecked &&
    sessionStorage.getItem(kanBanFilterDate) &&
    !state.filterDateChecked
  ) {
    state.filterDateChecked = true
  }
  emit('hide')
}

const cancel = () => {
  state.visible = false
}

const mappingParams = () => {
  const diff = allStatic.value
    ? ''
    : `${state.endStaticOrDynamicType === 1 ? state.endDynamicInput : ''}-${
        state.startStaticOrDynamicType === 1 ? state.startDynamicInput : ''
      }`
  return {
    ...props.modelValue,
    date: [state.start, state.end],
    diff,
    recentDay: diff,
    mainName: state.dynamicDateText,
    startTime: `${state.start} 00:00:00`,
    endTime: `${state.end} 23:59:59`,
    shortcutType: !props.needDynamic ? '' : state.shortcutType,
  }
}

const apply = () => {
  if (endExceedStart.value) {
    ElMessage.warning(t('dateRangeSelect.dateError'))
    return
  }
  const dateRange = mappingParams()
  const message = props.verifyDate(dateRange)
  if (message) {
    ElMessage.warning(message)
    return
  }
  if (props.isChecked && state.filterDateChecked) {
    // 暂存全局筛选日期
    sessionStorage.setItem(kanBanFilterDate, JSON.stringify(dateRange))
  } else {
    sessionStorage.removeItem(kanBanFilterDate)
  }
  notConfirmed = false
  updVal(dateRange)
  cancel()
}

// 设置动态日期显示字符串

const getDynamicDateText = (type) => {
  if (!props.needDynamic) {
    state.dynamicDateText = `${state.start}${dateSeparator}${state.end}`
    return
  }
  const startDiff = dayjs(state.start).diff(dayjs(), 'day')
  const endDiff = dayjs(state.end).diff(dayjs(), 'day')
  const startTxt =
    state.startStaticOrDynamicType === 1
      ? t('dateRangeSelect.pastDay', [-startDiff])
      : state.start

  // 开始是静态 且 自某日至昨日 或 自某日至今
  const isStartStatic = !!(
    state.startStaticOrDynamicType === 2 &&
    todayAndYesterday[-endDiff]?.toLocaleLowerCase()
  )

  const endTxt =
    state.endStaticOrDynamicType === 1
      ? isStartStatic
        ? t(
            `dateRangeSelect.${todayAndYesterday[-endDiff]?.toLocaleLowerCase()}`
          )
        : t('dateRangeSelect.pastDay', [-endDiff])
      : state.end

  let text = `${startTxt}${dateSeparator}${endTxt}`

  if (type && !skipKey.includes(type)) {
    text = t(`dateRangeSelect.${type}`)
  } else {
    // 都是动态
    if (
      state.startStaticOrDynamicType === 1 &&
      state.endStaticOrDynamicType === 1
    ) {
      if (endDiff === 0 && startDiff !== 0) {
        text = t('dateRangeSelect.recentDay', [-startDiff + 1])
      } else if (-endDiff === 1 && -startDiff !== 1) {
        text = t('dateRangeSelect.pastDay', [-startDiff])
      } else if (endDiff === 0 && startDiff === 0) {
        text = t('dateRangeSelect.today')
      } else if (-endDiff === 1 && -startDiff === 1) {
        text = t('dateRangeSelect.yesterday')
      } else if (-endDiff === 2 && -startDiff === 2) {
        text = t('dateRangeSelect.dayBeforeYesterday')
      }
    }
  }

  state.dynamicDateText = text
}

// type 没值要为 '' 不然回显可能有问题
const dateChange = (val, type = '', params = null) => {
  if (isBoolean(val)) {
    const start = state.date[0]
    const end = state.date[1]
    state.startDynamicInput = dayjs().diff(start, 'day')
    state.endDynamicInput = dayjs().diff(end, 'day')
    state.start = start
    state.end = end
  } else {
    if (val) {
      const key1 = val === 1 ? 'start' : 'end'
      const key2 = val === 1 ? 'startDynamicInput' : 'endDynamicInput'
      state[key2] = dayjs().diff(state[key1], 'day')
      if (params !== null) {
        state.date[val - 1] = params
      }
    } else {
      for (let i = 1; i <= 2; i++) {
        const key1 = i === 1 ? 'start' : 'end'
        const key2 = i === 1 ? 'startDynamicInput' : 'endDynamicInput'
        state[key2] = dayjs().diff(state[key1], 'day')
      }
    }
  }
  state.shortcutType = type
  getDynamicDateText(type)
}

const dateInput = (v, i) => {
  let val = +v.replace(matchNotNumberRegex, '')
  if (val > 999) {
    val = 999
  }
  const key1 = i === 1 ? 'start' : 'end'
  const key2 = i === 1 ? 'startDynamicInput' : 'endDynamicInput'
  const tmp = currentDate().subtract(val, 'day').format(dateFormat1)
  state[key1] = tmp
  state.date[i - 1] = tmp
  state[key2] = val
  state.shortcutType = ''
  getDynamicDateText()
}

// 字符快捷日期设置 '昨日'、'今日'、'上周'、'本周'、'上月'、'本月'
const setDateByStr = (type, needReturnValue = false) => {
  let start = ''
  let end = ''
  if (props.needDynamic) {
    state.startStaticOrDynamicType = 1
    state.endStaticOrDynamicType = 1
  }
  const fn = {
    yesterday() {
      start = end = currentDate().subtract(1, 'day')
    },
    today() {
      start = end = currentDate()
    },
    lastWeek() {
      // 获取上周一的日期
      start = currentDate().subtract(1, 'week').startOf('isoWeek')
      // 获取上周日的日期
      end = currentDate().subtract(1, 'week').endOf('isoWeek')
    },
    currentWeek() {
      // 获取本周开始的日期
      start = currentDate().startOf('isoWeek')
      end = currentDate()
    },
    lastMonth() {
      start = currentDate().subtract(1, 'month').startOf('month')
      end = currentDate().subtract(1, 'month').endOf('month')
    },
    currentMonth() {
      start = currentDate().startOf('month')
      end = currentDate()
    },
    past7Day() {
      start = currentDate().subtract(7, 'day')
      end = currentDate().subtract(1, 'day')
    },
    past8Day() {
      start = currentDate().subtract(8, 'day')
      end = currentDate().subtract(1, 'day')
    },
    past30Day() {
      start = currentDate().subtract(30, 'day')
      end = currentDate().subtract(1, 'day')
    },
    certainDayToYesterday() {
      if (props.needDynamic) {
        state.startStaticOrDynamicType = 2
        state.endStaticOrDynamicType = 1
      }
      start = state.start
      end = currentDate().subtract(1, 'day')
      // 针对开始在结束日期前
      if (dayjs(end).isBefore(dayjs(start))) {
        this.yesterday()
      }
    },
    certainDayToToday() {
      if (props.needDynamic) {
        state.startStaticOrDynamicType = 2
        state.endStaticOrDynamicType = 1
      }
      start = state.start
      end = currentDate()
    },
  }[type]()
  start = dayjs(start).format(dateFormat1)
  end = dayjs(end).format(dateFormat1)
  if (needReturnValue) {
    return [start, end]
  }
  state.start = start
  state.end = end
  state.date = [start, end]
  dateChange('', type)
}

const handleDelete = (mark = false) => {
  // 数据看板且暂存mark为true
  if (mark && state.filterDateChecked) return
  if (state.filterDateChecked) {
    sessionStorage.removeItem(kanBanFilterDate)
  }
  updVal(
    {
      ...props.modelValue,
      date: [],
      diff: '',
      recentDay: '',
      startTime: '',
      endTime: '',
    },
    !mark
  )
}

const setDateSelected = debounce(
  (val = props.modelValue || {}, type, execute = false) => {
    val = {
      ...val,
      date: val.date
        ? val.date
        : [
            dayjs(val.startTime).format(dateFormat1),
            dayjs(val.endTime).format(dateFormat1),
          ],
      diff: (val.diff ? val.diff : val.recentDay) || '',
    }
    // 数据看板时
    if (!(Array.isArray(val.date) && val.date.length === 2)) {
      Object.keys(state).forEach((k) => {
        if (!['visible', 'highlight'].includes(k)) {
          state[k] = initVal()[k]
        }
      })
      return
    }
    let date = val.date
    // start是记录结束日期的  end是记录开始日期的
    const [start, end] = val.diff.split('-')
    // 处理动态时间
    if (start || end) {
      // 有快捷选项
      if (val.shortcutType) {
        date = setDateByStr(val.shortcutType, true)
      } else {
        const startDate = end
          ? dayjs().subtract(end, 'day').format(dateFormat1)
          : val.date[0]
        const endDate = start
          ? dayjs().subtract(start, 'day').format(dateFormat1)
          : val.date[1]
        date = [startDate, endDate]
      }
      /* if (props.needDynamic) {
        state.startStaticOrDynamicType = end ? 1 : 2
        state.endStaticOrDynamicType = start ? 1 : 2
      }*/
      state.startStaticOrDynamicType = end ? 1 : 2
      state.endStaticOrDynamicType = start ? 1 : 2
    } else {
      state.startStaticOrDynamicType = 2
      state.endStaticOrDynamicType = 2
    }
    state.start = date[0]
    state.end = date[1]
    state.date = date
    // type 没值要为 ''
    dateChange(
      '',
      type ?? (val.shortcutType || dateLabelEnum[state.dynamicDateText])
    )
    execute && updVal(mappingParams(), false)
  }
)

const radioGroupChange = () => {
  if (state.endStaticOrDynamicType === 2) {
    state.startStaticOrDynamicType = 2
  }
  state.shortcutType = ''
  getDynamicDateText()
}

// 获取暂存的筛选日期(数据看板)
if (props.isChecked && sessionStorage.getItem(kanBanFilterDate)) {
  state.filterDateChecked = true
  const dateData = JSON.parse(sessionStorage.getItem(kanBanFilterDate))
  updVal(dateData, false)
} else {
  setDateSelected(props.modelValue, null, true)
}
watch(
  () => cloneDeep(props.modelValue),
  (val, oldVal) => {
    const same = isEqual(val, oldVal)
    !same && setDateSelected(val, val.shortcutType, true)
  }
)

defineExpose({
  handleDelete,
  dynamicDateText: computed(() => state.dynamicDateText),
})
defineOptions({
  name: 'DateRangeSelect',
})
</script>
<style lang="scss">
.el-popper.nd-popover-date {
  //pointer-events: auto;
  $p: 7px 10px;
  padding: 0;
  border-radius: var(--eas-border-radius-4);
  height: 543px;
  background: #fff;
  box-shadow: 0 3px 6px 1px rgba(28, 32, 40, 0.18);
  border: none;

  .nd-popover-date-content {
    height: 100%;
  }

  .nd-popover-date-content-t {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 7px 20px;
    border-bottom: 1px solid var(--eas-border-color);
    height: 50px;
  }

  .nd-popover-date-content-c {
    display: flex;
    padding-left: 20px;
    padding-right: 20px;
    height: 429px;
    overflow: hidden;
    border-bottom: 1px solid var(--eas-border-color);

    .nd-shortcut-active {
      border-color: var(--eas-color-primary);
      color: var(--eas-color-primary);
    }

    &-l {
      width: 211px;
      border-right: 1px solid var(--eas-border-color);

      > div {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        padding: 10px 20px 10px 0;

        > div {
          height: 32px;
          line-height: 32px;
          text-align: center;
          background-color: var(--eas-color-primary-light-1);
          border-radius: var(--eas-border-radius-4);
          font-size: 14px;
          color: var(--eas-text-color-primary);
          border: 1px solid transparent;
          cursor: pointer;
          //width: calc(100% - 10px);
          width: 100%;

          &:nth-child(-n + 6) {
            //width: calc(50% - 10px);
            width: 90px;
          }

          &:hover {
            @extend .nd-shortcut-active;
          }
        }
      }
    }

    &-r {
      display: flex;
      flex: 1;
      padding: 10px 0 10px 20px;

      > div {
        &:first-of-type {
          display: flex;
          &:not(.skip) {
            justify-content: space-between;
            gap: 33px;
          }

          &.skip {
            margin-bottom: 15px;
            gap: 43px;
            .flex-column {
              &:last-of-type {
                margin-left: 38px;
              }
            }
          }

          > div {
            gap: 15px;
          }
          .el-input,
          .nd-fake-input {
            width: 175px;
          }
          .flex-column {
            min-width: 200px;
          }
        }
      }

      .nd-date-input {
        position: relative;

        .arrow-right {
          position: absolute;
          left: -17px;
          top: 50%;
          transform: translate(-50%, -50%);
        }
      }
    }
  }

  .nd-popover-date-content-b {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-left: 20px;
    padding-right: 20px;
    height: 64px;
  }
}
</style>

<style lang="scss" scoped>
.nd-range-date {
  background-color: #fff;
}

.not-default-slot {
  .nd-date-label {
    border-radius: 4px;
  }
}

.has-default-slot {
  .nd-date-label {
    border-radius: 4px 0 0 4px;
  }

  :deep(.event-date-comparison) {
    border-radius: 0 4px 4px 0;
  }
}

.nd-date-label {
  display: inline-block;
  height: 100%;
  padding: 0 8px;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  border: 1px solid var(--eas-text-color-light-1);

  > .flex-center {
    height: 100%;
  }

  &.nd-highlight {
    border-color: var(--eas-color-primary);
  }

  &:hover {
    @extend .nd-highlight;

    .nd-date-close {
      visibility: visible;
    }
  }
}

.not-border {
  border: none;
  //min-width: auto;
  padding: 0;
  height: auto;
}

.nd-date-close {
  visibility: hidden;
}
</style>
