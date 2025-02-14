<script setup>
import { computed, reactive, ref } from 'vue'
import { isEmpty } from 'lodash-es'
import { ElMessage } from 'element-plus'
import { t } from '@/locales/i18n'
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  options: {
    type: Array,
    default: () => [],
  },
})

const state = reactive({
  labelText: '',
})

const emit = defineEmits(['update:modelValue', 'visible-change'])

const list = computed({
  get: () => {
    return props.modelValue
  },
  set: (val) => {
    emit('update:modelValue', val)
  },
})

const addLabel = () => {
  if (isEmpty(state.labelText.trim()) || list.value.includes(state.labelText)) {
    state.labelText = ''
    return
  }
  if (state.labelText.length > 20) {
    ElMessage.warning(t('analysis.report.reportTagLength'))
    return
  }
  if (list.value.length >= 10) {
    ElMessage.warning(t('analysis.report.reportTagsAddMsg'))
    return
  }
  list.value.push(state.labelText)
  state.labelText = ''
}

const handleClose = (tag) => {
  list.value.splice(list.value.indexOf(tag), 1)
}

const visibleChange = () => {
  emit('visible-change')
}

defineOptions({
  name: 'ReportTag',
})
</script>
<template>
  <div>
    <el-select
      v-model="state.labelText"
      filterable
      allow-create
      :placeholder="$t('analysis.report.enterOrSelectTag')"
      clearable
      @change="addLabel"
      @visible-change="visibleChange">
      <el-option
        v-for="item in options"
        :key="`option_${item}`"
        :label="item"
        :value="item" />
    </el-select>
    <div class="label-list">
      <el-tag
        size="large"
        v-for="(tag, index) in list"
        :key="`tag_${index}`"
        closable
        :disable-transitions="false"
        @close="handleClose(tag)">
        {{ tag }}
      </el-tag>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.label-list {
  margin-top: 10px;
  width: 100%;
}
.el-tag {
  --el-tag-bg-color: var(--eas-color-primary-light-1);
  --el-tag-text-color: var(--eas-text-color-primary);
  border: none;
  font-size: var(--eas-font-size-base);
  margin: 5px 9px 0 0;
}
</style>
