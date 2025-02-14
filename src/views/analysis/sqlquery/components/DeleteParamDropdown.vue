<script setup>
import { ref } from 'vue'

const props = defineProps({
  index: {
    type: Number,
    default: null,
  },
})

const dropdownParamDelect = ref(null)

/**
 * @description 打开删除弹框
 */
const handleParamDelectOpen = () => {
  dropdownParamDelect.value.handleOpen()
}

/**
 * @description 取消删除弹框
 */
const handleParamDelectCancle = () => {
  dropdownParamDelect.value.handleClose()
}

const emit = defineEmits(['delete'])

/**
 * @description 删除动态参数
 */
const handleParamDelectSubmit = (index) => {
  emit('delete', props.index)
  handleParamDelectCancle(index)
}

defineOptions({
  name: 'DeleteParamDropdown',
})
</script>
<template>
  <CommonDropdown ref="dropdownParamDelect" width="220px">
    <template #content>
      <el-button
        class="p0 m0 nd-operate-btn-active fz28 svg86919d"
        text
        @click="handleParamDelectOpen">
        <Tooltip>
          <SvgIcon class="fz14" name="delete1" />
          <template #content>
            {{ $t('analysis.sqlquery.deleteParameters') }}
          </template>
        </Tooltip>
      </el-button>
    </template>
    <template #default>
      <div class="flex-center fz14 mt20 ml12 mb20">
        <SvgIcon name="warning1" class="cff7d00 mr5 fz18" />
        <span>
          {{ $t('analysis.sqlquery.confirmDeleteParameters') }}
        </span>
      </div>
      <div class="ml10 mr10 mb10 text-align-right">
        <el-button text class="skip mr10" @click="handleParamDelectCancle">
          {{ $t('btn.cancel') }}
        </el-button>
        <el-button type="primary" class="m0" @click="handleParamDelectSubmit">
          {{ $t('btn.confirm') }}
        </el-button>
      </div>
    </template>
  </CommonDropdown>
</template>
<style lang="scss" scoped></style>
