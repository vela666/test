<script setup>
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import { Check } from '@element-plus/icons-vue'
import { strip } from '@/utils'
import { ElMessage } from 'element-plus'
import { t } from '@/locales/i18n'
defineOptions({
  name: 'GroupRange',
})
const props = defineProps({
  placement: {
    type: String,
    default: 'bottom-start',
  },
  modelValue: {
    type: Object,
    default: () => ({
      propertyRange: [0],
      propertyRangeType: 0,
    }),
  },
  group: {
    type: Object,
  },
  data: {
    type: Array,
    default: () => [
      { title: t('analysis.scatter.discreteNumbers'), value: 0 },
      { title: t('analysis.scatter.customRange'), value: 2 },
    ],
  },
})

// const rangeTypes = [
//   { title: '离散数字', value: 0 },
//   { title: '自定义区间', value: 2 },
// ]

const emit = defineEmits(['update:modelValue'])
const ranges = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val)
  },
})
if (ranges.value?.propertyRange?.length === 0) {
  ranges.value.propertyRange = [0]
}
// propertyRangeType 1 为初始值
if (ranges.value?.propertyRangeType === 1) {
  ranges.value.propertyRangeType = 0
}

const MAX_STEP_NUM = 51

const step = ref(50)
const stepNum = ref(1)
const showBatch = ref(false)
const visible = ref(false)
watch(visible, (val) => {
  if (!val) {
    showBatch.value = false
    step.value = 50
    stepNum.value = 1
  }
})

const showCustom = computed(() => ranges.value.propertyRangeType === 2)
watch(showCustom, (val) => {
  if (!val) {
    showBatch.value = false
    step.value = 50
    stepNum.value = 1
    ranges.value.propertyRange = [0]
  }
})

function setStepNum(val) {
  const limitNum = MAX_STEP_NUM - ranges.value.propertyRange.length
  if (val > limitNum) {
    stepNum.value = limitNum || 1
  }
}

watch(stepNum, (val) => {
  setStepNum(val)
})

//全部清空
const clearRangeArea = () => (ranges.value.propertyRange = [0])
// 删除某一项
const delRangeAreaItem = (index) => {
  ranges.value.propertyRange.splice(index, 1)
}
//
const inputNumberChange = (currentValue, oldValue, index) => {
  // 增加数值
  if (currentValue > oldValue) {
    for (let i = index + 1; i < ranges.value.propertyRange.length; i++) {
      ranges.value.propertyRange[i] = strip(ranges.value.propertyRange[i]) + 1
    }
  }
}
// 添加数值自定义区间
const addRangeArea = () => {
  const len = ranges.value.propertyRange.length
  if (len >= MAX_STEP_NUM) {
    ElMessage.warning(t('analysis.interval.maxIntervals', [MAX_STEP_NUM - 1]))
    return
  }
  const num = strip(ranges.value.propertyRange[len - 1]) + strip(step.value)
  ranges.value.propertyRange.push(strip(num))
  setStepNum(stepNum.value)
}

const addRangeBatch = () => {
  const len = ranges.value.propertyRange.length
  if (len >= MAX_STEP_NUM) {
    ElMessage.warning(t('analysis.interval.maxIntervals', [MAX_STEP_NUM - 1]))
    return
  }
  let num = ranges.value.propertyRange[len - 1]
  for (let i = 0; i < stepNum.value; i++) {
    num += strip(step.value)
    ranges.value.propertyRange.push(strip(num))
  }
  showBatch.value = false
  setStepNum(stepNum.value)
}

const blurHandle = (e, cb) => {
  if (!e.target.value) {
    cb()
  }
}

onBeforeUnmount(() => {
  ranges.value = {
    propertyRange: [],
    propertyRangeType: 0,
  }
})
</script>

