<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数

defineOptions({
  name: 'FilterDropdown',
})
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  name: {
    type: [String, Number],
    default: '',
  },
  list: {
    type: Array,
    require: true,
  },
})
const emit = defineEmits(['change', 'update:modelValue'])
const dropName = ref('')
const typeList = computed(() => {
  return [{ type: '', label: t('common.all') }, ...props.list]
})
const commandHandler = (type) => {
  if (dropName.value === type) return
  dropName.value = type
  emit('update:modelValue', type)
  emit('change', type)
}
const clearFilter = () => {
  dropName.value = ''
  emit('update:modelValue', '')
  emit('change', '')
}
defineExpose({
  clearFilter,
})
</script>

<template>
  <div class="filter-dropdown">
    <span class="mr5">{{ name }}</span>
    <el-dropdown
      trigger="click"
      placement="bottom-end"
      @command="commandHandler"
      popper-class="eas-filter-button">
      <div>
        <svg-icon
          name="filter"
          :class="['drop-btn', { 'is-active': dropName + '' !== '' }]" />
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <template v-for="dropItem of typeList" :key="dropItem.type">
            <el-dropdown-item
              v-if="!dropItem.notShow"
              :class="{ 'filter-active': dropName === dropItem.type }"
              :command="dropItem.type">
              {{ dropItem.label }}
            </el-dropdown-item>
          </template>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<style scoped lang="scss">
.filter-dropdown {
  display: flex;
  align-items: center;
}
.drop-btn {
  width: 24px;
  height: 24px;
  border-radius: var(--eas-border-radius);
  color: var(--eas-text-color-light);
  cursor: pointer;
  &:hover {
    background-color: var(--eas-border-color);
  }
  &.is-active {
    color: var(--eas-color-primary);
    background-color: var(--eas-color-primary-light);
  }
}
</style>
<style lang="scss">
.filter-active {
  &.el-dropdown-menu__item {
    color: var(--eas-color-primary);
    //background-color: var(--eas-color-primary-light-1);
  }
}
</style>
