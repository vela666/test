<script setup>
defineOptions({
  name: 'CancelModal',
})
const emit = defineEmits(['cancelCalculate'])
const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  requestId: {
    type: String,
    default: null,
  },
})

const cancelCalculateHandle = () => emit('cancelCalculate')
</script>

<template>
  <div class="position-relative w100-percentage h100-percentage">
    <div class="w100-percentage h100-percentage" v-loading="loading">
      <div class="w100-percentage h100-percentage" v-show="!loading">
        <slot></slot>
      </div>
    </div>
    <el-button
      v-if="loading && requestId"
      round
      class="m0 skip cancel-btn"
      @click="cancelCalculateHandle">
      {{ $t('analysis.cancelCalculation') }}
    </el-button>
  </div>
</template>

<style scoped lang="scss"></style>
