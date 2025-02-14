<script setup>
import { ref, computed } from 'vue'
import { t } from '@/locales/i18n'

defineOptions({
  name: 'SortDrop',
})
const emit = defineEmits(['update:modelValue', 'change'])
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  placement: {
    type: String,
    default: 'bottom-end',
  },
  typeList: {
    type: Array,
    default: () => [
      {
        icon: 'sort-ascend',
        label: t('analysis.dataVolumeSmallLarge'),
        value: 'ascend',
      },
      {
        icon: 'sort-descend',
        label: t('analysis.dataVolumeLargeSmall'),
        value: 'descend',
      },
      {
        icon: 'az-sort-ascend',
        label: `${t('analysis.groupItems')}(A→Z)`,
        value: 'azAscend',
      },
      {
        icon: 'az-sort-descend',
        label: `${t('analysis.groupItems')}(Z→A)`,
        value: 'azDescend',
      },
    ],
  },
  showBorder: {
    type: Boolean,
    default: true,
  },
  showText: {
    type: Boolean,
    default: false,
  },
})
const sortDrop = ref(null)
const showMenu = ref(false)

const sortValue = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
  },
})

const typeItem = computed(() => {
  const find = props.typeList.find((el) => el.value === sortValue.value)
  return find ?? {}
})

const visibleChange = (val) => (showMenu.value = val)

const selectItem = (item) => {
  if (sortValue.value !== item.value && item?.disabled !== true) {
    sortValue.value = item.value
    emit('change', item.value)
  }
  sortDrop.value?.handleClose()
}
</script>

<template>
  <el-dropdown
    @visible-change="visibleChange"
    popper-class="sort-drop__dropdown"
    trigger="click"
    :placement="placement"
    ref="sortDrop">
    <div
      :class="[
        'sort-drop-panel',
        { 'is-unfold': showMenu },
        { 'no-border': !showBorder },
        { 'is-dashboard': !showBorder },
      ]">
      <svg-icon :name="typeItem?.icon ?? ''" class="show-icon"></svg-icon>
      <div v-if="showText" class="text-label">
        {{ typeItem?.label || typeItem?.title }}
      </div>
    </div>
    <template #dropdown>
      <div class="drop_sort_list">
        <div
          :class="[
            'drop_sort_list__item',
            { 'is-cur': sortValue === item.value },
            { 'is-disabled': item.disabled === true },
          ]"
          v-for="item in typeList"
          :key="`list__item_${item.value}`"
          @click="selectItem(item)">
          <svg-icon :name="item.icon" class="drop-sort__icon"></svg-icon>
          <div class="drop-sort__text">{{ item?.label || item?.title }}</div>
        </div>
      </div>
    </template>
  </el-dropdown>
</template>

<style scoped lang="scss">
.sort-drop-panel {
  min-width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--eas-text-color-light);
  border-radius: var(--eas-border-radius-4);
  border: 1px solid var(--eas-text-color-light-1);
  &.is-unfold {
    color: var(--eas-color-primary);
    border-color: var(--eas-color-primary);
    .text-label {
      color: var(--eas-color-primary);
    }
  }
  &.no-border {
    border: none;
  }
  .show-icon {
    font-size: var(--eas-font-size-large);
  }
  .text-label {
    margin-left: 3px;
    color: var(--eas-text-color-primary);
  }
}
.is-dashboard {
  padding: 0px 5px;
}
.drop_sort_list {
  height: 100%;
  width: 100%;
  padding: 4px;
  &__item {
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
    padding: 0 6px;
    cursor: pointer;
    &:hover {
      background-color: var(--eas-hover-color);
    }
    &.is-cur {
      .drop-sort__icon,
      .drop-sort__text {
        color: var(--eas-color-primary);
      }
    }
    &.is-disabled {
      cursor: not-allowed;
      .drop-sort__text,
      .drop-sort__icon {
        color: var(--eas-text-color-light-1) !important;
      }
    }
  }
}
.drop-sort__icon {
  margin-right: 3px;
  font-size: var(--eas-font-size-large);
  color: var(--eas-text-color-light);
}
.drop-sort__text {
  font-size: var(--eas-font-size-base);
  color: var(--eas-text-color-primary);
}
</style>
<style lang="scss">
.el-dropdown__popper.sort-drop__dropdown {
  min-width: 80px;
  max-height: 350px;
  background: #fff;
  box-shadow: 0px 3px 10px 1px rgba(28, 32, 40, 0.18);
  border-radius: var(--eas-border-radius-4);
  margin-top: -11px;
  .el-popper__arrow {
    display: none;
  }
  .el-dropdown__list {
    height: 100%;
    width: 100%;
  }
}
</style>
