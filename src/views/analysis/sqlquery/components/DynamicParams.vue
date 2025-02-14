<script setup>
import { computed, ref, watch } from 'vue'
import DeleteParamDropdown from './DeleteParamDropdown.vue'
import EditParamDropdown from './EditParamDropdown.vue'
import SetOptionSelect from './SetOptionDropdown.vue'
import copyText from '@/utils/clipboard'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {},
  },
  index: {
    type: Number,
    default: 0,
  },
  list: {
    type: Array,
    default: () => [],
  },
  checkAll: {
    type: Boolean,
    default: false,
  },
  isIndeterminate: {
    type: Boolean,
    default: true,
  },
  checkTwo: {
    type: Boolean,
    default: false,
  },
  opt: {
    type: String,
    default: 'add',
  },
  operate: {
    type: Boolean,
    default: true,
  },
})

const emits = defineEmits([
  'update:modelValue',
  'updata:list',
  'update:checkAll',
  'update:isIndeterminate',
  'update:checkTwo',
  'replaceTemplate',
])

const params = computed(() => props.modelValue)

const listCom = computed(() => props.list)

const checkAllFlag = computed({
  get: () => {
    return props.checkAll
  },
  set: (val) => {
    emits('update:checkAll', val)
  },
})

const isIndeterminateFlag = computed({
  get: () => {
    return props.isIndeterminate
  },
  set: (val) => {
    emits('update:isIndeterminate', val)
  },
})

const checkTwoFlag = computed({
  get: () => {
    return props.checkTwo
  },
  set: (val) => {
    emits('update:checkTwoFlag', val)
  },
})

watch(
  () => params,
  (newValue) => {
    emits('update:modelValue', newValue)
  }
)

watch(
  () => listCom,
  (newValue) => {
    emits('update:list', newValue)
  }
)

/**
 * @description 复制单选change
 */
const handleCheckedCitiesChange = (val) => {
  const checkedCount = listCom.value.filter((item) => item.check).length
  checkAllFlag.value = checkedCount === listCom.value.length
  isIndeterminateFlag.value =
    checkedCount > 0 && checkedCount < listCom.value.length
}

/**
 * @description 动态参数selector类型设置选择项
 */
const handleGetSelector = (list, dataType, index) => {
  listCom.value[index].items = list
  listCom.value[index].dataType = dataType
  if (dataType === 'sql') {
    listCom.value[index].value = ''
  } else {
    listCom.value[index].value = []
  }
}

/**
 * @description 动态参数编辑
 */
const handleGetParamDate = (data, index) => {
  const item = {
    displayName: data.displayName,
    remark: data.remark,
  }
  if (listCom.value[index].type !== 'AppId') {
    item.name = `${data.code}${data.codeNum}`
    item.replacement = `${
      listCom.value[index].replacement.split('_')[0]
    }_${data.codeNum}}`
  }
  const oldName = listCom.value[index].name
  listCom.value[index] = Object.assign(listCom.value[index], item)
  if (oldName !== item.name) {
    // 修改sql语句中对应的模板
    emits('replaceTemplate', oldName, item.name)
  }
}

/**
 * @description 复制参数名
 */
const handleCopyParamName = (event, name) => {
  copyText(name, event)
}

/**
 * @description 删除动态参数
 */
const handleParamDelectSubmit = (index) => {
  listCom.value.splice(index, 1)
  if (listCom.value.length <= 5) {
    checkTwoFlag.value = false
  }
}