<template>
  <div class="group-range">
    <el-popover
      trigger="click"
      :width="180"
      :hide-after="0"
      :placement="placement"
      v-model:visible="visible">
      <template #reference>
        <div class="group-summary">
          <svg-icon name="setting"></svg-icon>
        </div>
      </template>
      <div>
        <el-radio-group
          v-model="ranges.propertyRangeType"
          class="group-range-radio">
          <el-radio
            v-for="item in data"
            :key="`group-range-item__${item.value}`"
            :value="item.value"
            >{{ item.title }}</el-radio
          >
        </el-radio-group>
        <div class="range-panel" v-if="showCustom">
          <div class="range-panel__header">
            {{ $t('common.range') }}
            <el-button type="primary" text @click="clearRangeArea">
              <svg-icon name="delete1" class="fz14 mr3"></svg-icon>
              {{ $t('analysis.clearAll') }}
            </el-button>
          </div>
          <div class="range-panel__body">
            <div class="range-item">
              <span class="item__symbol">(</span>
              <span class="item__static is-infin">&minus;&infin;</span>
              <span class="item__symbol">,</span>
              <el-input-number
                controls-position="right"
                class="range-input"
                :value-on-clear="0"
                v-model="ranges.propertyRange[0]"
                @change="
                  (currentValue, oldValue) =>
                    inputNumberChange(currentValue, oldValue, 0)
                "
                @blur="
                  (e) => blurHandle(e, () => (ranges.propertyRange[0] = 0))
                " />
              <span class="item__symbol">)</span>
              <span class="del__area"></span>
            </div>
            <template v-if="ranges.propertyRange.length > 1">
              <div
                class="range-item"
                v-for="(pitem, pindex) in ranges.propertyRange"
                :key="`range___2PQ_s${pindex}`">
                <template v-if="pindex < ranges.propertyRange.length - 1">
                  <span class="item__symbol">[</span>
                  <span class="item__static" :title="strip(pitem)">{{
                    strip(pitem)
                  }}</span>
                  <span class="item__symbol">,</span>
                  <el-input-number
                    v-model="ranges.propertyRange[pindex + 1]"
                    controls-position="right"
                    class="range-input"
                    :min="ranges.propertyRange[pindex]"
                    @change="
                      (currentValue, oldValue) =>
                        inputNumberChange(currentValue, oldValue, pindex + 1)
                    "
                    @blur="
                      (e) =>
                        blurHandle(
                          e,
                          () =>
                            (ranges.propertyRange[pindex + 1] =
                              ranges.propertyRange[pindex])
                        )
                    " />
                  <span class="item__symbol">)</span>
                  <span class="del__area">
                    <el-button
                      type="primary"
                      text
                      @click="delRangeAreaItem(pindex + 1)">
                      <svg-icon name="delete2" class="fz16 mr3"></svg-icon>
                    </el-button>
                  </span>
                </template>
              </div>
            </template>
            <div class="range-item">
              <span class="item__symbol">[</span>
              <span
                class="item__static"
                :title="
                  strip(ranges.propertyRange[ranges.propertyRange.length - 1])
                "
                >{{
                  strip(ranges.propertyRange[ranges.propertyRange.length - 1])
                }}
              </span>
              <span class="item__symbol">,</span>
              <span class="item__static is-infin">&plus;&infin;</span>
              <span class="item__symbol">)</span>
              <span class="del__area"></span>
            </div>
          </div>
          <div class="range-oprator">
            <el-button type="primary" text @click="addRangeArea">
              <svg-icon name="add-index" class="fz14 mr3"></svg-icon>
              {{ $t('analysis.interval.addInterval') }}
            </el-button>
            <el-button type="primary" text @click="showBatch = true">
              <svg-icon name="add-index" class="fz14 mr3"></svg-icon>
              {{ $t('analysis.batchAdd') }}
            </el-button>
            <!-- <el-button type="primary" text>
              <svg-icon name="save-draft" class="fz14 mr3"></svg-icon>
              保存为模板
            </el-button> -->
          </div>
          <div class="range-panel__footer" v-show="showBatch">
            {{ $t('analysis.stepSize') }}
            <el-input-number
              class="range-input"
              v-model.number="step"
              :min="0.01"
              style="margin: 0 6px"
              controls-position="right"
              :value-on-clear="50"
              @blur="(e) => blurHandle(e, () => (step = 50))" />
            {{ $t('analysis.stepCount') }}
            <el-input-number
              class="range-input"
              v-model.number="stepNum"
              :value-on-clear="1"
              :min="1"
              step-strictly
              style="margin: 0 6px"
              controls-position="right"
              @blur="(e) => blurHandle(e, () => (stepNum = 1))" />
            <el-button type="primary" text @click="addRangeBatch">
              <el-icon class="fz18"><Check /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<style scoped lang="scss">
.group-range-radio {
  display: flex;
  flex-direction: column;
  align-items: normal;
}
.range-panel {
  position: absolute;
  bottom: 0;
  left: 179px;
  width: 280px;
  background-color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
  &.is-infin {
    font-size: 20px;
  }
}
.range-input {
  width: 80px;
  &.el-input-number {
    :deep(.el-input-number__decrease),
    :deep(.el-input-number__increase) {
      --el-input-number-controls-height: 13px;
      width: 22px;
      opacity: 0;
    }
    :deep(.el-input-number__increase) {
      top: 3px;
    }
    :deep(.el-input-number__decrease) {
      bottom: 3px;
    }
    :deep(.el-input) {
      --el-input-height: 28px;
    }
    :deep(.el-input__wrapper) {
      padding-left: 5px;
      padding-right: 22px;
      border-radius: var(--eas-border-radius);
    }
    &:hover {
      :deep(.el-input-number__increase),
      :deep(.el-input-number__decrease) {
        opacity: 1;
      }
    }
  }
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
</style>
