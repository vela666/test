<template>
  <div class="mb24" v-if="showSwitch && !showName && !id">
    <el-segmented
      v-model="addExistClusterVal"
      :options="options"
      @change="clusterInfoVal = undefined"
      block />
  </div>
  <el-form-item
    v-if="showName"
    :rules="[
      { required: true, message: $t('common.pleaseEnter'), trigger },
      {
        validator(rule, value, callback) {
          if (!validIdentifierRegex1(value)) {
            return callback($t('user.nameCheckMsg'))
          }
          callback()
        },
        trigger,
      },
    ]"
    :label="`${text || $t('user.group')}${$t('user.name')}`"
    prop="name">
    <CommonInput
      class="w100-percentage"
      :prefixSlot="false"
      trimAllSpace
      maxlength="8"
      show-word-limit
      :disabled="!!id"
      v-model="nameVal" />
  </el-form-item>
  <el-form-item
    v-if="!addExistCluster"
    :rules="[{ required: true, message: $t('common.pleaseEnter'), trigger }]"
    :label="$t('user.displayName')"
    prop="displayName">
    <CommonInput
      class="w100-percentage"
      :prefixSlot="false"
      trimAllSpace
      maxlength="24"
      show-word-limit
      v-model="displayNameVal" />
  </el-form-item>
  <el-form-item
    v-else
    :rules="[{ required: true, message: $t('common.pleaseSelect'), trigger }]"
    :label="$t('user.displayName')"
    prop="clusterInfo">
    <el-select value-key="id" v-model="clusterInfoVal" filterable>
      <el-option
        v-for="item in clusterList"
        :value="item"
        :label="item.name"
        :key="item.id" />
    </el-select>
  </el-form-item>
  <el-form-item :label="$t('common.remark')">
    <CommonInput
      class="w100-percentage"
      :prefixSlot="false"
      maxlength="50"
      show-word-limit
      :rows="3"
      type="textarea"
      resize="none"
      v-model="remarkVal" />
  </el-form-item>
</template>

<script setup>
import { ref, inject, toRef } from 'vue'
import { validIdentifierRegex1 } from '@/utils/validate'
import { getClusterData } from '@/api/modules/common'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数

const props = defineProps({
  text: {
    type: String,
    default: '',
  },
  // 是否显示分群/标签名
  showName: {
    type: Boolean,
    default: true,
  },
  id: {
    type: [String, Number],
    default: '',
  },
  // 是否切换新建分群、添加到已有分群
  showSwitch: {
    type: Boolean,
    default: false,
  },
})

const appId = toRef(inject('appId', sessionStorage.getItem('appId')))

const options = [
  {
    value: 0,
    label: t('user.createNewGroup'),
  },
  {
    value: 1,
    label: t('user.addExistingGroup'),
  },
]

const trigger = ['blur', 'change']
const nameVal = defineModel('name', {
  type: String,
  default: '',
})
const displayNameVal = defineModel('displayName', {
  type: String,
  default: '',
})
const remarkVal = defineModel('remark', {
  type: String,
  default: '',
})
const addExistClusterVal = defineModel('addExistCluster', {
  type: Number,
  default: 0,
})
const clusterInfoVal = defineModel('clusterInfo', {
  type: Object,
  default: () => {},
})
defineOptions({
  name: 'DisplayNameRemark',
})

const clusterList = ref()

getClusterData({ appId: appId.value }).then((res) => {
  clusterList.value = res.data
})
</script>

<style scoped lang="scss">
:deep(.el-segmented__item) {
  min-width: 120px !important;
}
</style>
