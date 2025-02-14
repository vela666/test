<template>
  <el-popover
    @hide="popoverHide"
    @show="popoverShow"
    trigger="click"
    :width="350"
    :hide-after="0"
    :show-arrow="false"
    :placement="placement"
    v-model:visible="visible">
    <template #reference>
      <div
        :style="`height:${h}`"
        class="nd-interval-range-label"
        :class="{ 'not-border': !showBorder, 'nd-highlight': highlight }">
        <div class="flex-center">
          <span class="mr5 fz14 c545e6e">
            {{ t('analysis.interval.intervalRange') }}</span
          >
          <el-icon class="ml5" v-show="showBorder"><ArrowDown /></el-icon>
        </div>
      </div>
    </template>
    <div class="flex-column gap10 mb10">
      <div>{{ t('analysis.interval.setIntervalRange') }}</div>
      <el-radio-group v-model="ranges.type">
        <el-radio-button
          v-for="item in rangeTypes"
          :key="`group-range-item__${item.value}`"
          :value="item.value"
          >{{ item.title }}</el-radio-button
        >
      </el-radio-group>

      <div v-if="ranges.type === 1">
        <span>{{ t('analysis.interval.intervalCount') }}</span>
        <el-input
          @change="(v) => intervalNumberInput(v)"
          v-model="ranges.intervalNumber"
          class="w50 mr5" />{{ t('analysis.interval.equalDivision') }}
      </div>

      <div class="range-panel" v-else>
        <div class="flex-center gap5 nd-interval-unit">
          <span
            >{{ t('analysis.interval.intervalUnit')
            }}{{ t('analysis.interval.seconds') }}</span
          >
        </div>
        <div class="range-panel__body">
          <div class="range-item">
            <span class="item__symbol">(</span>
            <span class="item__static">0</span>
            <span class="item__symbol">~</span>
            <el-input
              class="w80"
              @change="(v) => rangeInput(v, 0)"
              v-model="ranges.customIntervalRange[0]" />
            <span class="item__symbol">)</span>
            <span class="del__area"></span>
          </div>
          <template v-if="ranges.customIntervalRange.length > 2">
            <template
              v-for="(pitem, pindex) in ranges.customIntervalRange"
              :key="`range___2PQ_s${pindex}`">
              <div
                class="range-item"
                v-if="pindex < ranges.customIntervalRange.length - 2">
                <span class="item__symbol">[</span>
                <span class="item__static" :title="strip(pitem)">{{
                  strip(pitem)
                }}</span>
                <span class="item__symbol">~</span>
                <el-input
                  @change="(v) => rangeInput(v, pindex + 1)"
                  v-model="ranges.customIntervalRange[pindex + 1]"
                  class="w80" />
                <span class="item__symbol">)</span>
                <span class="del__area">
                  <el-button
                    type="primary"
                    text
                    @click="delRangeAreaItem(pindex + 1)">
                    <svg-icon name="delete2" class="fz16 mr3"></svg-icon>
                  </el-button>
                </span>
              </div>
            </template>
          </template>
          <div class="range-item">
            <span class="item__symbol">[</span>
            <span
              class="item__static"
              :title="
                strip(
                  ranges.customIntervalRange[
                    ranges.customIntervalRange.length - 2
                  ]
                )
              "
              >{{
                strip(
                  ranges.customIntervalRange[
                    ranges.customIntervalRange.length - 2
                  ]
                )
              }}
            </span>
            <span class="item__symbol">~</span>
            <!--            <span class="item__static">{{ intervalLimitTime }}</span>-->
            <span class="item__static">{{
              strip(
                ranges.customIntervalRange[
                  ranges.customIntervalRange.length - 1
                ]
              )
            }}</span>
            <span class="item__symbol">)</span>
            <span class="del__area"></span>
          </div>
        </div>
        <div class="range-oprator">
          <el-button type="primary" text @click="addRangeArea">
            <svg-icon name="add-index" class="fz14 mr3"></svg-icon>
            {{ t('analysis.interval.addInterval') }}
          </el-button>
        </div>
      </div>
    </div>
    <div class="flex flex-justify-content-end">
      <el-button class="skip ml20" @click="cancel">{{
        t('btn.cancel')
      }}</el-button>
      <el-button type="primary" @click="apply">{{
        t('btn.confirm')
      }}</el-button>
    </div>
  </el-popover>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { numberInputProcessing, strip } from '@/utils'
import { ElMessage } from 'element-plus'
import { cloneDeep } from 'lodash-es'
import { initRanges } from '@/views/analysis/interval/enum.js'
import { convertToSeconds } from '@/utils/dataProcessing.js'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数

const props = defineProps({
  placement: {
    type: String,
    default: 'bottom-end',
  },
  h: {
    type: String,
    default: '32px',
  },
  showBorder: {
    type: Boolean,
    default: true,
  },
  intervalLimit: {
    type: Object,
    default: () => ({
      time: 1,
      type: 'hour',
    }),
  },
  group: {
    type: Object,
  },
})
const emit = defineEmits(['change'])
const rangeTypes = [
  { title: t('analysis.interval.equalIntervals'), value: 1 },
  { title: t('analysis.interval.customIntervals'), value: 2 },
]