defineOptions({
  name: 'DynamicParams',
})
</script>
<template>
  <div
    class="dynamic-param-item mb20"
    :class="[checkTwoFlag ? 'form-item-check' : '']">
    <div class="flex-center gap14">
      <!-- 复选框 -->
      <div v-if="props.opt === 'copy'">
        <el-checkbox
          v-model="params.check"
          @change="handleCheckedCitiesChange"></el-checkbox>
      </div>
      <!-- 拖拽图标 -->
      <svg-icon
        v-if="props.operate"
        name="move"
        class="fz18 c-pointer color-CBD0D6 dynamic-param-drag"></svg-icon>
      <!-- 名称 -->
      <div class="dynamic-param-item-title">
        <span class="title-displayname">{{ params?.displayName }}</span>
        <span>{{ params?.name }}</span>
        <!-- 备注 -->
        <Tooltip v-if="params?.remark">
          <SvgIcon class="fz16 ml10 color-86919D" name="warning2" />
          <template #content>
            {{ params?.remark }}
          </template>
        </Tooltip>
      </div>
      <!-- 操作值 -->
      <div>
        <template v-if="params?.type === 'Text'">
          <CommonInput
            v-model="params.value"
            :prefixSlot="false"
            style="width: 180px" />
        </template>
        <template v-if="params?.type === 'Number'">
          <el-input-number
            v-model="params.value"
            style="width: 180px"
            :controls="false" />
        </template>
        <template v-if="params?.type === 'AppId'">
          <CommonInput
            v-model="params.value"
            :prefixSlot="false"
            style="width: 200px"
            disabled />
        </template>
        <template v-if="params?.type === 'DateTime'">
          <el-date-picker
            v-model="params.value"
            type="datetime"
            style="width: 180px"
            value-format="YYYY-MM-DD HH:mm:ss" />
        </template>
        <template v-if="params?.type === 'Date'">
          <el-date-picker
            v-model="params.value"
            style="width: 180px"
            value-format="YYYY-MM-DD" />
        </template>
        <template v-if="params?.type === 'Selector'">
          <div class="flex gap14">
            <template v-if="params?.items?.length > 0">
              <el-select
                v-if="params.dataType === 'sql'"
                key="sql-select"
                v-model="params.value"
                style="width: 180px"
                size="mini">
                <el-option
                  v-for="val in params.items"
                  :key="val.label"
                  :label="val.name"
                  :value="val.value" />
              </el-select>
              <el-select
                v-else
                key="not-sql-select"
                v-model="params.value"
                style="width: 180px"
                size="mini"
                multiple
                collapse-tags>
                <el-option
                  v-for="val in params.items"
                  :key="val.label"
                  :label="val.name"
                  :value="val.value" />
              </el-select>
            </template>
            <!-- Selector设置值 -->
            <SetOptionSelect
              v-if="props.operate"
              :list="params.items"
              :type="params.dataType"
              :hasValue="params?.items?.length > 0"
              :index="props.index"
              @getSelector="handleGetSelector"></SetOptionSelect>
          </div>
        </template>
      </div>
      <!-- 编辑显示名/序号/备注 -->
      <EditParamDropdown
        v-if="props.operate"
        :list="listCom"
        :index="props.index"
        @getParamDate="handleGetParamDate"></EditParamDropdown>
      <!-- 复制参数名 -->
      <Tooltip>
        <el-button
          v-if="props.operate"
          class="p0 m0 nd-operate-btn-active fz28 copy-param-button svg86919d"
          text
          @click="handleCopyParamName($event, params.replacement)">
          <SvgIcon class="fz16" name="copy1" />
        </el-button>
        <template #content>
          {{ $t('analysis.sqlquery.copyParamsName') }}
        </template>
      </Tooltip>
      <!-- 删除参数 -->
      <DeleteParamDropdown
        v-if="props.operate"
        :index="props.index"
        @delete="handleParamDelectSubmit"></DeleteParamDropdown>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.dynamic-param-item {
  &-title {
    height: 32px;
    line-height: 32px;
    padding: 0 16px;
    color: var(--eas-text-color-primary);
    background: var(--eas-hover-color-1);
    border-radius: 4px;
    .title-displayname {
      font-weight: bold;
      display: inline-block;
      margin-right: 10px;
    }
  }
}
.form-item-check {
  width: 50%;
  display: inline-flex;
}
.copy-param-button {
  svg {
    pointer-events: none;
  }
}
</style>
