<template>
  <div
    :class="[state.isCollapse && 'nd-kanban-tree-container-collapse no-min']"
    class="nd-kanban-tree-container"
    v-loading="state.kanBanLoading">
    <div class="nd-kanban-tree-content">
      <div
        :class="{ 'flex-direction-column': state.isCollapse }"
        class="nd-kanban-t-operate gap8">
        <Auths :value="operateAuth">
          <DropDownItemSelection placement="right">
            <el-button
              type="primary"
              :class="[
                !state.isCollapse && 'skip',
                'nd-kanban-create1 m0 nd-focus-hide',
              ]">
              <SvgIcon
                name="kanban-create1"
                :class="[!state.isCollapse && 'mr5', 'fz16']" />
              {{ state.isCollapse ? '' : t('dashboard.create') }}
            </el-button>
            <template #content>
              <Auth v-for="item of operateAuth" :key="item" :value="item">
                <el-dropdown-item @click="operateHandler[item]">{{
                  t(`dashboard.${item.split(':')[1]}`)
                }}</el-dropdown-item>
              </Auth>
            </template>
          </DropDownItemSelection>
        </Auths>
      </div>

      <CommonInput
        v-model="state.filterKanBanVal"
        class="nd-collapse-hide pl10 pr10" />

      <div
        class="h100-percentage nd-collapse-hide overflow-hidden"
        v-loading="unifiedPanelStore.loading">
        <!--    v-if="filterKanBanList.some((item) => item.children.length)">     -->
        <div class="nd-tree-list-container">
          <div
            v-for="item of filterKanBanList"
            :key="item[kanBanDataUniqueKey]"
            class="nd-kanban-tree-list">
            <div
              class="flex-center flex-between nd-kanban-bg c-pointer h40 pl10 pr10"
              @click="handleCollapse(item[kanBanDataUniqueKey])">
              <div class="txt-bold flex-center c545e6e overflow-hidden">
                <SvgIcon class="fz18 mr5" v-if="item.icon" :name="item.icon" />
                <span v-showTips>{{ item.name }} </span>
              </div>
              <el-icon class="c86919d ml5">
                <ArrowRight
                  v-if="
                    state.activeCollapseId.includes(item[kanBanDataUniqueKey])
                  " />
                <ArrowDown v-else />
              </el-icon>
            </div>
            <Draggable
              :list="item.children"
              :move="moveFolder"
              :itemKey="kanBanDataUniqueKey"
              v-bind="dragOptions"
              :group="item.id"
              @update="(e) => dragDashboardUpdate(e, item)">
              <template #item="{ element, index }">
                <div
                  :id="element[kanBanDataUniqueKey]"
                  :key="index"
                  :data-parentid="element.parentId"
                  v-show="
                    !state.activeCollapseId.includes(item[kanBanDataUniqueKey])
                  ">
                  <My
                    @getData="getData"
                    @handleCollapse="handleCollapse"
                    :activeKanBanId="state.activeKanBanId"
                    :activeCollapseId="state.activeCollapseId"
                    :currentData="element" />
                </div>
              </template>
            </Draggable>
          </div>
        </div>
        <!--        <div v-else class="h100-percentage flex-center flex-level-center">
          <Empty desc="暂无数据" />
        </div>-->
      </div>
    </div>
    <div class="flex flex-justify-content-end nd-collapse-operate">
      <SvgIcon
        @click="updKanBanTreeCollapse"
        class="c-pointer fz18 elem-hover c86919d"
        :name="`menu-${state.isCollapse ? 'open' : 'close'}`" />
    </div>
  </div>

  <AddKanBan @getData="getData" ref="addKanBanRef" />
  <AddFolder @getData="getData" ref="addFolderRef" />
  <CopyKanban @getData="getData" ref="copyKanbanRef" />
</template>

