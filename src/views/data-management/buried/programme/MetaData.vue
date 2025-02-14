<template>
  <div class="flex-center nd-metadata-t">
    <div
      :class="{ active: tabActive.name === key }"
      v-for="(item, key) of tabs"
      :key="key"
      @click="switchTab(item.is)">
      {{ item.label }}
    </div>
  </div>
  <component :is="tabActive" :ref="(el) => setRefs(tabActive.name, el)">
    <template #default>
      <Auth :value="authEnum.del">
        <el-button @click="batchDelFn" :disabled="!selectedQuantity">
          <SvgIcon name="delete1" class="fz16 mr3" />
          {{ $t('dataManagement.batchDelete') }}
        </el-button>
      </Auth>
      <Auth :value="authEnum.add">
        <template #default>
          <DropDownItemSelection trigger="hover">
            <el-button type="primary">
              <SvgIcon name="add1" class="fz16 mr3" />
              {{ $t('btn.add') }}
              <!-- {{ title }} -->
            </el-button>
            <template #content>
              <template v-for="item of addTypeList" :key="item.type">
                <el-dropdown-item @click="addClickFn[item.type]">
                  {{ item.label }}
                </el-dropdown-item>
              </template>
            </template>
          </DropDownItemSelection>
        </template>
      </Auth>
    </template>
  </component>
  <BatchUpload ref="batchUploadRef" @getData="getData" />
</template>

<script setup>
import { markRaw, ref, computed } from 'vue'
import Event from './event/index.vue'
import EventAttr from './event-attr/index.vue'
import User from './user/index.vue'
import { authEnum } from './enum.js'
import BatchUpload from './components/BatchUpload.vue'
import { useTipModal } from '@/components/TipDialog/index.js'
import { recordBehavior } from '@/utils/record-behavior.js'

import { asyncDelEvent } from '@/api/modules/programme/event.js'
import { asyncSyncByOnline } from '@/api/modules/programme/common.js'
import { ElMessage } from 'element-plus'
import { t } from '@/locales/i18n'

const tempKey = 'metaDataTop'

const tabs = {
  Event: {
    is: markRaw(Event),
    label: t('dataManagement.eventProp'),
    delFn: asyncDelEvent,
  },
  EventAttr: {
    is: markRaw(EventAttr),
    label: t('dataManagement.eventAttribute'),
  },
  User: {
    is: markRaw(User),
    label: t('dataManagement.userAttribute'),
  },
}

const tabActive = ref(
  tabs[sessionStorage.getItem(tempKey)]?.is || tabs.Event.is
)
const componentsRefs = ref({})
const batchUploadRef = ref()
const addTypeList = computed(() => {
  return [
    {
      type: 1,
      label: tabs[tabActive.value.name].label,
    },
    {
      type: 2,
      label: t('dataManagement.batchUpload'),
    },
    {
      type: 3,
      label: t('dataManagement.buried.syncFromOnline'),
    },
  ]
})

const getData = () => {
  currentShow.value.getData()
}

const addClickFn = {
  1() {
    currentShow.value.addFn()
  },
  2() {
    batchUploadRef.value.open()
  },
  3() {
    useTipModal({
      content: t('dataManagement.buried.syncFromOnlineTip'),
      iconType: 3,
      title: t('dataManagement.buried.syncFromOnline'),
      // 传事件
      async onSubmit(cb) {
        recordBehavior({
          moduleName: '数据管理',
          submoduleName: '埋点方案',
          operate: '从线上埋点同步',
        })
        await asyncSyncByOnline().finally((_) => {
          cb()
        })
        getData()
        ElMessage.success(t('common.operate'))
      },
    })
  },
}

const setRefs = (name, el) => {
  componentsRefs.value[name] = el
}

const currentShow = computed(() => {
  return componentsRefs.value[tabActive.value.name]
})

const selectedQuantity = computed(() => {
  return currentShow.value?.state?.tableSelectedData?.length
})

const switchTab = (val) => {
  tabActive.value = val
  sessionStorage.setItem(tempKey, val.name)
}

const batchDelFn = (val) => {
  useTipModal({
    content: t('dataManagement.buried.batchDeleteTip', [
      selectedQuantity.value,
      tabs[tabActive.value.name].label,
    ]),
    iconType: 3,
    btnSwap: true,
    title: t('dataManagement.batchDelete'),
    // 传事件
    async onSubmit(cb) {
      recordBehavior({
        moduleName: '数据管理',
        submoduleName: '埋点方案',
        operate: '批量删除',
      })
      currentShow.value.deleteRow(cb)
    },
  })
}

defineExpose({
  getData,
})

defineOptions({
  name: 'MetaData',
})
</script>

<style scoped lang="scss">
.nd-metadata-t {
  > div {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 30px;
    height: 48px;
    cursor: pointer;
    color: var(--eas-text-color-light);
    background-color: #f5f5f7;
    &:not(:last-of-type) {
      &:after {
        content: '';
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        right: -1px;
        z-index: 1;
        height: 40%;
        width: 2px;
        background-color: var(--eas-border-color);
      }
    }
  }
  .active {
    background-color: #fff;
    color: var(--el-menu-text-color);
  }
}
</style>
