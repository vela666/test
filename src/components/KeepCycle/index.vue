<script setup>
import { ref, reactive, watch } from 'vue'
import { ArrowDown, ArrowRight, Check } from '@element-plus/icons-vue'
import { numberInputProcessing } from '@/utils/index.js'
import { unitCycleType, dateEnum } from '@/enumeration/date.js'
import { t } from '@/locales/i18n'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ uniNum: 7, type: 'day' }),
  },
  showBorder: {
    type: Boolean,
    default: true,
  },
  placement: {
    type: String,
    default: 'bottom-start',
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const unitDict = {
  // day: 'day',
  customday: 'day',
  // week: 'week',
  customweek: 'week',
  // month: 'month',
  custommonth: 'month',
}

const state = reactive({
  day: 30,
  week: 16,
  selected: 7,
  selectedType: 'day',
  showMenu: false,
})

const cycle = ref(null)

const showTxt = [t('analysis.theSame'), t('analysis.theNext')]

watch(
  () => props.modelValue,
  (val) => {
    setCycle(val)
  }
)

// 设置 selected 和 selectedType
const setCycle = (val) => {
  if (val && typeof val.uniNum === 'number' && val.type) {
    state.selected = val.uniNum
    if (!getNewDate(dateEnum[val.type], val.type).includes(val.uniNum)) {
      state.selectedType = `custom${val.type}`
      state[val.type] = val.uniNum
    } else {
      state.selectedType = val.type
    }
  } else {
    state.selected = 7
    state.selectedType = 'day'
  }
}

const dropdownChange = (val) => {
  state.showMenu = val
  if (!val) {
    const oldType = props.modelValue.type
    const olduniNum = props.modelValue.uniNum
    const uniNum = state.selected
    const type = unitDict[state.selectedType] || state.selectedType
    // el-dropdown 弹出框关闭时触发数据更改 判断新值和旧值是否是一模一样
    if (oldType !== type || olduniNum !== uniNum) {
      emit('update:modelValue', { uniNum, type })
      emit('change', { uniNum, type, oldType })
    }
  }
}

const selectedCycle = (val, type) => {
  state.selected = val
  state.selectedType = type
  cycle.value?.handleClose()
}

const showText = (val) => {
  if ([0, 1].includes(val)) {
    return showTxt[val]
  }
  return val
}

// el-input-number绑定值被改变时触发
const inputNumberChange = (v, key) => {
  let val = +numberInputProcessing({ v, decimal: 0 })
  if (key === 'day') {
    val = val > 120 ? 120 : val
  } else {
    val = val > 16 ? 16 : val
  }
  state[key] = val
}

const getNewDate = (date, key) => {
  return date.slice(0, date.length - (key !== 'month' ? 1 : 0))
}

defineOptions({
  name: 'KeepCycle',
})
</script>

<template>
  <el-dropdown
    ref="cycle"
    trigger="click"
    :placement="placement"
    @visible-change="dropdownChange"
    popper-class="keep-cycle__dropdown">
    <div
      :class="[
        'eas-drop-box',
        'cycle-drop-box',
        { 'not-border': !showBorder },
        { 'is-show-menu': state.showMenu },
      ]">
      {{ `${showText(state.selected)}${unitCycleType[state.selectedType]}` }}
      <el-icon
        v-if="showBorder"
        :class="['arrow-icon', { 'is-rotate': state.showMenu }]">
        <ArrowDown />
      </el-icon>
    </div>
    <template #dropdown>
      <div class="cycle-particle">
        <div
          class="cycle-particle-seleced flex-center"
          :class="{
            'cycle-particle-seleced-active':
              key === (unitDict[state.selectedType] || state.selectedType),
          }"
          v-for="(date, key) of dateEnum"
          :key="key">
          <span class="flex-center flex-between w100-percentage">
            {{ unitCycleType[key] }}
            <el-icon><ArrowRight /></el-icon>
          </span>
          <div class="cycle-box">
            <div
              v-for="(item, index) in getNewDate(date, key)"
              :key="`${index}-${key}`"
              @click="selectedCycle(+item, key)">
              <div
                :class="[
                  `${state.selected}${state.selectedType}` === `${item}${key}`
                    ? 'yf-cycle-particle-selected'
                    : 'yf-cycle-particle-fixed',
                ]">
                <span>{{ `${showText(item)}${unitCycleType[key]}` }}</span>
                <span class="yf-cycle-particle-right">
                  <el-icon><Check /></el-icon>
                </span>
              </div>
            </div>
            <div
              @click="selectedCycle(+state[key], `custom${key}`)"
              v-if="key !== 'month'">
              <div
                :class="[
                  `${state.selected}${state.selectedType}` ===
                  `${state[key]}custom${key}`
                    ? 'yf-cycle-particle-selected'
                    : 'yf-cycle-particle-change',
                ]">
                <span class="yf-cycle-particle-left">
                  <span class="yf-cycle-particle-input" @click.stop>
                    <CommonInput
                      v-model="state[key]"
                      :clearable="false"
                      @change="(cur) => inputNumberChange(cur, key)"
                      :desc="$t('common.pleaseEnter')"
                      class="w80 h28"
                      :prefixSlot="false" />
                  </span>
                  <span class="yf-cycle-particle-label">{{
                    unitCycleType[key]
                  }}</span>
                </span>
                <span class="yf-cycle-particle-right">
                  <el-icon><Check /></el-icon>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </el-dropdown>
