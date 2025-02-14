<template>
  <div class="flex-center gap10">
    <template v-for="item of btns.slice(0, 2)" :key="item.type">
      <el-button
        type="primary"
        class="m0"
        @click="emit('click', item.type)"
        text>
        <span>
          {{ item.label }}
        </span>
      </el-button>
    </template>
    <DropDownPopoverSelection v-if="btns.length > 2">
      <el-button text class="m0" type="primary"> {{ t('btn.more') }}</el-button>
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
import { useI18n } from 'vue-i18n'
const props = defineProps({
  data: {
    type: Object,
    default: () => {
      return {}
    },
  },
  type: {
    type: String,
    default: '',
  },
  notShowBtn: {
    type: Boolean,
    default: true,
  },
})
const emit = defineEmits(['click'])

const { t } = useI18n()

const btns = computed(() => {
  const isShared = props.type === 'shared'
  const isCollect = props.type === 'collect'
  const isDefault = props.type === 'default'
  return [
    {
      type: 'exec',
      label: t('btn.execute'),
    },
    {
      type: 'shared',
      label: t('btn.share'),
      notShow: isShared || props.data.isShared === 1 || props.notShowBtn,
    },
    {
      type: 'cancelShared',
      label: t('btn.cancelShare'),
      // notShow: props.data.isShared !== 1 || props.notShowBtn,
      notShow: props.data.isShared !== 1 || isShared,
    },
    {
      type: 'setAsDefault',
      label: t('btn.setDefault'),
      notShow: isShared || isDefault || props.notShowBtn,
    },
    {
      type: 'cancelDefault',
      label: t('btn.cancelDefault'),
      notShow: isShared || isCollect || props.notShowBtn,
    },
    {
      type: 'rename',
      label: t('btn.rename'),
      notShow: isShared || props.notShowBtn,
    },
    {
      type: 'delete',
      label: t('btn.delete'),
      notShow: isShared || isDefault || props.notShowBtn,
    },
  ].filter((item) => !item.notShow)
})

defineOptions({
  name: 'MoreChoices',
})
</script>

<style lang="scss" scoped></style>
