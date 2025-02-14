<script setup>
import { ref, useAttrs } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
defineOptions({
  name: 'DropDownSelector',
})

const emit = defineEmits(['change'])

const attrs = useAttrs()
const props = defineProps({
  placement: {
    type: String,
    default: 'bottom-end',
    validator(value) {
      return ['bottom', 'bottom-start', 'bottom-end'].includes(value)
    },
  },
  showBorder: {
    type: Boolean,
    default: true,
  },
})

const showMenu = ref(false)
const visibleChange = (val) => {
  showMenu.value = val
  emit('change', val)
}
</script>

<template>
  <el-dropdown
    :placement="placement"
    popper-class="custom-drop-down-selector"
    trigger="click"
    @visible-change="visibleChange"
    v-bind="attrs">
    <div
      :class="[
        'group-drop-box',
        { 'is-unfold': showMenu },
        { 'no-border': !showBorder },
      ]">
      <div class="group-drop-box__text">
        <slot></slot>
      </div>
      <el-icon
        v-if="showBorder"
        :class="['arrow-icon', { 'is-rotate': showMenu }]">
        <ArrowDown />
      </el-icon>
    </div>
    <template #dropdown>
      <div class="custom-drop-down-selector__list">
        <slot name="content"></slot>
      </div>
    </template>
  </el-dropdown>
</template>

<style scoped lang="scss">
.group-drop-box {
  &.no-border {
    border: none;
    min-width: 32px;
    padding: 0;
    margin: 0;
    align-items: center;
    justify-content: center;
    &.is-unfold {
      color: var(--eas-color-primary) !important;
    }
  }
}
.custom-drop-down-selector__list {
  background: #fff;
  box-shadow: 3px 3px 10px 1px rgba(28, 32, 40, 0.18);
  border-radius: var(--eas-border-radius-4);
  :deep() {
    .el-input__wrapper {
      height: 42px;
      box-shadow: none;
      border-bottom: 1px solid var(--eas-border-color);
    }
    .el-checkbox__label {
      padding-left: 5px;
      font-size: var(--eas-font-size-base);
    }
    .el-checkbox {
      --el-checkbox-text-color: var(--eas-text-color-primary);
    }
  }
}
</style>
<style lang="scss">
.el-dropdown__popper.custom-drop-down-selector {
  margin-top: -9px;
  border: none;
  background: #fff;
  box-shadow: 3px 3px 10px 1px rgba(28, 32, 40, 0.18);
  border-radius: var(--eas-border-radius-4);
  .el-popper__arrow {
    display: none;
  }
  .el-dropdown__list {
    height: 100%;
    width: 100%;
  }
}
</style>
