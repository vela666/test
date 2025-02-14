<script setup>
import { ref, reactive, nextTick, computed, watch } from 'vue'
import { cloneDeep } from 'lodash-es'
import { unitCycleType } from '@/enumeration/date.js'

defineOptions({
  name: 'SettingShow',
})
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ apply: 1, days: [] }),
    validator: (value) => {
      return (
        value.apply &&
        [1, 2].includes(value.apply) &&
        Array.isArray(value.days) &&
        value.days.every((el) => typeof el === 'number')
      )
    },
  },
  unitCycle: {
    type: String,
    default: 'day',
  },
  showBorder: {
    type: Boolean,
    default: true,
  },
  placement: {
    type: String,
    default: 'bottom-end',
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const state = reactive({
  isEdit: false,
  textarea: '',
})

const inputRef = ref(null)

const settings = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
  },
})

const completeDisabled = computed(() => {
  if (!state.textarea) return true
  let arr = state.textarea
    .split(',')
    .filter((el) => el && !isNaN(el))
    .map((el) => Number(el))
  arr = [...new Set(arr)].sort((a, b) => a - b)
  if (arr.length === 0) return true
  return false
})

// 切换为编辑状态
const setEdit = () => {
  state.isEdit = true
  const days = cloneDeep(settings.value.days)
  state.textarea = days.join(',')
  nextTick(() => {
    inputRef.value?.focus()
  })
}
// 完成
const complete = () => {
  if (!state.textarea) return
  let arr = state.textarea
    .split(',')
    .filter((el) => el && !isNaN(el))
    .map((el) => Number(el))
  arr = [...new Set(arr)].sort((a, b) => a - b)
  if (arr.length === 0) return
  state.isEdit = false
  settings.value.days = arr
  state.textarea = ''
  emit('change')
}
// el-input 的input事件限制只能输入数字和','
const inputData = (val) => {
  // 切换为英文的逗号
  val = val.replace(/，/g, ',')
  val = val.replace(/[^\d,]/g, '')
  nextTick((_) => {
    state.textarea = val
  })
}
const closeTag = (val) => {
  settings.value.days.splice(val, 1)
  emit('change')
}
const checkBoxChange = (val) => {
  if (val === 1) {
    state.isEdit = false
  }
  emit('change')
}
const showMenu = ref(false)
const visibleChange = (val) => {
  showMenu.value = val
  if (!val) {
    state.isEdit = false
    state.textarea = ''
  }
}
</script>

<template>
  <el-dropdown
    popper-class="setting-show__dropdown"
    trigger="click"
    :placement="placement"
    @visible-change="visibleChange">
    <div
      :class="[
        'eas-drop-box',
        'setting-show',
        { 'not-border': !showBorder },
        { 'is-show-menu': showMenu },
      ]">
      {{ $t('analysis.component.showSetting') }}
    </div>
    <template #dropdown>
      <div class="key-date-set-panel">
        <div class="check___pgexN">
          <el-checkbox
            v-model="settings.apply"
            :true-value="2"
            :false-value="1"
            @change="checkBoxChange">
            {{ $t('analysis.component.onlyKeyDates') }}
          </el-checkbox>
          <div v-if="settings.apply === 2">
            <el-button
              v-if="!state.isEdit"
              link
              type="primary"
              @click="setEdit">
              {{ $t('btn.edit') }}
            </el-button>
            <el-button
              v-else
              key="completeButton"
              link
              type="primary"
              :disabled="completeDisabled"
              @click="complete">
              {{ $t('btn.confirm') }}
            </el-button>
          </div>
        </div>
        <div v-if="settings.apply === 2">
          <div v-if="state.isEdit" class="keyDates___textarea">
            <el-input
              ref="inputRef"
              v-model="state.textarea"
              type="textarea"
              :rows="2"
              resize="none"
              :placeholder="
                $t('analysis.settingShowEnter', [unitCycleType[unitCycle]])
              "
              @input="inputData" />
          </div>
          <div v-else class="keyDates___1jN_a">
            <el-tag
              v-for="(item, index) in settings.days"
              :key="`setting_tag_${index}`"
              type="info"
              effect="plain"
              :closable="settings.days.length > 1"
              :disable-transitions="true"
              @close="closeTag(index)">
              {{
                item > 0
                  ? `${item}${unitCycleType[unitCycle]}`
                  : `${$t('analysis.theCurrent')}${unitCycleType[unitCycle]}`
              }}
            </el-tag>
          </div>
        </div>
      </div>
    </template>
  </el-dropdown>
</template>

<style scoped lang="scss">
.setting-show {
  height: 32px;
  // width: 80px;
  display: flex;
  align-items: center;
  border-radius: 4px;
  &.is-show-menu {
    border-color: var(--eas-color-primary);
  }
  &.not-border {
    width: auto;
  }
}
.eas-drop-box {
  &.not-border {
    padding: 4px 0 !important;
    border: none !important;
  }
}

.key-date-set-panel {
  width: 320px;
  padding: 20px;
  overflow: auto;
  .check___pgexN {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .el-checkbox {
      --el-checkbox-text-color: var(--eas-text-color-primary);
    }
  }
  .keyDates___textarea {
    height: 75px;
    :deep(.el-textarea) {
      height: 100% !important;
      .el-textarea__inner {
        height: 75px;
        padding: 10px;
        color: var(--eas-text-color-primary);
      }
    }
  }
  .keyDates___1jN_a {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    border: 1px solid var(--eas-border-color);
    height: 75px;
    padding: 7px;
    overflow-y: auto;
    .el-tag {
      background-color: var(--eas-color-primary-light-1);
      border-color: transparent;
      color: var(--eas-text-color-primary);
      :deep(.el-tag__close) {
        color: var(--eas-text-color-light);
        &:hover {
          color: #fff;
        }
      }
    }
  }
}
</style>

<style lang="scss">
.el-dropdown__popper.setting-show__dropdown {
  background: #fff;
  box-shadow: 0px 3px 6px 1px rgba(28, 32, 40, 0.18);
  border-radius: 10px 10px 10px 10px;
  margin-top: -10px;
  .el-popper__arrow {
    display: none;
  }
}
</style>
