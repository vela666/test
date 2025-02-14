<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { mapKanBanList } from '@/views/see-plate/utils'
import {
  reportBindingDashboard,
  reportBindingDashboardInfo,
} from '@/api/modules/analysis/report'
import { asyncGetLeftKanBanInfo } from '@/api/modules/see-plate/index'
import { traverseTree } from '@/utils/dataProcessing'
import { recordBehavior } from '@/utils/record-behavior.js'
import { t } from '@/locales/i18n'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  row: {
    type: Object,
    default: () => {},
  },
})

const state = reactive({
  dataList: [],
  checkList: [],
  loading: false,
})

const customTreeSelectionRef = ref(null)

const emit = defineEmits(['update:modelValue', 'update:data', 'close'])

const dialogVisible = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
  },
})

watch(
  () => props.row,
  async (newVal) => {
    // 获取左侧树列表
    state.loading = true
    try {
      const resKanBanInfo = await asyncGetLeftKanBanInfo()
      if (resKanBanInfo && resKanBanInfo.code === 200) {
        const resKanBanData = mapKanBanList({
          data: resKanBanInfo.data || [],
          delKey: ['navigationExpand'],
        })
        // 获取右侧选中数据
        let resDashboardData = []
        if (newVal && newVal.businessId) {
          const resDashboardInfo = await reportBindingDashboardInfo({
            businessId: newVal.businessId,
          })

          if (resDashboardInfo && resDashboardInfo.code === 200) {
            resDashboardData = resDashboardInfo.data || []
          }
        }
        state.dataList = traverseTree(resKanBanData, (item) => {
          if (item.authority === 1) {
            item.disabled = true
          }
          if (resDashboardData.some((e) => e.businessId === item.businessId)) {
            item.selected = true
          }
        })
      }
    } catch (error) {
      console.log(error)
    } finally {
      state.loading = false
    }
  },
  {
    deep: true,
  }
)

onMounted(() => {})

const close = () => {}

const submit = () => {
  state.loading = true
  recordBehavior({
    moduleName: '数据报表',
    submoduleName: '数据报表',
    operate: '将报表添加至看板',
  })
  const List = customTreeSelectionRef.value.optionalList()
  const totalBusinessIdList = List.map((item) => item.businessId)
  const params = {
    businessId: props.row.businessId,
    dashboardBusinessIds: state.checkList.map((e) => e.businessId),
    totalBusinessIdList,
  }
  reportBindingDashboard(params)
    .then((res) => {
      if (res && res.code === 200) {
        ElMessage.success(t('analysis.report.successfullySaved'))
        dialogVisible.value = false
        emit('close', 'search')
      }
    })
    .finally(() => {
      state.loading = false
    })
}

defineOptions({
  name: 'AddToDashboardDrawer',
})
</script>
<template>
  <CommonDrawer
    v-model="dialogVisible"
    :title="$t('analysis.report.addToDashboard')"
    size="600px"
    :loading="state.loading"
    @close="close"
    @submit="submit">
    <CustomTreeSelection
      :props="{
        label: 'name',
      }"
      nodeKey="businessId"
      ref="customTreeSelectionRef"
      v-model="state.checkList"
      :data="state.dataList" />
  </CommonDrawer>
</template>
<style lang="scss" scoped></style>
