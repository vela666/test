<!--
 * **************************************************
 * @file 虚拟选择器
 * @author fengsi<294068744@qq.com>
 * @date 2024-02-29 18:11:10
 * @since v
 * **************************************************
-->

<script setup>
import { reactive, computed, nextTick, useAttrs } from 'vue'
import { debounce } from 'lodash-es'
import { t } from '@/locales/i18n'

defineOptions({
  name: 'VirtualizedSelector',
})

const attrs = useAttrs()
const props = defineProps({
  options: {
    type: Array,
    default() {
      return []
    },
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  withRadio: {
    type: Boolean,
    default: false,
  },
  withCheckbox: {
    type: Boolean,
    default: false,
  },
  showBorder: {
    type: Boolean,
    default: true,
  },
  persistentLabel: {
    type: String,
    default: null,
  },
})
const emits = defineEmits(['visibleChange'])
const vLabel = {
  mounted(el) {
    if (!props.persistentLabel) return

    const div = document.createElement('div')
    div.className = 'virtualized-selector-persistent-label'
    div.innerText = props.persistentLabel

    el.querySelector('.el-select__selection').append(div)
  },
}
const state = reactive({
  id: `virtualized-selector-popper-${Date.now() + `${Math.random()}`.replace('0.', '')}`,
  keyword: '',
  keyword2: '',
})
const popperClass = computed(() => {
  return `virtualized-selector-popper ${state.id} ${!props.multiple && props.withRadio ? 'with-radio' : ''} ${props.multiple && props.withCheckbox ? 'with-checkbox' : ''}`
})
const searchedOptions = computed(() => {
  const _options = props.options.filter((item) =>
    item.label.includes(state.keyword2)
  )

  if (_options.length === 0) {
    _options.push({
      label: t('common.noData'),
      value: -1,
      disabled: true,
    })
  }

  return _options
})
const handleKeywordInput = debounce((value) => {
  state.keyword2 = value
}, 400)

const handleChange = () => {
  state.keyword = ''
  handleKeywordInput(state.keyword)
}

const handleVisibleChange = (value) => {
  nextTick(() => {
    if (value && props.options.length > 0) {
      document
        .querySelector(`.${state.id}`)
        ?.querySelector('.virtualized-selector-popper-placeholder')
        ?.remove()

      const size = []
      props.options.forEach((item) => {
        size.push(item.label)
      })
      size.sort((a, b) => b?.length - a?.length)

      const div = document.createElement('div')
      div.className = 'virtualized-selector-popper-placeholder'
      div.innerText = size[0]
      document
        .querySelector(`.${state.id}`)
        ?.querySelector('.el-select-dropdown')
        ?.append(div)
    }

    emits('visibleChange', value)
  })
}
</script>

<template>
  <el-select-v2
    v-label
    :options="searchedOptions"
    :multiple="multiple"
    clearable
    collapse-tags
    :placeholder="$t('common.pleaseSelect')"
    :popper-class="popperClass"
    class="virtualized-selector"
    :class="{
      'no-border': !showBorder,
    }"
    v-bind="attrs"
    @change="handleChange"
    @visible-change="handleVisibleChange">
    <template #header>
      <slot name="header">
        <CommonInput
          v-model="state.keyword"
          :disabled="options.length === 0"
          :desc="$t('common.search')"
          size="large"
          style="width: 100%; max-width: 100%"
          @input="handleKeywordInput" />
      </slot>
    </template>
    <template #default="{ item }">
      <div
        :class="{
          'virtualized-selector-option': true,
          'with-radio': !multiple && withRadio,
          'with-checkbox': multiple && withCheckbox,
          'no-data': item.label === $t('common.noData') && item.value === -1,
        }">
        <slot name="default">
          <el-text truncated>{{ item.label }}</el-text>
        </slot>
      </div>
    </template>
    <template
      v-if="($slots.tag && $slots.tag().length > 0) || persistentLabel"
      #tag>
      <div class="virtualized-selector-tag">
        <slot name="tag"></slot>
      </div>
    </template>
  </el-select-v2>
</template>

