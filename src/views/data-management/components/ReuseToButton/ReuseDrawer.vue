<template>
  <CommonDrawer
    :title="`${titleDesc[type]}`"
    v-model="state.dialogVisible"
    @submit="submit"
    size="600px"
    @close="close">
    <div class="mb5 c616161">
      {{ $t('common.selected') }} {{ state.filterSelectedList.length }}
      {{ $t('common.pcs') }}
    </div>
    <div class="n-reuse-selected-list mb20">
      <div
        class="flex-center flex-between"
        v-for="(item, index) of state.filterSelectedList"
        :key="index">
        <span class="c545e6e elem-hover" v-showTips>{{
          item[nameKey[type]]
        }}</span>
        <SvgIcon
          name="close1"
          class="ml10 mr10 c86919d c-pointer elem-hover"
          v-show="state.filterSelectedList.length > 1"
          @click="deleteSelectedList(index)" />
      </div>
    </div>
    <el-form
      label-position="top"
      :model="state.formData"
      :rules="rules"
      ref="formRef"
      label-width="100px">
      <el-form-item
        :label="$t('dataManagement.reuseApp') + ':'"
        prop="appIdList">
        <OptionalDataSelection
          height="460px"
          class="w100-percentage"
          valueKey="appId"
          valueLabel="appName"
          :list="appList"
          v-model="state.formData.appIdList" />
      </el-form-item>
    </el-form>
    <template #footer-l>
      <div v-show="+type === 1">
        <el-switch v-model="state.formData.related" />
        <span class="ml5 c616161">
          {{ $t('dataManagement.reuseAttrToApp') }}
        </span>
      </div>
    </template>
  </CommonDrawer>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { asyncMultiplexTo } from '@/api/modules/data-management/common'
import { recordBehavior } from '@/utils/record-behavior.js'
import { t } from '@/locales/i18n'
import useAppStore from '@/store/modules/app.js'

const props = defineProps({
  // 1事件管理 2事件属性管理 3用户属性管理
  type: {
    type: String,
    default: '1',
  },
})
const rules = {
  appIdList: [
    { required: true, message: t('common.pleaseSelect'), trigger: 'change' },
  ],
}
const titleDesc = {
  1: t('dataManagement.reuseEventTitle'),
  2: t('dataManagement.reuseEventAttrTitle'),
  3: t('dataManagement.reuseUserAttrTitle'),
}
const nameKey = {
  1: 'eventNameZh',
  2: 'fZh',
  3: 'fZh',
}

const appStore = useAppStore()

const initVal = () => {
  return {
    dialogVisible: false,
    formData: {
      // 已选应用
      appIdList: [],
      // 事件管理传 是否关联属性(true,false)
      related: true,
    },
    // 已选titleDesc的列表
    filterSelectedList: [],
  }
}
const state = reactive(initVal())
const formRef = ref(null)

const appList = computed(() => {
  // 过滤当前的应用
  return appStore.appList.filter(
    (item) => item.appId !== sessionStorage.getItem('appId')
  )
})

const deleteSelectedList = (index) => {
  state.filterSelectedList.splice(index, 1)
}
const open = (data) => {
  state.filterSelectedList = data.filter((item) => {
    if (+props.type === 1) {
      return +item.eventType === 1
    }
    if ([2, 3].includes(+props.type)) {
      // 自定义和虚拟
      return [2, 4].includes(item.type)
      // return [2].includes(item.type)
    }
  })
  let txt = `${+props.type === 1 ? '' : t('dataManagement.virtual') + '/'}${t('dataManagement.custom')}${
    // let txt = `请选择自定义${
    +props.type === 1
      ? t('dataManagement.eventProp')
      : t('dataManagement.attrProp')
  }`
  if (!state.filterSelectedList.length) {
    ElMessage.warning(t('dataManagement.pleaseSelectDynamic', [txt]))
    return
  }
  if (data.length !== state.filterSelectedList.length) {
    ElMessage.warning(
      t('dataManagement.filteredMessage', [
        data.length - state.filterSelectedList.length,
        txt,
      ])
      // `已过滤${data.length - state.filterSelectedList.length}条非${txt}`
    )
  }
  state.dialogVisible = true
}
const close = () => {
  Object.assign(state, initVal())
}
const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return

    let type = +props.type
    recordBehavior({
      moduleName: '数据管理',
      submoduleName: titleDesc[type],
      operate: `将${type === 1 ? '事件' : '属性'}复用至其他应用`,
    })
    let key1 = type === 1 ? 'eventIdList' : 'fidList'
    let key2 = [2, 3].includes(type) ? 'fId' : 'eventId'
    const { code } = await asyncMultiplexTo(
      {
        ...state.formData,
        [key1]: state.filterSelectedList.map((item) => {
          return item[key2]
        }),
      },
      type
    )
    if (code === 200) {
      ElMessage.success(t('dataManagement.reuseSuccessFully'))
      state.dialogVisible = false
    }
  })
}

defineExpose({
  open,
})
defineOptions({
  name: 'ReuseDrawer',
})
</script>

<style scoped lang="scss">
.n-reuse-selected-list {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  max-height: 224px;
  //height: 130px;
  border: 1px solid var(--eas-border-color-2);
  border-radius: 2px;
  overflow-y: auto;
  padding: 16px 20px;
  gap: 20px;
  > div {
    padding-left: 10px;
    height: 32px;
    line-height: 32px;
    background-color: var(--eas-color-primary-light-1);
    border-radius: 2px;
    width: calc(50% - 10px);
  }
}
</style>
