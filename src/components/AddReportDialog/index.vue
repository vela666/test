<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { recordBehavior } from '@/utils/record-behavior.js'
import { useI18n } from 'vue-i18n'
import { reportTypeList } from '@/enumeration/report.js'

const { t } = useI18n()
const router = useRouter()
const emit = defineEmits(['close'])
const props = defineProps({
  // 用户操作日志描述  数据报表和数据看板
  moduleName: {
    type: String,
    default: '',
  },
  submoduleName: {
    type: String,
    default: '',
  },
})

const state = reactive({
  show: false,
  params: {},
})

const handleOpenAnalysis = (item) => {
  state.show = false

  if (props.moduleName) {
    recordBehavior({
      moduleName: props.moduleName,
      submoduleName: props.submoduleName || props.moduleName,
      operate: `新建${item.label}`,
    })
  }

  let { href } = router.resolve({ path: item.path })
  const searchParams = new URLSearchParams('')
  if (state.params) {
    Object.keys(state.params).forEach((key) => {
      const value = state.params[key]
      // 更新或添加参数
      if (value !== undefined) {
        searchParams.set(key, value)
      } else {
        // 如果值为 undefined，则删除参数
        searchParams.delete(key)
      }
    })
  }

  href += searchParams.toString()
    ? `?${searchParams.toString()}&virtualAppId=${sessionStorage.getItem('appId')}`
    : `?virtualAppId=${sessionStorage.getItem('appId')}`
  window.open(href, '_blank')
}

const open = (params = {}) => {
  state.params = params
  state.show = true
}

defineExpose({
  open,
})
defineOptions({
  name: 'AddReportDialog',
})
</script>
<template>
  <CommonDialog
    v-model="state.show"
    width="814px"
    :title="t('dashboard.createReport')"
    :show-close="true"
    :need-footer="false"
    @close="emit('close')">
    <template #default>
      <div class="add-report flex flex-warp flex-between">
        <div
          v-for="(item, index) of reportTypeList"
          :key="index"
          class="add-report-item flex c-pointer"
          @click="handleOpenAnalysis(item)">
          <SvgIcon :name="item.icon" class="fz18 mr10 report-icon" />
          <div>
            <div class="mb5 fz16 c545e6e report-title">{{ item.label }}</div>
            <div class="fz14">{{ item.desc }}</div>
          </div>
        </div>
      </div>
    </template>
  </CommonDialog>
</template>
<style lang="scss" scoped>
.add-report {
  &-item {
    width: 230px;
    min-height: 150px;
    margin-bottom: 30px;
    padding: 10px 10px 0 10px;
    border-radius: 4px;
    border: 1px solid var(--eas-text-color-light-1);

    .report-icon {
      height: 24px;
      line-height: 24px;
    }

    .report-title {
      font-weight: 400;
    }

    &:hover {
      .report-icon,
      .report-title {
        color: var(--eas-color-primary);
      }

      border-color: #fff;
      box-shadow: 0px 0px 6px 1px rgba(28, 32, 40, 0.18);
    }
  }
}
</style>
