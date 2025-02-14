<script setup>
import { computed } from 'vue'
import draggable from 'vuedraggable'
import { tableKeysArr } from '@/enumeration'
defineOptions({
  name: 'AnalysisGroups',
})
/*注意modelValue 的每一项需要id*/
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  data: {
    type: Object,
    default: () => ({}),
  },
  disabledGroups: {
    type: Array,
    default: () => [],
  },
  isGroup: {
    type: Boolean,
    default: true,
  },
  limit: {
    //控制展示哪些属性分类（事件属性、用户属性、用户分群、用户标签）
    type: Array,
    default: () => tableKeysArr,
  },
  title: {
    type: String,
    default: 'analysis.groupItems',
  },
  icon: {
    type: String,
    default: 'analysis-group',
  },
  // 分组项是否过滤掉属性中的 '__fid', '__bid', '__did'
  filterable: {
    type: Boolean,
    default: true,
  },
  isAnalyze: {
    type: Boolean,
    default: true,
  },
  appId: {
    type: [String, Number],
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'remove'])
const groups = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val)
  },
})

const removeGroupItem = (index) => {
  emit('remove', index)
}
</script>

<template>
  <div :class="['analysis-group', !isAnalyze && 'nd-kanban-group']">
    <div class="section-label" v-if="title">
      <svg-icon :name="icon" class="mr5"></svg-icon>{{ $t(title) }}
    </div>
    <!--分组项中的事件拆分插槽-->
    <slot name="split"></slot>
    <div class="analysis-group-container">
      <draggable
        v-model="groups"
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
          <div class="group-by-item eas-block-container">
            <div class="tag-num mr10">{{ index + 1 }}</div>
            <div class="tag-drag mr10">
              <svg-icon name="drag-icon"></svg-icon>
            </div>
            <PropSelect
              :appId="appId"
              :list="data"
              v-model="groups[index]"
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
              :group="groups[index]" />
            <el-tooltip
              :content="$t('analysis.deleteGroup')"
              placement="top"
              :hide-after="0">
              <div class="remove-group-btn" @click="removeGroupItem(index)">
                <svg-icon name="delete2"></svg-icon>
              </div>
            </el-tooltip>
          </div>
        </template>
      </draggable>
    </div>
    <!--按钮插槽-->
    <div class="analysis-btn__add">
      <slot name="btn"></slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
.flex-center {
  display: flex;
  align-items: center;
}
.flex-center-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
.remove-group-btn {
  width: 28px;
  height: 28px;
  @extend .flex-center-center;
  cursor: pointer;
  font-size: var(--eas-font-size-medium);
  color: var(--eas-text-color-light);
  &:hover {
    color: var(--eas-color-primary);
    background-color: var(--eas-border-color);
    border-radius: var(--eas-border-radius);
  }
  display: none;
}
.group-by-item {
  @extend .flex-center;
  height: 48px;
  padding-left: 10px;
  &:hover {
    background-color: var(--eas-hover-color);
    .tag-num {
      display: none;
    }
    .tag-drag {
      display: inherit;
      cursor: grab;
    }
    .remove-group-btn {
      display: inherit;
    }
  }
}
.section-label {
  width: 100%;
  height: 64px;
  line-height: 64px;
  padding-left: 20px;
  font-size: var(--eas-font-size-medium);
  color: var(--eas-text-color-primary);
  font-weight: bold;
}
.nd-kanban-group {
  .analysis-group-container {
    margin: 0;
  }
  .analysis-btn__add {
    margin: 0;
  }
}
</style>
