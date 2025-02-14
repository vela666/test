<template>
  <div class="flex-center gap10">
    <template v-for="item of btns.slice(0, 1)" :key="item.type">
      <el-button
        :disabled="!!item.disabled"
        type="primary"
        @click="emit('click', item.type)"
        text>
        <span>
          {{ item.label }}
        </span>
      </el-button>
    </template>
    <DropDownPopoverSelection>
      <el-button text type="primary">{{ $t('btn.more') }}</el-button>
      <template #content>
        <template v-for="item of btns.slice(1)" :key="item.type">
          <el-button
            :disabled="!!item.disabled"
            class="skip"
            @click="emit('click', item.type)"
            text>
            {{ item.label }}
            <Tooltip>
              <SvgIcon
                class="ml5"
                name="help2"
                v-if="item.type === 'delete' && !!item.disabled" />
              <template #content>
                {{ $t('system.apps.deleteAppMsg') }}
              </template>
            </Tooltip>
          </el-button>
        </template>
      </template>
    </DropDownPopoverSelection>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { authEnum, authEnumDesc } from '../enum.js'
import { domesticOverseasMark } from '@/utils/domesticOverseas.js'
import DropDownPopoverSelection from '@/components/DropDownPopoverSelection/index.vue'
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
      type: 'access',
      label: t('system.apps.access'),
      show: true,
    },
    {
      type: 'rule',
      label: t('system.apps.trackingPointsFilteringRules'),
      show: true,
    },
    {
      type: 'subscription',
      label: t('system.apps.subscriptionConfig'),
      show: domesticOverseasMark() !== 1,
    },
    {
      type: 'delete',
      label: authEnumDesc.del,
      show: authEnum.del,
      disabled: props.row.newStatus === 0,
    },
  ].filter((item) => item.show)
})

defineOptions({
  name: 'MoreChoices',
})
</script>

<style lang="scss" scoped></style>
