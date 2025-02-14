<template>
  <el-tabs v-loading="tabsLoading" type="border-card" class="yf-el-tabs">
    <el-tab-pane v-for="item of tabsOptions" :key="item.key">
      <template #label>
        <div class="yf-tab-label">
          {{ item.title }}({{ permissionConfig[item.key].ids.length }}/{{
            permissionOptions[item.key].length
          }})
        </div>
      </template>
      <TabBox
        v-model="permissionConfig[item.key]"
        :source="permissionOptions[item.key]"
        >{{ item.title }}</TabBox
      >
    </el-tab-pane>
  </el-tabs>
  <div class="fz12 c545e6e">
    {{ $t('system.projectTeams.allStatusesAttributes') }}
  </div>
</template>

<script setup>
import { nextTick, ref } from 'vue'
import TabBox from './TabBox.vue'
import {
  getDataPermissionConfig,
  getDataPermissionDetails,
} from '@/api/modules/data-permission'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数

const data = {
  events: [],
  eventFields: [],
  userFields: [],
}

const initPermissionConfig = () => ({
  events: {
    status: true,
    ids: [],
  },
  eventFields: {
    status: true,
    ids: [],
  },
  userFields: {
    status: true,
    ids: [],
  },
})
const tabsLoading = ref(false)
const permissionConfig = ref(initPermissionConfig())
const permissionOptions = ref({
  events: [],
  eventFields: [],
  userFields: [],
})

const appId = ref('')

const tabsOptions = [
  { title: t('dataManagement.eventProp'), key: 'events' },
  { title: t('dataManagement.eventAttribute'), key: 'eventFields' },
  { title: t('dataManagement.userAttribute'), key: 'userFields' },
]

/**
 * @description 获取权限配置及回选
 */
const getData = async (row, optType) => {
  appId.value = row.appId || ''
  permissionOptions.value = data
  permissionConfig.value = initPermissionConfig()
  tabsLoading.value = true
  try {
    const configRes = await getDataPermissionConfig({ appId: row.appId })
    if (configRes && configRes.code === 200) {
      permissionOptions.value.events = configRes.data.events || []
      permissionOptions.value.eventFields = configRes.data.eventFields || []
      permissionOptions.value.userFields = configRes.data.userFields || []
      permissionConfig.value.events.status = !!configRes.data.newEvenVisible
      permissionConfig.value.eventFields.status =
        !!configRes.data.newEvenFieldVisible
      permissionConfig.value.userFields.status =
        !!configRes.data.newUserFieldVisible
    }

    if (optType === 'edit') {
      const detailsRes = await getDataPermissionDetails({
        id: row.dataPermissionId,
      })
      if (detailsRes && detailsRes.code === 200) {
        for (let key in detailsRes.data) {
          if (key === 'events') {
            permissionConfig.value[key].status = detailsRes.data.newEvenVisible
            permissionConfig.value[key].ids = detailsRes.data[key].map(
              (e) => e.id
            )
          } else if (key === 'eventFields') {
            permissionConfig.value[key].status =
              detailsRes.data.newEvenFieldVisible
            permissionConfig.value[key].ids = detailsRes.data[key].map(
              (e) => e.id
            )
          } else if (key === 'userFields') {
            permissionConfig.value[key].status =
              detailsRes.data.newUserFieldVisible
            permissionConfig.value[key].ids = detailsRes.data[key].map(
              (e) => e.id
            )
          }
        }
      }
    }
  } catch (error) {
    console.error(error)
  } finally {
    tabsLoading.value = false
  }
}

/**
 * @description 获取已选权限
 */
const getPermission = () => {
  return permissionConfig.value
}

defineExpose({
  getData,
  getPermission,
})

defineOptions({
  name: 'NewConfigPermission',
})
</script>

<style scoped lang="scss">
.yf-el-tabs {
  width: 100%;
  &.el-tabs--border-card {
    box-shadow: none;
    -webkit-box-shadow: none;
  }
  .el-tabs__item {
    &.is-active {
      .yf-tab-label {
        position: relative;
        &::after {
          content: '';
          position: absolute;
          width: 50%;
          height: 4px;
          bottom: 1px;
          left: 50%;
          transform: translate(-50%, 0);
          border-radius: 2px;
          background: #4fa1ff;
        }
      }
    }
  }
}
</style>
