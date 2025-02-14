<script setup>
import { ref, reactive, watch } from 'vue'
import { ArrowDown, Check } from '@element-plus/icons-vue'
defineOptions({
  name: 'KeepCycle2',
})
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

const dayArr = [0, 1, 7, 14]
const dict = {
  day: '日',
  customDay: '日',
}
const unitDict = {
  day: 'day',
  customDay: 'day',
}

const state = reactive({
  day: 30,
  selected: 7,
  selectedType: 'day',
  showMenu: false,
})

const cycle = ref(null)

const showTxt = ['当', '次']

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
    if (val.type === 'day' && dayArr.indexOf(val.uniNum) === -1) {
      state.selectedType = 'customDay'
      state.day = val.uniNum
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
    const type = unitDict[state.selectedType]
    // el-dropdown 弹出框关闭时触发数据更改 判断新值和旧值是否是一模一样
    if (oldType !== type || olduniNum !== uniNum) {
      emit('update:modelValue', { uniNum, type })
      emit('change', { uniNum, type })
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
const inputNumberChange = (cur, type) => {
  if (state.selectedType === type) {
    if (cur !== 0 && !cur) {
      state.selected = 0
    } else {
      state.selected = cur
    }
  }
}

const blurNumber = (e, name) => {
  if (e.target.value !== 0 && !e.target.value) {
    state[name] = 0
  }
}
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
      {{ `${showText(state.selected)}${dict[state.selectedType]}` }}
      <el-icon
        v-if="showBorder"
        :class="['arrow-icon', { 'is-rotate': state.showMenu }]">
        <ArrowDown />
      </el-icon>
    </div>
    <template #dropdown>
      <div class="cycle-particle">
        <div class="cycle-box">
          <!-- 天-->
          <!-- <div style="margin-bottom: 10px">
            <div class="yf-cycle-particle-title">
              <span class="yf-cycle-particle-name">日</span>
            </div>
          </div> -->
          <div
            v-for="(item, index) in dayArr"
            :key="`${index}-day`"
            @click="selectedCycle(item, 'day')">
            <div
              :class="[
                `${state.selected}${state.selectedType}` === `${item}day`
                  ? 'yf-cycle-particle-selected'
                  : 'yf-cycle-particle-fixed',
              ]">
              <span>{{ showText(item) }}日</span>
              <span class="yf-cycle-particle-right">
                <el-icon><Check /></el-icon>
              </span>
            </div>
          </div>
          <div @click="selectedCycle(state.day, 'customDay')">
            <div
              :class="[
                `${state.selected}${state.selectedType}` ===
                `${state.day}customDay`
                  ? 'yf-cycle-particle-selected'
                  : 'yf-cycle-particle-change',
              ]">
              <span class="yf-cycle-particle-left">
                <span class="yf-cycle-particle-input" @click.stop>
                  <el-input-number
                    v-model="state.day"
                    class="input-cycle"
                    controls-position="right"
                    :min="0"
                    :max="120"
                    :step="1"
                    step-strictly
                    @change="(cur) => inputNumberChange(cur, 'customDay')"
                    @blur="(e) => blurNumber(e, 'day')" />
                </span>
                <span class="yf-cycle-particle-label">日</span>
              </span>
              <span class="yf-cycle-particle-right">
                <el-icon><Check /></el-icon>
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </el-dropdown>
</template>

<style scoped lang="scss">
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
.el-dropdown-menu.el-popper.cycle-particle {
  padding: 0;
}
.cycle-box {
  width: 186px;
  padding: 4px 4px 0 4px;
  background-color: #fff;
  color: var(--eas-text-color-primary);
  .yf-cycle-particle-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-right: 12px;
    .yf-cycle-particle-name {
      position: relative;
      height: auto;
      margin-bottom: 4px;
      padding: 6px 8px;
      font-weight: 500;
      font-size: 14px;
      line-height: 20px;
      border: none;
    }
  }
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
      margin-left: 4px;
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
.input-cycle {
  width: 70px;
  :deep() &.el-input-number {
    .el-input-number__decrease,
    .el-input-number__increase {
      display: none;
    }
    .el-input {
      --el-input-height: 28px;
    }
    .el-input__wrapper {
      padding: 0px 5px;
      border-radius: var(--eas-border-radius);
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
  .el-popper__arrow {
    display: none;
  }
}
</style>
