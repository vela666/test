<template>
  <div class="flex-center gap10">
    <template v-for="item of btns.slice(0, 1)" :key="item.type">
      <el-button type="primary" @click="emit('click', item.type)" text>
        {{ item.label }}
      </el-button>
    </template>
    <DropDownPopoverSelection v-if="btns.length > 1">
      <el-button text type="primary"> {{ $t('btn.more') }} </el-button>
      <template #content>
        <template v-for="item of btns.slice(1)" :key="item.type">
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
  data: {
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
      type: 'addOrEdit',
      label: authEnumDesc.upd,
      show: authEnum.upd,
    },
    {
      type: 'enableData',
      label: t('btn.enable'),
      show: authEnum.status && ![0, 4].includes(props.data.status),
    },
    {
      type: 'disabledData',
      label: t('btn.disable'),
      show: authEnum.status && ![1, 2, 3, 4].includes(props.data.status),
    },
    {
      type: 'inviteActivation',
      label: t('system.members.inviteActivation'),
      show: authEnum.status && [4].includes(props.data.status),
    },
    {
      type: 'resign',
      label: t('system.members.setResignation'),
      show: authEnum.resign && ![4, 5].includes(props.data.status),
    },
    /* {
      type: 'resetData',
      label: authEnumDesc['rest-password'],
      show: authEnum['rest-password'],
    }, */
    /*{
      type: 'deleteData',
      label: authEnumDesc.del,
      show: authEnum.del,
    },*/
  ].filter((item) => item.show)
})

defineOptions({
  name: 'MoreChoices',
})
</script>

<style lang="scss" scoped></style>
