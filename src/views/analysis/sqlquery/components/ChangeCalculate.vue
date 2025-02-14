<script setup>
import { ref } from 'vue'
import { ElButton, ElTooltip } from 'element-plus'

const emit = defineEmits(['close'])

const handleCalculate = () => {
  emit('close')
}

const props = defineProps({
  selection: {
    type: String,
    default: '',
  },
  selectionTips: {
    type: String,
    default: '',
  },
})

defineOptions({
  name: 'ChangeCalculate',
})
</script>
<template>
  <div class="change-calculate">
    <el-button @click.stop="handleCalculate">
      <i class="ml3 mr5">
        {{ selection }}
      </i>
      <el-tooltip placement="right">
        <SvgIcon class="fz14" name="help2" />
        <template #content>
          {{ selectionTips }}
        </template>
      </el-tooltip>
    </el-button>
  </div>
</template>
<style lang="scss" scoped>
.change-calculate {
  button {
    padding: 10px 10px 10px 6px;
    height: 40px;
    line-height: 40px;
  }
}
</style>
