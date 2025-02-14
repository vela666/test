<template>
  <el-popover
    v-if="showPopover"
    v-bind="attrs"
    @show="emit('show', $event)"
    @hide="emit('hide', $event)"
    :show-arrow="showArrow"
    :persistent="persistent"
    :popper-class="['nd-drop-down-popover-selection', key, className].join(' ')"
    :trigger="trigger"
    :hideAfter="+hideAfter"
    :offset="+offset">
    <template #reference>
      <slot></slot>
    </template>
    <div class="more-choices" v-if="!$slots.custom">
      <slot name="content"></slot>
    </div>
    <slot name="custom"></slot>
  </el-popover>
  <slot v-else></slot>
</template>

<script setup>
import { ref, onMounted, useAttrs } from 'vue'
import { ElPopover } from 'element-plus'
import { v4 as uuidv4 } from 'uuid'

const attrs = useAttrs()
const emit = defineEmits(['show', 'hide'])
const props = defineProps({
  hideAfter: {
    type: [String, Number],
    default: 200,
  },
  className: {
    type: String,
    default: '',
  },
  showPopover: {
    type: Boolean,
    default: true,
  },
  showArrow: {
    type: Boolean,
    default: false,
  },
  // 当 popover 组件长时间不触发且 persistent 属性设置为 false 时, popover 将会被删除
  persistent: {
    type: Boolean,
    default: false,
  },
  offset: {
    type: [String, Number],
    default: 4,
  },
  trigger: {
    type: String,
    default: 'hover',
  },
  maxH: {
    type: String,
    // default: '240px',
    default: '',
  },
})

const key = ref(`nd-${uuidv4()}`)

onMounted(() => {
  const el = document.querySelector(`.${key.value}`)
  if (!el) return
  el.style.maxHeight = props.maxH
})
/*
watch(
  () => props.maxH,
  (val) => {
    key.value = `nd-${uuidv4()}`
    nextTick(() => {
      const el = document.querySelector(`.${key.value}`)
      if (!el) return
      el.style.maxHeight = val
    })
  },
  { immediate: true }
)*/

defineOptions({
  name: 'DropDownPopoverSelection',
})
</script>
<style lang="scss">
.el-popper.nd-drop-down-popover-selection {
  //max-width: 115px;
  width: auto !important;
  min-width: 120px;
  //max-height: 240px;
  overflow-y: auto;
  padding: 0;
  border-radius: var(--eas-border-radius-4);
  max-height: 300px;

  .el-button {
    justify-content: flex-start;
  }

  .more-choices {
    display: flex;
    flex-direction: column;
    justify-content: center;
    box-sizing: content-box;
    padding: 4px;

    > * {
      //height: 40px;
      //line-height: 40px;
      height: auto;
      line-height: normal;
      padding: 10.5px 6px;
      border-radius: 2px;

      &:not(.el-button) {
        cursor: pointer;

        &[class*='disabled'] {
          cursor: not-allowed;
          color: var(--eas-text-color-light-1);
        }
      }

      &:hover {
        &:not([class*='disabled']) {
          background-color: var(--eas-hover-color);
        }
      }
    }

    > .el-button {
      margin: 0;
    }
  }
}
</style>
