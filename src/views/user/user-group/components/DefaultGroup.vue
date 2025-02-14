<template>
  <el-form-item :label="$t('user.userGroup.defaultGroup')" class="mt20">
    <el-radio-group v-model="defaultClusterVal">
      <el-radio
        v-for="(value, key) of defaultGroupType"
        :key="+key"
        :value="+key"
        >{{ value }}</el-radio
      >
    </el-radio-group>
  </el-form-item>
  <template v-if="defaultClusterVal">
    <el-form-item :label="$t('user.userGroup.belongingNotBelonging')">
      <el-radio-group v-model="belongClusterVal">
        <el-radio
          v-for="(value, key) of belongNotBelongGroupType"
          :key="+key"
          :value="+key"
          >{{ value }}</el-radio
        >
      </el-radio-group>
    </el-form-item>
    <el-form-item
      :label="$t('user.analysisModel')"
      class="nd-default-group-model">
      <el-checkbox
        v-model="checkAll"
        :indeterminate="isIndeterminate"
        @change="handleCheckAllChange">
        {{ $t('common.selectAll') }}
      </el-checkbox>
      <el-checkbox-group v-model="analyseIdVal">
        <el-checkbox
          v-for="item of modelType"
          :key="item.type"
          :label="item.label"
          :value="item.type" />
      </el-checkbox-group>
    </el-form-item>
  </template>
  <div class="nd-default-group-tip">
    {{ $t('user.userGroup.onlySetDefaultGroup') }}
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import {
  modelType,
  defaultGroupType,
  belongNotBelongGroupType,
} from '@/enumeration/user/user-group.js'

const checkAll = ref(false)
const isIndeterminate = ref(false)
// 是否是默认分群 0 否 1是
const defaultClusterVal = defineModel('defaultCluster', {
  type: [String, Number],
  default: 0,
})
// 是否属于分群 0 否 1是
const belongClusterVal = defineModel('belongCluster', {
  type: [String, Number],
  default: 0,
})

const analyseIdVal = defineModel('analyseId', {
  type: Array,
  default: () => [],
})

const handleCheckAllChange = (val) => {
  analyseIdVal.value = val ? modelType.map((item) => item.type) : []
  isIndeterminate.value = false
}

const handleCheckedCitiesChange = (value) => {
  const checkedCount = value.length
  checkAll.value = checkedCount === modelType.length
  isIndeterminate.value = checkedCount > 0 && checkedCount < modelType.length
}

watch(analyseIdVal, (val) => {
  handleCheckedCitiesChange(val)
})

defineOptions({
  name: 'DefaultGroup',
})
</script>

<style scoped lang="scss">
.nd-default-group-tip {
  display: inline-block;
  padding: 10px;
  min-height: 36px;
  background-color: var(--eas-color-primary-light-1);
  border-radius: 4px;
  font-size: 12px;
  color: var(--eas-text-color);
}
.nd-default-group-model {
  :deep(.el-form-item__content) {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