const intervalLimitTime = computed(() => {
  return convertToSeconds(props.intervalLimit)
})

const intervalRangeData = defineModel({
  type: Object,
  default: () => initRanges(),
})

const ranges = ref(initRanges())

const MAX_STEP_NUM = 20

const highlight = ref(false)
const visible = ref(false)

const updRanges = () => {
  ranges.value = cloneDeep(intervalRangeData.value)
  if (ranges.value.customIntervalRange.length === 0) {
    ranges.value.customIntervalRange = ['', intervalLimitTime.value]
  }
}

const popoverShow = () => {
  updRanges()
  highlight.value = true
}

const popoverHide = () => {
  updRanges()
  highlight.value = false
}

// 删除某一项
const delRangeAreaItem = (index) => {
  ranges.value.customIntervalRange.splice(index, 1)
}

const intervalNumberInput = (v) => {
  let val = +numberInputProcessing({ v, decimal: 0, initial: 1 })
  ranges.value.intervalNumber = Math.max(1, Math.min(val, 20))
}

const rangeInput = (v, i) => {
  ranges.value.customIntervalRange[i] = +numberInputProcessing({
    v,
    decimal: 0,
  })
}

const resetRange = () => {
  let arr = [
    ...ranges.value.customIntervalRange.slice(0, -1),
    intervalLimitTime.value,
  ]
  // -2 让arr[i + 1] 访问到下一个元素
  for (let i = arr.length - 2; i >= 0; i--) {
    if (arr[i] > arr[i + 1]) {
      arr[i] = arr[i + 1]
    }
  }
  intervalRangeData.value.customIntervalRange = arr
  updRanges()
}

const checkError = () => {
  let arr = ranges.value.customIntervalRange
  // -2 让arr[i + 1] 访问到下一个元素
  for (let i = arr.length - 2; i >= 0; i--) {
    if (arr[i] === '' || arr[i] > arr[i + 1]) {
      return t('analysis.interval.pleaseInputCorrectly')
    }
  }
  return false
}

// 添加数值自定义区间
const addRangeArea = () => {
  const len = ranges.value.customIntervalRange.length
  if (len >= MAX_STEP_NUM) {
    ElMessage.warning(t('analysis.interval.maxIntervals', [MAX_STEP_NUM]))
    return
  }
  // 在最后一个元素前插入新值
  ranges.value.customIntervalRange.splice(
    ranges.value.customIntervalRange.length - 1,
    0,
    ''
  )
}

const cancel = (v) => {
  visible.value = false
}

const apply = () => {
  ElMessage.closeAll()
  if (ranges.value.type === 2 && checkError()) {
    ElMessage.error(checkError())
    return
  }

  intervalRangeData.value = cloneDeep(ranges.value)
  cancel()
  emit('change')
}

const stopWatch = watch(intervalRangeData, (value) => {
  updRanges()
  stopWatch()
})

defineExpose({
  resetRange,
})
defineOptions({
  name: 'IntervalRange',
})
</script>

<style scoped lang="scss">
.group-range-radio {
  display: flex;
  flex-direction: column;
  align-items: normal;
}
.range-panel {
  color: var(--eas-text-color-primary);
  font-size: var(--eas-font-size-base);
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 30px;
    padding: 0 8px;
  }
  &__body {
    max-height: 240px;
    padding: 8px;
    overflow-y: auto;
  }
}
.range-item {
  width: 100%;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  &:hover {
    .del__area {
      opacity: 1;
    }
  }
}
.item__symbol {
  padding: 0 4px;
}
.item__static {
  display: inline-block;
  width: 80px;
  height: 28px;
  color: var(--eas-text-color-light);
  line-height: 28px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background-color: #f6f8fa;
  border: 1px solid #f0f0f0;
}

.del__area {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-left: 4px;
  color: var(--eas-text-color-light);
  font-size: var(--eas-font-size-base);
  opacity: 0;
}
.range-oprator {
  display: flex;
  justify-content: space-between;
  padding: 8px;
}
.range-panel__footer {
  width: 100%;
  padding: 8px;
  border-top: 1px solid var(--eas-border-color);
  display: flex;
  align-items: center;
}

.nd-interval-range-label {
  display: inline-block;
  height: 100%;
  padding: 0 8px;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  border: 1px solid var(--eas-text-color-light-1);
  border-radius: 4px;
  > .flex-center {
    height: 100%;
  }

  &.nd-highlight {
    border-color: var(--eas-color-primary);
  }

  &:hover {
    @extend .nd-highlight;
  }
}

.not-border {
  border: none;
  //min-width: auto;
  padding: 0;
  height: auto;
}

.nd-interval-unit {
  :deep(.el-radio-group) {
    gap: 15px;
    label {
      margin-right: 0;
    }
  }
}
</style>
