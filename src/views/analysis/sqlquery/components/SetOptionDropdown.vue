<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { cloneDeep } from 'lodash-es'
import draggable from 'vuedraggable'

const props = defineProps({
  index: {
    type: Number,
    default: 0,
  },
  list: {
    type: Array,
    default: () => [],
  },
  hasValue: {
    type: Boolean,
    default: true,
  },
  type: {
    type: String,
    default: 'text',
  },
})

const state = reactive({
  form: {
    dataType: 'sql',
    dynamicItem: [],
  },
})

const commonDropdown = ref(null)
const form = ref(null)

watch(
  () => props.list,
  (val) => {
    state.form.dynamicItem = cloneDeep(val)
  },
  { deep: true, immediate: true }
)

watch(
  () => props.type,
  (val) => {
    state.form.dataType = val
  },
  { deep: true, immediate: true }
)

/**
 * @description 新增行
 */
const handleAdd = () => {
  state.form.dynamicItem.push({
    name: '',
    value: '',
  })
}

/**
 * @description 打开
 */
const handleOpen = () => {
  commonDropdown.value.handleOpen()
}

/**
 * @description 下拉框出现/隐藏时触发
 */
const visibleChange = (visible) => {
  if (!visible) {
    handleCancle()
  }
}

/**
 * @description 取消
 */
const handleCancle = () => {
  state.form.dataType = props.type
  state.form.dynamicItem = cloneDeep(props.list)
  form.value.clearValidate()
  commonDropdown.value.handleClose()
}

const handleDelete = (i) => {
  state.form.dynamicItem.splice(i, 1)
}

const emit = defineEmits(['getSelector'])

/**
 * @description 提交
 */
const handleSubmit = () => {
  form.value.validate((valid) => {
    if (valid) {
      const list = JSON.parse(JSON.stringify(state.form.dynamicItem))
      emit('getSelector', list, state.form.dataType, props.index)
      handleCancle()
    }
  })
}

defineOptions({
  name: 'SetOptionSelect',
})
</script>
<template>
  <CommonDropdown
    ref="commonDropdown"
    width="900px"
    @visible-change="visibleChange">
    <template #content>
      <el-button
        v-if="!hasValue"
        type="primary"
        class="m0 fz14 is-text"
        @click="handleOpen">
        {{ $t('analysis.sqlquery.setSelection') }}
      </el-button>
      <el-button
        v-else
        class="p0 m0 nd-operate-btn-active fz28"
        text
        @click="handleOpen">
        <SvgIcon class="fz14" name="setting1" />
      </el-button>
    </template>
    <template #title>
      <div>
        {{ $t('analysis.sqlquery.setSelection') }}({{
          $t('analysis.sqlquery.multiSelect')
        }})
      </div>
    </template>
    <template #container>
      <div>
        <div>
          <div>{{ $t('analysis.sqlquery.dataType') }}</div>
          <div>
            <el-radio-group v-model="state.form.dataType">
              <el-radio value="sql">sql</el-radio>
              <el-radio value="number">{{
                $t('analysis.sqlquery.number')
              }}</el-radio>
              <el-radio value="text">
                {{ $t('analysis.sqlquery.text') }}
                ({{ $t('analysis.sqlquery.textTips') }})
              </el-radio>
            </el-radio-group>
          </div>
        </div>
        <div class="selector-header">
          <div class="selector-name flex-center">
            <div class="require mr3">*</div>
            {{ $t('analysis.sqlquery.optionName') }}
          </div>
          <div class="selector-value flex-center">
            <div class="require mr3">*</div>
            {{ $t('analysis.sqlquery.content') }}
          </div>
        </div>
        <el-form ref="form" :model="state.form">
          <div class="selector-container">
            <draggable
              v-model="state.form.dynamicItem"
              force-fallback="true"
              :group="{ name: 'rules', pull: false, put: false }"
              :animation="500"
              handle=".dynamic-option-param-drag"
              fallback-tolerance="10"
              item-key="id"
              :component-data="{
                name: 'fade',
                type: 'transtion-group',
              }">
              <template #item="{ index }">
                <div :key="index" class="selector-item">
                  <div class="form-name mr20">
                    <el-form-item
                      :prop="`dynamicItem.${index}.name`"
                      :rules="{
                        required: true,
                        message: $t('analysis.sqlquery.inputNotEmpty', [
                          $t('analysis.sqlquery.optionName'),
                        ]),
                        trigger: 'blur',
                      }">
                      <div class="flex-center">
                        <!-- 拖拽图标 -->
                        <svg-icon
                          name="move"
                          class="fz14 mr10 c-pointer color-CBD0D6 dynamic-option-param-drag"></svg-icon>
                        <CommonInput
                          v-model="state.form.dynamicItem[index].name"
                          :prefixSlot="false"
                          :maxlength="50"
                          show-word-limit
                          :placeholder="
                            $t('analysis.sqlquery.enterDynamicName', [
                              $t('analysis.sqlquery.optionName'),
                            ])
                          " />
                      </div>
                    </el-form-item>
                  </div>
                  <div class="form-content mr20">
                    <el-form-item
                      :prop="`dynamicItem.${index}.value`"
                      :rules="{
                        required: true,
                        message: $t('analysis.sqlquery.inputNotEmpty', [
                          $t('analysis.sqlquery.optionContent'),
                        ]),
                        trigger: 'blur',
                      }">
                      <CommonInput
                        v-model="state.form.dynamicItem[index].value"
                        :prefixSlot="false"
                        :maxlength="200"
                        show-word-limit
                        :placeholder="
                          $t('analysis.sqlquery.optionSQLPlaceholder')
                        " />
                    </el-form-item>
                  </div>
                  <div class="form-btn flex mr10">
                    <el-button
                      class="p0 m0 nd-operate-btn-active fz28"
                      text
                      @click="handleDelete(index)">
                      <SvgIcon class="fz14" name="delete1" />
                    </el-button>
                  </div>
                </div>
              </template>
            </draggable>
          </div>
        </el-form>
        <el-button type="primary" class="m0 fz14 is-text" @click="handleAdd">
          <SvgIcon class="fz14 mr3" name="add1" />
          {{ $t('analysis.sqlquery.addOptions') }}
        </el-button>
      </div>
    </template>
    <template #buttom>
      <div>
        <el-button text class="skip mr10" @click="handleCancle">
          {{ $t('btn.cancel') }}
        </el-button>
        <el-button type="primary" class="m0" @click="handleSubmit">
          {{ $t('btn.confirm') }}
        </el-button>
      </div>
    </template>
  </CommonDropdown>
</template>
<style lang="scss" scoped>
.option-name {
  height: 32px;
  line-height: 32px;
  text-align: center;
  color: var(--eas-color-primary);
}
.selector-header {
  margin-top: 40px;
  display: flex;
  align-items: center;
  .require {
    color: var(--eas-color-danger);
  }
  .selector-name {
    width: 160px;
    margin-right: 20px;
  }
  .selector-value {
    flex: 1;
  }
}
.selector-container {
  max-height: 280px;
  overflow: auto;
}
.selector-item {
  display: flex;
}
.form-name {
  width: 160px;
}
.form-content {
  flex: 1;
}
.form-btn {
  height: 32px;
  line-height: 32px;
}
</style>
