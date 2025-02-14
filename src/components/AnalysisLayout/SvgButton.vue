<script setup>
import { ref, reactive, onMounted, useAttrs } from 'vue'
defineOptions({
  name: 'SvgButton',
})

const attrs = useAttrs()
const props = defineProps({
  icon: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <el-button :disabled="disabled" v-bind="attrs">
    <svg-icon
      v-if="icon"
      :name="icon"
      :class="['fz18', 'mr3', disabled ? 'ccbd0d6' : 'c545e6e']"></svg-icon>
    <slot></slot>
  </el-button>
</template>

<style scoped lang="scss"></style>