<script setup>
import { computed, reactive, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Draggable from 'vuedraggable'
import { ArrowDown, ArrowRight } from '@element-plus/icons-vue'
import My from './components/My/index.vue'

import AddKanBan from './components/AddKanBan.vue'
import AddFolder from './components/AddFolder.vue'
import CopyKanban from './components/CopyKanban.vue'

import { mapKanBanList } from '@/views/see-plate/utils'
import useDragEvent from './components/useDragEvent'
import useMoveEvent from '@/views/see-plate/useMoveEvent'
import { customDataSort, filterTree, flattenTree } from '@/utils/dataProcessing'
import useUnifiedPanelStore from '@/store/modules/unified-panel.js'
import {
  authEnum,
  operateAuth,
  kanbanSelectKey,
} from '@/views/unified-panel/enum'
import {
  kanBanDataUniqueKey,
  kanbanType,
  topLevelIdMap,
  topLevelIds,
} from '@/views/see-plate/enum'
import useButtonOperation from './components/useButtonOperation.js'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const router = useRouter()
const unifiedPanelStore = useUnifiedPanelStore()
const { t } = useI18n()

const emit = defineEmits(['getInfo', 'addKanbanFn'])
const initVal = () => {
  return {
    activeKanBanId: '',
    isCollapse: JSON.parse(
      sessionStorage.getItem('unifiedPanelCollapse') || 'false'
    ),
    filterKanBanVal: '',
    // 不展开看板、共享、空间标识
    activeCollapseId: [],
    kanBanLoading: false,
  }
}
const state = reactive(initVal())
const addKanBanRef = shallowRef(null)
const addFolderRef = shallowRef(null)

const operateHandler = {
  // 新建看板
  'unified-panel:addDash'() {
    addKanBanRef.value.open()
  },
  // 新建文件夹
  'unified-panel:addFile'() {
    addFolderRef.value.open()
  },
}

const optionalList = computed(() => {
  return mapKanBanList(unifiedPanelStore.leftCompleteData)
})

const optionalListKeyValFlat = computed(() => {
  return flattenTree({
    // 重新排序
    data: customDataSort(optionalList.value, topLevelIds, kanBanDataUniqueKey),
    combinedFormat: true,
    uniqueKey: kanBanDataUniqueKey,
  })
})

const updKanBanTreeCollapse = () => {
  state.isCollapse = !state.isCollapse
  sessionStorage.setItem('kanBanCollapse', state.isCollapse)
}

// 根据看板类型过滤数据
const filterKanBanList = computed(() => {
  /* let typeData = optionalList.value.filter((item) => {
    return kanbanType.spaceModule.siblingNode.includes(
      item[kanBanDataUniqueKey]
    )
  })*/

  if (state.filterKanBanVal.trim()) {
    return filterTree(
      { data: optionalList.value, hasTopLevel: true },
      (node) => {
        return node.name
          .toLowerCase()
          .includes(state.filterKanBanVal.toLowerCase())
      }
    )
  }
  return optionalList.value || []
})

const handleCollapse = (id) => {
  const flag = state.activeCollapseId.some((item) => item === id)

  if (flag) {
    state.activeCollapseId.splice(state.activeCollapseId.indexOf(id), 1)
  } else {
    state.activeCollapseId.push(id)
  }
}

const handleSelectedKanban = (reset = false, req = true) => {
  let id = route.query.kanBanId
  // 初始化
  if (reset) {
    const kanbanId = localStorage.getItem(kanbanSelectKey)
    if (kanbanId) {
      id = kanbanId
    }
  }
  let dashboard = optionalListKeyValFlat.value.keyVal[id]
  // 看板存在
  if (dashboard?.type === 'dashboard') {
    state.activeKanBanId = id
    // 展开对应的父级
    state.activeCollapseId = state.activeCollapseId.filter(
      (item) => !dashboard.parentIds.includes(item)
    )
    localStorage.setItem(kanbanSelectKey, id)
    // 从其他页面进入时执行
    // if (!route.query.kanBanId) {
    router.replace({
      name: route.name,
      query: {
        kanBanId: state.activeKanBanId,
        moduleType: topLevelIdMap[dashboard.topLevelId],
      },
    })
    // }
    req && emit('getInfo')
  } else {
    dashboard = optionalListKeyValFlat.value.list.find(
      (item) => item.type === 'dashboard'
    )
    if (dashboard) {
      router.replace({
        name: route.name,
        query: {
          kanBanId: dashboard[kanBanDataUniqueKey],
          moduleType: topLevelIdMap[dashboard.topLevelId],
        },
      })
    } else {
      router.replace({
        name: route.name,
      })
      unifiedPanelStore.resetSelectedInfo()
      localStorage.removeItem(kanbanSelectKey)
    }
  }
}

const getData = async (reset = false, req = false) => {
  state.kanBanLoading = true
  await unifiedPanelStore.getLeftKanBanInfo().finally((_) => {
    state.kanBanLoading = false
  })

  // 没有看板则打开新建窗口
  if (
    reset &&
    !optionalListKeyValFlat.value.list.filter(
      (item) => item.type === 'dashboard'
    ).length
  ) {
    emit('addKanbanFn', true)
  }
  handleSelectedKanban(reset, req)
}

getData(true, true)

watch(
  () => route.query.kanBanId,
  () => {
    handleSelectedKanban(false)
  }
)

// 不能让用户篡改 url上的这个参数 有些地方再取该值
watch(
  () => route.query.moduleType,
  () => {
    handleSelectedKanban(false, false)
  }
)

const { dragDashboardUpdate } = useDragEvent(getData)
const { dragOptions, moveFolder } = useMoveEvent()

const { copyKanbanRef } = useButtonOperation(getData)

defineExpose({
  getData,
  execLoading(bool = true) {
    state.kanBanLoading = bool
  },
})
defineOptions({
  name: 'SideKanBan',
})
</script>

<style scoped lang="scss">
@import '@/views/see-plate/components/SideKanBan/index.scss';
</style>
