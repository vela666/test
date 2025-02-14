<template>
  <div class="flex-center gap10">
    <template v-for="item of btns.slice(0, 2)" :key="item.type">
      <el-button type="primary" @click="emit('click', item.type)" text>
        <span>
          {{ item.label }}
        </span>
      </el-button>
    </template>
    <DropDownPopoverSelection v-if="btns.length > 2">
      <el-button text type="primary">{{ $t('btn.more') }}</el-button>
      <template #content>
        <template v-for="item of btns.slice(2)" :key="item.type">
          <el-button class="skip" @click="emit('click', item.type)" text>
            <span>
              {{ item.label }}
            </span>
          </el-button>
        </template>
      </template>
    </DropDownPopoverSelection>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { authEnum, authEnumDesc } from '../enum.js'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数

const props = defineProps({
  row: {
    type: Object,
    default: () => {
      return {}
    },
  },
})
const emit = defineEmits(['click'])

const btns = computed(() => {
  return [
    {
      type: 'edit',
      label: authEnumDesc.upd,
      show: authEnum.upd,
    },
    {
      type: 'updData',
      label: t('user.refreshData'),
      show: authEnum.add && ![2, 3].includes(props.row.createType),
    },
    {
      type: 'saveAs',
      label: t('analysis.saveAs'),
      show: authEnum.add && ![2, 3].includes(props.row.createType),
    },
    {
      type: 'delete',
      label: authEnumDesc.del,
      show: authEnum.del,
    },
  ].filter((item) => item.show)
})

defineOptions({
  name: 'MoreChoices',
})
</script>

<style lang="scss" scoped></style>