</template>

<style scoped lang="scss">
.cycle-particle {
  position: relative;
  display: flex;
  padding: 4px;
  flex-direction: column;
  font-size: 14px;
  gap: 4px;
  .cycle-particle-seleced {
    position: relative;
    min-width: 115px;
    color: var(--eas-text-color-primary);
    cursor: pointer;
    padding: 0 8px;
    height: 40px;
    &:after {
      content: '';
      position: absolute;
      top: 0;
      left: 15px;
      height: 100%;
      width: 100%;
    }
    &:hover {
      background-color: var(--eas-hover-color);
      .cycle-box {
        display: block;
      }
    }

    &.cycle-particle-seleced-active {
      background-color: var(--eas-color-primary-light-1);
    }
  }
}
.cycle-drop-box {
  display: flex;
  align-items: center;
  height: 32px;
  min-width: 71px;
  border-radius: 4px;
  border: 1px solid var(--eas-text-color-light-1);
  font-size: var(--eas-font-size-base);
  color: var(--eas-text-color-primary);
  &:hover {
    border-color: var(--eas-color-primary);
  }
  &.is-show-menu {
    border-color: var(--eas-color-primary);
  }
  &.not-border {
    min-width: 28px;
    border: none;
  }
}

.cycle-box {
  position: absolute;
  top: 0;
  left: 130px;
  display: none;
  width: 150px;
  padding: 4px 4px 0 4px;
  background-color: #fff;
  color: var(--eas-text-color-primary);
  box-shadow: 0 3px 10px 1px rgba(28, 32, 40, 0.18);

  .yf-cycle-particle-fixed,
  .yf-cycle-particle-selected,
  .yf-cycle-particle-change {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 40px;
    margin-bottom: 4px;
    padding-left: 8px;
    font-size: 14px;
    cursor: pointer;
    .yf-cycle-particle-right {
      flex: 1 1;
      padding-right: 6px;
      font-size: 16px;
      text-align: right;
      opacity: 0;
    }
    .yf-cycle-particle-left {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      width: 110px;
    }
    .yf-cycle-particle-label {
      margin-left: 5px;
    }
  }
  .yf-cycle-particle-fixed,
  .yf-cycle-particle-change {
    &:hover {
      background-color: var(--eas-hover-color);
    }
  }
  .yf-cycle-particle-selected {
    background-color: var(--eas-color-primary-light-1);
    .yf-cycle-particle-right {
      opacity: 1;
      color: var(--eas-color-primary);
    }
  }
}
</style>
<style lang="scss">
.el-dropdown__popper.keep-cycle__dropdown {
  background: #fff;
  border-radius: var(--eas-border-radius-4);
  box-shadow: 0px 3px 10px 1px rgba(28, 32, 40, 0.18);
  margin-top: -11px;
  .el-popper__arrow,
  .el-scrollbar__bar {
    display: none;
  }
  .el-scrollbar,
  .el-scrollbar__wrap {
    overflow: visible;
  }
}
</style>
