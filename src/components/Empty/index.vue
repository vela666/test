<script setup>
import empty from '@/assets/images/empty.png'

defineOptions({
  name: 'Empty',
})
const props = defineProps({
  desc: {
    type: String,
    default: '',
  },
  img: {
    type: String,
    default: '',
  },
  showImg: {
    type: Boolean,
    default: true,
  },
  imgH: {
    type: String,
    default: '',
  },
  imgW: {
    type: String,
    default: '55px',
  },
})
</script>

<template>
  <div class="empty-box">
    <img
      v-if="showImg"
      :style="`width: ${imgW};height:${imgH}`"
      :src="img || empty"
      class="empty-box-img" />
    <div class="empty-box-desc overflow-auto max-h-300">
      {{ desc || $t('common.noData') }}
    </div>
    <slot></slot>
  </div>
</template>

<style scoped lang="scss">
.empty-box {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  text-align: center;
  /* &-icon {
    width: 55px;
    height: 40px;
  }*/
  &-desc {
    margin-top: 10px;
    color: var(--eas-text-color-primary);
    font-size: var(--eas-font-size-base);
  }
}
</style>