<style scoped lang="scss">
.virtualized-selector {
  &.no-border {
    :deep(.el-select__wrapper) {
      padding: 0;
      box-shadow: none;

      &.is-disabled {
        background-color: transparent;
      }

      .el-select__suffix {
        display: none;
      }
    }
  }

  .el-select__selection {
    &.is-near > .virtualized-selector-tag {
      left: 8px;
    }

    > .virtualized-selector-tag {
      display: flex;
      align-items: center;
      position: absolute;
      top: 50%;
      right: 0;
      left: 0;
      z-index: 99;
      max-width: 100%;
      min-height: 30px;
      background-color: var(--el-color-white);
      transform: translateY(-50%);
    }
  }
}
</style>

<style lang="scss">
.virtualized-selector .el-select__selection {
  &.is-near > .virtualized-selector-persistent-label {
    left: 8px;
  }

  .virtualized-selector-persistent-label {
    display: flex;
    align-items: center;
    position: absolute;
    top: 50%;
    right: 0;
    left: 0;
    z-index: 999;
    min-height: 30px;
    white-space: nowrap;
    background-color: var(--el-color-white);
    transform: translateY(-50%);
  }
}

.virtualized-selector-popper {
  //width: 220px;

  &.with-checkbox,
  &.with-radio {
    .virtualized-selector-popper-placeholder {
      padding: 0 80px;
    }
  }

  .virtualized-selector-popper-placeholder {
    overflow: hidden;
    padding: 0 85px;
    width: auto;
    height: 0;
  }

  &.with-checkbox {
    .el-select-dropdown__item {
      &.is-selected {
        &:after {
          display: none;
        }
      }
    }
  }

  > .el-select-dropdown {
    width: 100% !important;

    .el-select-dropdown__header {
      padding: 0;

      .el-input__wrapper {
        max-width: 100%;
        box-shadow: none !important;
      }
    }
    .el-select-dropdown__list {
      width: 100% !important;

      .el-select-dropdown__item {
        display: flex;
        align-items: center;
        padding: 0;

        &.is-selected {
          > .virtualized-selector-option {
            padding-right: 40px;

            > .el-text {
              color: var(--el-color-primary);
            }

            &.with-radio:not(.no-data)::before {
              border-color: var(--el-color-primary);
              border-width: 5px;
            }
            &.with-checkbox:not(.no-data)::before {
              background-color: var(--el-color-primary);
              border-color: var(--el-color-primary);
            }
            &.with-checkbox:not(.no-data)::after {
              position: absolute;
              top: 50%;
              left: 18px;
              margin-top: -3px;
              width: 7px;
              height: 3px;
              border-left: 1px solid var(--el-color-white);
              border-bottom: 1px solid var(--el-color-white);
              content: '';
              transform: rotate(-45deg);
            }
          }
        }

        &.is-disabled > .virtualized-selector-option:not(.no-data) {
          color: var(--el-text-color-placeholder);

          > .el-text {
            color: inherit;
          }
        }

        > .virtualized-selector-option {
          position: relative;
          display: flex;
          align-items: center;
          overflow: hidden;
          white-space: nowrap;
          padding: 0 20px;
          width: 100%;
          height: 100%;
          text-overflow: ellipsis;

          &.with-radio,
          &.with-checkbox {
            padding: 0 15px;
          }

          > .el-text {
            display: block;
            line-height: 1.3;
          }

          &.no-data {
            justify-content: center;
            color: var(--el-text-color-secondary);

            > .el-text {
              color: inherit;
            }
          }

          &.with-radio:not(.no-data) {
            &::before {
              flex-shrink: 0;
              box-sizing: border-box;
              display: block;
              margin-right: 5px;
              width: 14px;
              height: 14px;
              background-color: var(--el-color-white);
              border-radius: 50%;
              border: 1px solid var(--el-border-color);
              content: '';
            }
          }

          &.with-checkbox:not(.no-data) {
            &::before {
              flex-shrink: 0;
              box-sizing: border-box;
              display: block;
              margin-right: 5px;
              width: 14px;
              height: 14px;
              background-color: var(--el-color-white);
              border-radius: 2px;
              border: 1px solid var(--el-border-color);
              content: '';
            }
          }
        }
      }
    }
  }
}
</style>
