<script setup>
import { ref, useAttrs } from 'vue'

const attrs = useAttrs()
const props = defineProps({
  className: {
    type: String,
    default: '',
  },
  width: {
    type: String,
    default: '550px',
  },
  placement: {
    type: String,
    default: 'bottom-start',
  },
  trigger: {
    type: String,
    default: 'contextmenu',
  },
})

const dropdown = ref(null)
const handleOpen = () => {
  dropdown.value.handleOpen()
}

const handleClose = () => {
  dropdown.value.handleClose()
}

defineExpose({
  handleOpen,
  handleClose,
})

defineOptions({
  name: 'CommonDropdown',
})
</script>
<template>
  <el-dropdown
    :trigger="trigger"
    :popper-class="['eas-prop-popper', className].join(' ')"
    :placement="placement"
    ref="dropdown"
    v-bind="attrs">
    <slot name="content"></slot>
    <template #dropdown>
      <div :style="{ width: width }">
        <div v-if="$slots.title" class="container-title fz16 txt-bold">
          <slot name="title"></slot>
        </div>
        <div v-if="$slots.container" class="container-content">
          <slot name="container"></slot>
        </div>
        <slot></slot>
        <div v-if="$slots.buttom" class="container-buttom">
          <slot name="buttom"></slot>
        </div>
      </div>
    </template>
  </el-dropdown>
</template>
<style lang="scss" scoped>
.container-title {
  padding: 20px 32px;
}
.container-content {
  padding: 10px 32px;
}
.container-buttom {
  padding: 0 32px 20px;
  text-align: right;
}
</style>
