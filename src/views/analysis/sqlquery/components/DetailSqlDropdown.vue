<script setup>
import { ref, useAttrs } from 'vue'
import copyText from '@/utils/clipboard'

const attrs = useAttrs()
const props = defineProps({
  btnName: {
    type: String,
    default: '详情',
  },
  btnFlag: {
    type: Boolean,
    default: true,
  },
  title: {
    type: String,
    default: '详情',
  },
  sql: {
    type: String,
    default: '详情',
  },
  row: {
    type: Object,
    default: () => {},
  },
  placement: {
    type: String,
    default: 'bottom',
  },
  trigger: {
    type: String,
    default: 'click',
  },
  type: {
    type: String,
    default: 'fill',
  },
})

const detailDropdownRef = ref()

const emit = defineEmits(['handleFill'])

const handleFill = async () => {
  emit('handleFill', props.row, () => {
    detailDropdownRef.value.handleClose()
  })
}

const handleCopy = (event) => {
  copyText(props.sql, event)
  detailDropdownRef.value.handleClose()
}

defineOptions({
  name: 'DetailSqlDropdown',
})
</script>
<template>
  <el-dropdown
    ref="detailDropdownRef"
    :trigger="trigger"
    :placement="placement"
    v-bind="attrs">
    <el-button class="is-text" type="primary" v-if="btnFlag">
      {{ btnName }}
    </el-button>
    <slot v-else></slot>
    <template #dropdown>
      <div class="async-query-popover">
        <div class="show-detail-title">{{ title }}</div>
        <div class="show-detail-content">
          {{ sql }}
        </div>
        <div class="mt20 text-align-right">
          <el-button
            v-if="type === 'fill'"
            type="primary"
            class="m0"
            @click="handleFill">
            {{ $t('analysis.fill') }}
          </el-button>
          <el-button v-else type="primary" class="m0" @click="handleCopy">
            {{ $t('analysis.sqlquery.copySQL') }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dropdown>
</template>
<style lang="scss" scoped>
.async-query-popover {
  width: 550px;
  max-height: 500px;
  font-size: 14px;
  padding: 0 32px 20px 32px;
  .show-detail-title {
    height: 62px;
    line-height: 62px;
    font-weight: bold;
  }
  .show-detail-content {
    width: 100%;
    max-height: 366px;
    padding: 10px 20px;
    background-color: var(--eas-hover-color);
    overflow-y: auto;
  }
}
</style>
