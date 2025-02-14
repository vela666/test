<script setup>
import { ref, reactive } from 'vue'
import copyText from '@/utils/clipboard'

defineOptions({
  name: 'TableStructureField',
})

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  fieldList: {
    type: Array,
    default: () => [],
  },
})

const config = {
  batchFieldList: [],
}

const state = reactive(config)

/**
 * @description 复制字段名
 */
const handleClipField = (data, event) => {
  copyText(data, event)
}

/**
 *  @description 批量选择获取字段名集合
 */
const handleFieldSelectionChange = (val) => {
  state.batchFieldList = val.map((item) => item.name)
}

/**
 * @description 批量复制字段名
 */
const handleBatchClipField = (event) => {
  if (!state.batchFieldList.join('')) {
    return
  }
  copyText(state.batchFieldList.join(','), event)
}

const emit = defineEmits(['back'])

/**
 * @description 返回事件
 */
const handleBackEvent = () => {
  emit('back')
}
</script>
<template>
  <div class="t-r-field">
    <div class="table-name flex-center flex-between">
      <span class="flex gap14">
        <!-- 返回事件列表 -->
        <Tooltip v-if="title">
          <el-button
            class="p0 m0 nd-operate-btn-active fz28"
            text
            @click.stop="handleBackEvent">
            <SvgIcon class="fz16 rotate-icon" name="view-field" />
          </el-button>
          <template #content>
            {{ $t('analysis.sqlquery.viewProperties') }}
          </template>
        </Tooltip>
        <span class="t-r-name table-name-text">
          {{ title || $t('analysis.sqlquery.fieldList') }}
        </span>
      </span>
      <span
        class="t-r-name table-name-text c5473e8 c-pointer"
        :class="{ disabledBtn: !state.batchFieldList.join('') }"
        @click="handleBatchClipField($event)">
        {{ $t('analysis.sqlquery.batchCopy') }}
      </span>
    </div>
    <div class="ml10 mr10 t-r-field-table">
      <el-table
        :data="fieldList"
        class="nd-table-custom"
        show-overflow-tooltip
        border
        ref="fieldTableRef"
        style="width: 100%"
        height="490px"
        @selection-change="handleFieldSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column
          prop="name"
          :label="$t('analysis.sqlquery.fieldName')"
          show-overflow-tooltip />
        <el-table-column
          prop="displayName"
          :label="$t('analysis.sqlquery.displayName')"
          show-overflow-tooltip />
        <el-table-column prop="type" :label="$t('analysis.sqlquery.type')" />
        <el-table-column :label="$t('common.operate')">
          <template #default="scope">
            <!-- 复制字段名 -->
            <div class="flex h28">
              <Tooltip>
                <el-button
                  class="p0 m0 nd-operate-btn-active fz28"
                  text
                  @click.stop="handleClipField(scope.row.name, $event)">
                  <SvgIcon class="fz16 prevent-no" name="copy2" />
                </el-button>
                <template #content>
                  {{ $t('analysis.sqlquery.copyFieldName') }}
                </template>
              </Tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.table-name {
  padding: 10px 20px;
  &-text {
    font-weight: bold;
    position: relative;
  }
}
.t-r-table {
  border-right: 1px solid var(--eas-split-line-color);
  .gap14 {
    gap: 14px;
  }
  .t-r-name {
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -10px;
      display: block;
      width: 4px;
      height: 100%;
      border-radius: 2px;
      background-color: var(--el-color-primary);
    }
  }
}
.t-r-field {
  &-table {
    width: calc(100% - 20px);
  }
}
.rotate-icon {
  transform: rotate(180deg);
}

.disabledBtn {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
