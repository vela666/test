<script setup>
import { ref, reactive, watch, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})

const config = {
  list: ['UTF-8', 'GBK'],
}

const state = reactive(config)

const encodeRef = ref(null)

const handleClick = (type) => {
  encode.value = type
  encodeRef.value.handleClose()
}

const emit = defineEmits(['update:modelValue'])

const encode = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
  },
})

defineOptions({
  name: 'CodeTypePropSelect',
})
</script>
<template>
  <el-dropdown ref="encodeRef" popper-class="code_type__dropdown">
    <el-button text class="p0 m0 nd-operate-btn-active fz28 svg86919d">
      <Tooltip>
        <div class="fz14 padding-lr-5 c86919d">{{ encode }}</div>
        <template #content>
          {{ $t('analysis.sqlquery.encodeTips') }}
        </template>
      </Tooltip>
    </el-button>
    <template #dropdown>
      <div class="report_user_list">
        <div
          class="report_user_list__item"
          :class="{ active: encode === i }"
          v-for="i in state.list"
          :key="`list__item_${i}`"
          @click="handleClick(i)">
          {{ i }}
        </div>
      </div>
    </template>
  </el-dropdown>
</template>
<style lang="scss" scoped>
.nd-operate-btn-active {
  &:not([class*='disabled']) {
    &:hover {
      &:after {
        content: '';
        position: absolute;
        width: 2em;
      }
    }
  }
}
.report_user_list {
  padding: 0 4px;
  &__item {
    width: 52px;
    height: 40px;
    padding: 10px 6px 10px;
    text-align: center;
    font-size: var(--eas-font-size-base);
    color: var(--eas-text-color-primary);
    cursor: pointer;
    &.auth-label {
      color: var(--eas-text-color-light);
    }
    &:not(.auth-label):hover {
      background-color: var(--eas-hover-color);
    }
  }
  .active {
    color: var(--el-menu-active-color);
  }
}
.padding-lr-5 {
  padding: 0 5px;
}
</style>
<style lang="scss">
.el-dropdown__popper.code_type__dropdown {
  .el-popper__arrow {
    display: none;
  }
}
</style>
