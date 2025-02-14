<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
  data: {
    type: Array,
    default() {
      return []
    },
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const dialogVisible = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
  },
})

defineOptions({
  name: 'OperateLog',
})
</script>
<template>
  <CommonDrawer
    v-model="dialogVisible"
    :title="t('common.operationLog')"
    size="600px"
    :loading="loading"
    :needFooter="false">
    <div class="operate flex" v-if="data.length">
      <div class="operate-split"></div>
      <div class="operate-log">
        <div
          class="operate-log-item"
          v-for="(item, index) of data"
          :key="index">
          <div class="operate-log-item-title flex mb10">
            <div class="mr10">{{ item.creator }}</div>
            <div>{{ item.createTime }}</div>
          </div>
          <div>{{ item.operationContent }}</div>
        </div>
      </div>
    </div>
    <Empty v-else class="h100-percentage" />
  </CommonDrawer>
</template>
<style lang="scss" scoped>
.operate {
  &-split {
    width: 1px;
    height: auto;
    margin-right: 15px;
    border-left: 1px dashed var(--eas-split-line-color);
  }
  &-log {
    &-item {
      margin-bottom: 30px;
      &-title {
        color: var(--eas-text-color-light);
        position: relative;
        &::after {
          content: '';
          position: absolute;
          width: 10px;
          height: 10px;
          background: var(--eas-color-primary);
          border-radius: 5px;
          top: 5px;
          left: -20px;
        }
      }
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style>
