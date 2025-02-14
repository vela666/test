<template>
  <div
    @click="showPopover(true)"
    class="c616161"
    :class="{
      active: visible && needStage,
      'event-date-comparison': needStage,
      'kanban-comparison': !needStage,
      'kanban-comparison-active': !needStage && modelValue.length,
    }">
    <el-popover
      popper-class="event-date-comparison-popover"
      placement="bottom-start"
      width="320"
      @hide="hide"
      :offset="offset"
      :visible="visible"
      :show-arrow="false">
      <div class="stage-content">
        <div>
          <div
            v-for="(item, index) of stageList"
            :key="index"
            class="stage-list">
            <div class="flex-center gap10">
              <span class="fz14 c616161"
                >{{ t('dateRangeSelect.stage') }}{{ index + 1 }}
              </span>
              <DateRangeSelect
                :ref="(el) => setRefs(el, index)"
                v-model="stageList[index]"
                placement="bottom-start" />
              <SvgIcon
                @click="delStage(index)"
                name="delete1"
                class="fz14 c-pointer c545e6e" />
            </div>
          </div>
        </div>
        <div class="flex-center flex-between">
          <el-button
            :style="[
              `visibility:${stageList.length === 2 ? 'hidden' : 'visible'}`,
              'transition: none',
            ]"
            :disabled="stageList.length === 2"
            @click="addStage"
            text
            class="fz14">
            +{{ t('dateRangeSelect.addStage') }}
          </el-button>
          <div>
            <el-button @click="cancel"> {{ t('btn.cancel') }} </el-button>
            <el-button @click="apply" type="primary">
              {{ t('btn.confirm') }}
            </el-button>
          </div>
        </div>
      </div>
      <template #reference>
        <div class="flex-center gap10">
          <span>VS</span>
          <div class="stage flex-center" v-if="modelValue.length && needStage">
            {{
              modelValue.length > 1
                ? t('dateRangeSelect.stageCount', [modelValue.length])
                : modelValue[0].mainName
            }}
            <el-icon @click.stop="clearStage" class="fz12 ml5 c-pointer"
              ><Close
            /></el-icon>
          </div>
        </div>
      </template>
    </el-popover>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { cloneDeep, debounce, isEqual, isObject } from 'lodash-es'
import { Close } from '@element-plus/icons-vue'
import { dateFormat1, past7DayEnd, past7DayStart } from '@/enumeration/date'
import { dateLabelEnum } from '../enum'
import { setDateValue } from '../util.js'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
/*
{
    "timeZone": "8",
    "timeParticle": "day",
    "recentDay": "1-7",
    "startTime": "2023-10-11 00:00:00",
    "endTime": "2023-10-17 23:59:59",
    "graphType": 1,
    "versus": [
        {
            "date": [
                "2023-10-09",
                "2023-10-15"
            ],
            "diff": "3-9",
            "mainName": "过去9天-过去3天",
            "startTime": "2023-10-09 00:00:00",
            "endTime": "2023-10-15 23:59:59",
            "tableCurrentSelectionStage": true
        }
    ]
}
vs对比组件
<DateDropDown v-model="value">
    <EventComparison v-model="value.versus" />
</DateDropDown>
*/

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  // 需要显示已选阶段
  needStage: {
    type: Boolean,
    default: true,
  },
  offset: {
    type: [String, Number],
    default: 8,
  },
  // 阶段初始值根据此基准值计算
  // 比如: 基准值为过去7天，则第一个阶段初始值为过去14天，第二阶段初始值为过去21天
  date: {
    type: Object,
    default: () => ({
      // 过去七天
      date: [past7DayStart, past7DayEnd],
      diff: '1-7',
      // 如过去多少N天 等
      mainName: '',
      startTime: past7DayStart + ' 00:00:00',
      endTime: past7DayEnd + ' 23:59:59',
      shortcutType: dateLabelEnum['过去7天'],
    }),
  },
})
const emit = defineEmits(['update:modelValue', 'apply'])
let appDom = document.getElementById('app')

const { t } = useI18n()

const visible = ref(false)
const stageList = ref([])
const dateDropDownRefs = ref({})
const setRefs = (el, name) => {
  dateDropDownRefs.value[name] = el
}
/*const defaultStage = () => {
  return {
    // 过去七天
    date: [past7DayStart, past7DayEnd],
    diff: '1-7',
    // 如过去多少N天 等
    mainName: '',
    startTime: past7DayStart + ' 00:00:00',
    endTime: past7DayEnd + ' 23:59:59',
    shortcutType: dateLabelEnum['过去7天'],
  }
}*/
const isManual = ref(false)
const clearStage = () => {
  isManual.value = true
  emit('update:modelValue', [])
  emit('apply')
}
const delStage = (index) => {
  stageList.value.splice(index, 1)
}

