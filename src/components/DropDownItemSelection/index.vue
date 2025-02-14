<template>
  <el-dropdown
    v-if="showDropdown"
    :popper-class="popperClass"
    v-bind="attrs"
    :trigger="trigger"
    :popper-options="popperConfig">
    <slot></slot>
    <template #dropdown>
      <el-dropdown-menu>
        <!--<el-dropdown-item>
         1
         </el-dropdown-item>-->
        <slot name="content"></slot>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
  <slot v-else></slot>
</template>

<script setup>
import { computed, useAttrs } from 'vue'
import { ElDropdown, ElDropdownMenu } from 'element-plus'
const attrs = useAttrs()
const props = defineProps({
  showDropdown: {
    type: Boolean,
    default: true,
  },
  defaultCursor: {
    type: Boolean,
    default: false,
  },
  showArrow: {
    type: Boolean,
    default: false,
  },
  config: {
    type: Object,
    default() {
      return {}
    },
  },
  className: {
    type: String,
    default: '',
  },
  trigger: {
    type: String,
    default: 'click',
  },
  offset: {
    type: [String, Number],
    default: 4,
  },
})

const popperClass = computed(() => {
  return [
    'nd-drop-down-item-selection',
    !props.showArrow && 'nd-drop-down-item-hide-arrow',
    props.className,
    props.defaultCursor && 'nd-drop-item-cursor-default',
  ].join(' ')
})

const popperConfig = computed(() => {
  return {
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, +props.offset],
        },
      },
    ],
    ...props.config,
  }
})

defineOptions({
  name: 'DropDownItemSelection',
})
</script>
<style lang="scss">
.el-dropdown__popper.nd-drop-down-item-selection {
  min-width: 108px;
  border-radius: var(--eas-border-radius-4);

  .el-dropdown-menu {
    padding: 0;
  }

  .el-dropdown__list {
    padding: 4px;
  }

  .el-button {
    justify-content: flex-start;
  }

  .el-dropdown-menu__item {
    align-items: flex-start;
    flex-direction: column;
    justify-content: center;
    box-sizing: content-box;
    padding: 10px 6px;

    //height: 40px;
    line-height: inherit;
    border-radius: var(--eas-border-radius);

    color: var(--eas-text-color-primary);

    &[class*='disabled'] {
      cursor: not-allowed;
      color: var(--eas-text-color-light-1);
    }

    &:hover {
      &:not([class*='disabled']):not(.no-bg) {
        background-color: var(--eas-hover-color);
      }
    }

    &:focus {
      background-color: transparent;
    }
  }

  .el-dropdown-menu__item--divided {
    margin: 5px 0;
  }
  &.nd-drop-item-cursor-default {
    .el-dropdown-menu__item {
      cursor: default;
    }
  }
  &.nd-drop-down-item-hide-arrow {
    .el-popper__arrow {
      display: none;
    }
  }
}
</style>
