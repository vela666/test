<template>
  <draggable
    v-model="value"
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
        class="analysis-group flex-center eas-block-container analysis-hover__bg"
        :class="[!dragable && 'not-dragbale', className]">
        <slot v-if="$slots.default"></slot>
        <template v-else>
          <div class="tag-num mr10">{{ index + 1 }}</div>
          <div class="tag-drag mr10">
            <svg-icon name="drag-icon"></svg-icon>
          </div>
        </template>
        <PropSelect
          :list="data"
          v-model="value[index]"
          :groups="disabledGroups"
          :isGroup="true"
          :filterable="filterable"
          :limit="limit" />
        <GroupTimeSummary
          v-if="['timestamp', 'datetime'].includes(element.fType)"
          v-model="element.timeType" />
        <GroupRange
          v-if="['int', 'double'].includes(element.fType)"
          v-model="element.range"
          :group="value[index]" />
        <div class="delete-icon">
          <ActionBtn
            type="icon"
            :content="$t('analysis.deleteGroup')"
            @click="emit('remove', index)"
            icon="delete2" />
        </div>
      </div>
    </template>
  </draggable>
</template>

<script setup>
import { computed } from 'vue'
import ActionBtn from './ActionBtn.vue'
import draggable from 'vuedraggable'
import { tableKeysArr } from '@/enumeration'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  data: {
    type: Object,
    default: () => {},
  },
  index: {
    type: [String, Number],
    default: 0,
  },
  disabledGroups: {
    type: Object,
    default: () => {},
  },
  item: {
    type: Object,
    default: () => {},
  },
  limit: {
    //控制展示哪些属性分类（事件属性、用户属性、用户分群、用户标签）
    type: Array,
    default: () => tableKeysArr,
  },
  dragable: {
    type: Boolean,
    default: true,
  },
  // 分组项是否过滤掉['__fid', '__bid', '__did']
  filterable: {
    type: Boolean,
    default: true,
  },
  // 额外类名
  className: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'remove'])

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})
</script>

<style lang="scss" scoped>
.analysis-group {
  height: 48px;
  padding-left: 10px;
  margin: 0 10px;
  &:not(.not-dragbale):hover {
    .tag-num {
      display: none;
    }
    .tag-drag {
      display: inherit;
      cursor: grab;
    }
  }
  &:hover {
    .delete-icon {
      display: inherit;
    }
  }
  .delete-icon {
    display: none;
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
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .tag-drag {
    display: none;
  }
}
</style>
