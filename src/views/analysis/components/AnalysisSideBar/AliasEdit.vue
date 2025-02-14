<template>
  <div v-if="title" class="ml20 analysis-alias__title">{{ title }}</div>
  <draggable
    v-model="list"
    force-fallback="true"
    :group="{ name: 'rules', pull: false, put: false }"
    :animation="500"
    handle=".tag-drag"
    fallback-tolerance="10"
    item-key="id"
    :component-data="{
      name: 'fade',
      type: 'transtion-group',
    }">
    <template #item="{ element, index }">
      <div
        class="analysis-alias eas-block-container analysis-hover__bg"
        :class="{ 'disabled-dragable': !dragable }">
        <div class="analysis-alias__index" v-if="dragable || hasIndex">
          <div class="tag-num mr20">{{ index + 1 }}</div>
          <div class="tag-drag mr20">
            <svg-icon name="drag-icon"></svg-icon>
          </div>
        </div>
        <div style="flex: 1">
          <div class="analysis-alias__input" v-if="editable">
            <el-row align="middle">
              <span v-if="!element.aliasEdited" class="mr5">
                {{ element.alias }}
              </span>
              <ActionBtn
                :content="$t('analysis.editIndicatorName')"
                v-if="!element.aliasEdited"
                @click="handleAliasEdited(index)"
                icon="edit1"
                type="icon"
                class="alias-edit__icon" />
              <el-input
                v-if="element.aliasEdited"
                v-model="element.aliasRename"
                v-bind="attrs"
                :maxlength="25"
                style="width: 300px"
                :placeholder="placeholder"
                class="alias-input"
                :ref="(ref) => (aliasRef[index] = ref)"
                @blur="inputBlur(index)" />
            </el-row>
            <div class="analysis-alias__action flex-center">
              <slot name="action-r" :i="index" />
            </div>
          </div>
          <slot :i="index" :item="element" />
        </div>
      </div>
    </template>
  </draggable>
</template>

<script setup>
import { computed, nextTick, ref, watch, useAttrs } from 'vue'
import ActionBtn from './ActionBtn.vue'
import draggable from 'vuedraggable'
import { t } from '@/locales/i18n'

const attrs = useAttrs()
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: [String, Number],
    default: t('analysis.indicatorsPlaceholder'),
  },
  title: {
    type: String,
    default: '',
  },
  // 是否展示下标
  hasIndex: {
    type: Boolean,
    default: false,
  },
  // 是否支持重命名
  editable: {
    type: Boolean,
    default: true,
  },
  // 是否支持拖拽，改变hover样式
  dragable: {
    type: Boolean,
    default: false,
  },
  alias: {
    type: [String, Number],
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const list = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const aliasRef = ref([])

const handleAliasEdited = (i) => {
  list.value[i].aliasEdited = true

  nextTick(() => {
    aliasRef.value[i]?.focus()
  })
}

const inputBlur = (i) => {
  const value = list.value[i].aliasRename
    ? list.value[i].aliasRename.trim()
    : ''

  list.value[i].aliasRename = value
}
</script>

<style lang="scss" scoped>
.analysis-alias {
  padding: 10px;
  display: flex;
  margin: 0 10px;
  &__title {
    font-weight: bold;
  }
  &__index {
    width: 40px;
  }
  &__action {
    visibility: hidden;
  }
  :deep(.alias-edit__icon) {
    visibility: hidden;
  }

  &:hover {
    .analysis-alias__action {
      visibility: visible;
    }
    &:not(.disabled-dragable) .tag-drag {
      display: block;
    }
    &:not(.disabled-dragable) .tag-num {
      display: none;
    }
    :deep(.alias-edit__icon) {
      visibility: visible;
    }
  }
  &__input {
    margin-bottom: 5px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .tag-num,
  .tag-drag {
    width: 20px;
    height: 20px;
    background: var(--eas-color-primary);
    color: #fff;
    font-size: var(--eas-font-size-small);
    font-weight: 400;
    border-radius: var(--eas-border-radius);
    transition: all 0.3s;
    line-height: 20px;
    text-align: center;
    position: relative;
    top: 4px;
  }
  .tag-drag {
    display: none;
    &:hover {
      cursor: grab;
    }
  }
}
</style>
