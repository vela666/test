<template>
  <CommonDrawer
    @submit="submit"
    @close="close"
    :loading="state.operateLoading"
    v-model="state.show"
    :title="t('dashboard.exportDashboard')"
    size="600px">
    <template #title>
      {{ t('dashboard.exportDashboard') }}
      <Tooltip>
        <SvgIcon name="help2" class="c86919d" />
        <template #content>
          {{ t('dashboard.exportWarning') }}
        </template>
      </Tooltip>
    </template>
    <div class="flex-column gap16">
      <el-form
        ref="formRef"
        :model="state.formData"
        :rules="formRules"
        label-position="top"
        label-width="100px">
        <el-form-item label="" prop="dashboardList">
          <CustomTreeSelection
            @change="treeSelectionChange"
            height="760px"
            :props="{
              label: 'name',
            }"
            :nodeKey="kanBanDataUniqueKey"
            :data="optionalList" />
        </el-form-item>
      </el-form>
    </div>
  </CommonDrawer>
</template>

<script setup>
import { computed, markRaw, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { mapKanBanList } from '@/views/see-plate/utils'
import { kanBanDataUniqueKey } from '@/views/see-plate/enum'
import useSeePlateStore from '@/store/modules/see-plate'
import { asyncExportKanBan } from '@/api/modules/see-plate/dashboard.js'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const formRules = {
  dashboardList: [
    { required: true, message: t('common.pleaseSelect'), trigger: 'blur' },
  ],
}

const useSeePlate = useSeePlateStore()

const initVal = () => {
  return {
    show: false,
    operateLoading: false,
    formData: {
      dashboardList: [],
    },
  }
}

const formRef = ref(null)
const state = reactive(initVal())
const optionalList = computed(() => {
  return mapKanBanList(useSeePlate.leftCompleteData)
})

const close = () => {
  Object.assign(state, initVal())
}
const treeSelectionChange = (val) => {
  state.formData.dashboardList = markRaw(val)
}

// 合并spaceModuleParam里folderOrNot为false的看板为新的数组
const mergeDashboardIdsOptimized = (data) => {
  const resultMap = new Map()

  data.forEach((current) => {
    if (!current.exportDashboardParam[0].folderOrNot) {
      const key = current.spaceBusinessId
      if (resultMap.has(key)) {
        // 合并 dashboardBusinessIds，并确保它们是唯一的
        const existingParam = resultMap.get(key).exportDashboardParam[0]
        existingParam.dashboardBusinessIds = [
          ...new Set([
            ...existingParam.dashboardBusinessIds,
            ...current.exportDashboardParam[0].dashboardBusinessIds,
          ]),
        ]
      } else {
        resultMap.set(key, { ...current })
      }
    } else {
      // 对于 folderOrNot 为 true 的项，直接添加，不考虑合并
      resultMap.set(Symbol(), { ...current })
    }
  })
  return Array.from(resultMap.values())
}

const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    state.operateLoading = true
    const result = state.formData.dashboardList
      .flatMap((item) => item.children)
      .reduce(
        (p, c) => {
          if (c.topLevelId === 'ownerModule') {
            p.myCreateModuleParam.push({
              dashboardBusinessIds: c.children.map((item) => item.businessId),
              folderBusinessId: c.businessId,
              folderOrNot: false,
            })
          } else if (c.topLevelId === 'shareModule') {
            p.shareMeModuleParam.push({
              dashboardBusinessIds: c.children.map((item) => item.businessId),
              folderBusinessId: c.businessId,
              folderOrNot: false,
            })
          } else {
            c.children.forEach((item) => {
              if (!item.children) {
                p.spaceModuleParam.push({
                  exportDashboardParam: [
                    {
                      dashboardBusinessIds: [item.businessId],
                      folderBusinessId: '',
                      folderOrNot: false,
                    },
                  ],
                  spaceBusinessId: c.businessId,
                })
              } else {
                p.spaceModuleParam.push({
                  exportDashboardParam: [
                    {
                      dashboardBusinessIds: item.children.map(
                        (sub) => sub.businessId
                      ),
                      folderBusinessId: item.businessId,
                      folderOrNot: true,
                    },
                  ],
                  spaceBusinessId: c.businessId,
                })
              }
            })
          }
          return p
        },
        {
          myCreateModuleParam: [],
          shareMeModuleParam: [],
          spaceModuleParam: [],
        }
      )
    await asyncExportKanBan(result).finally((_) => {
      state.operateLoading = false
    })
    ElMessage.success(t('common.operationSuccessfully'))
    state.show = false
  })
}

const open = () => {
  state.show = true
}

defineExpose({
  open,
})
defineOptions({
  name: 'ExportKanBan',
})
</script>

<style scoped lang="scss"></style>