const mappingParams = () => {
  return stageList.value.map((item, index) => {
    return {
      ...item,
      startTime: item.date[0] + ' 00:00:00',
      endTime: item.date[1] + ' 23:59:59',
      mainName: dateDropDownRefs.value[index]?.dynamicDateText,
      tableCurrentSelectionStage: index === 0,
    }
  })
}

const hide = () => {
  appDom?.classList?.remove('prevent-no')
  visible.value = false
}

const showPopover = (bool = false) => {
  visible.value = bool
  stageList.value = cloneDeep(props.modelValue)
  if (bool) {
    if (!stageList.value.length) addStage()
    appDom?.classList?.add('prevent-no')
  }
}
const addStage = () => {
  // date里的日期减去天数差异，diff加上天数差异即可
  let newDate = stageList.value.length
    ? cloneDeep(stageList.value[0])
    : cloneDeep(props.date)
  // 定义两个日期
  const date1 = dayjs(newDate.date[0])
  const date2 = dayjs(newDate.date[1])
  // 计算两个日期之间的天数差异包含当天
  const diffInDays = date2.diff(date1, 'day') + 1
  const start = date1.subtract(diffInDays, 'day').format(dateFormat1)
  const end = date2.subtract(diffInDays, 'day').format(dateFormat1)
  newDate.date = [start, end]
  newDate.startTime = `${start} 00:00:00`
  newDate.endTime = `${end} 23:59:59`
  const [startDiff = '', endDiff = ''] = newDate.diff.split('-')
  const diff = `${startDiff ? +startDiff + diffInDays : startDiff}-${endDiff ? +endDiff + diffInDays : endDiff}`
  newDate.diff = diff
  newDate.recentDay = diff
  newDate.mainName = ''
  newDate.shortcutType = ''
  stageList.value.push(newDate)
}
// 取消
const cancel = () => {
  // stageList.value = []
  showPopover()
}

const apply = () => {
  isManual.value = true
  emit('update:modelValue', mappingParams())
  emit('apply')
  showPopover()
}

showPopover()

// 仅初始化执行
let requestIdleCallbackId = null
const stopWatch = watch(
  stageList,
  debounce(() => {
    stopWatch()
    if (!Object.keys(props.modelValue).length) return
    requestIdleCallback(() => {
      isManual.value = true
      emit('update:modelValue', mappingParams())
      cancelIdleCallback(requestIdleCallbackId)
    })
  }),
  {
    deep: true,
  }
)

const getResList = (list) => {
  const temp = []
  if (Array.isArray(list)) {
    for (const item of list) {
      const res = setDateValue(item)
      temp.push(cloneDeep(res))
    }
  }
  if (temp.length > 0) {
    emit('update:modelValue', temp)
  }
}

watch(
  () => props.modelValue,
  (val, oldVal) => {
    if (
      isObject(val) &&
      Object.keys(val).length > 0 &&
      !isManual.value &&
      !isEqual(val, oldVal)
    ) {
      getResList(val)
    }
    isManual.value = false
  }
)
defineOptions({
  name: 'EventComparison',
})
</script>
<style lang="scss">
.event-date-comparison-popover {
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16);
  border-radius: 2px;
  padding: 0 !important;
  border: none;
  pointer-events: auto;

  /* & ~ .nd-popover-date {
    pointer-events: auto;
  }*/
}
</style>
<style scoped lang="scss">
.event-date-comparison {
  height: 32px;
  //width: 35px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--eas-text-color-light-1);
  cursor: pointer;
}
.kanban-comparison {
  width: 24px;
  height: 18px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  &:hover {
    color: var(--eas-color-primary);
  }
}
.kanban-comparison-active {
  color: var(--eas-color-primary);
  background-color: #e7e7ea;
}

.stage {
  //width: 76px;
  height: 22px;
  padding: 0 5px;
  color: #616161;
  line-height: 22px;
  background: #f0f2f5;
  border-radius: 2px;
}

.stage-content {
  > div {
    padding: 20px;

    &:first-of-type {
      > div {
        &:first-of-type {
          margin-bottom: 10px;
        }
      }
      &:empty {
        text-align: center;
        color: #616161;
        &::after {
          content: '暂无对比阶段';
        }
      }
    }

    &:last-of-type {
      border-top: 1px solid #dedede;
      height: 50px;
    }
  }
}

.active {
  //background-color: #ecf6ff;
  border-color: var(--eas-color-primary);
  //color: #409eff;
}
</style>
