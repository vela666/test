<script setup>
import { computed, useAttrs } from 'vue'
defineOptions({
  name: 'AliasAndDecimal',
})

const attrs = useAttrs()

const props = defineProps({
  round: {
    type: [Number, String],
    default: 0,
  },
  alias: {
    type: String,
    default: '',
  },
  inputWidth: {
    type: Number,
    default: 170,
  },
})

const roundVal = computed({
  get() {
    return props.round
  },
  set(value) {
    emit('update:round', value)
  },
})

const aliasVal = computed({
  get() {
    return props.alias
  },
  set(value) {
    emit('update:alias', value)
  },
})

const emit = defineEmits(['update:round', 'update:alias'])
</script>

<template>
  <div class="alias-decimal flex-center">
    <el-input
      v-model="aliasVal"
      :placeholder="$t('analysis.enterIndicatorName')"
      :maxlength="25"
      class="alias-input"
      :style="`width: ${inputWidth}px`" />
    <decimal-select v-model="roundVal" v-bind="attrs"></decimal-select>
  </div>
</template>

<style scoped lang="scss"></style>
