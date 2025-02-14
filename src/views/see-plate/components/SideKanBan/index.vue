<template>
  <DefineTemplate in v-slot="{ direction = 'row' }">
    <div class="flex gap8" :style="{ 'flex-direction': direction }">
      <Tooltip :placement="state.isCollapse ? 'right' : 'top'">
        <div
          @click="kanBanManage"
          class="fz32 nd-kanban-btn-active nd-focus-hide">
          <SvgIcon name="kanban-manage1" class="c86919d fz16" />
        </div>
        <template #content>
          {{ t('dashboard.dashboardManagement') }}
        </template>
      </Tooltip>
      <Auth :value="getButtonAuth().authEnum.import">
        <Tooltip :placement="state.isCollapse ? 'right' : 'top'">
          <div
            @click="operateHandler.import"
            class="fz32 nd-kanban-btn-active nd-focus-hide">
            <SvgIcon name="import1" class="c86919d fz16" />
          </div>
          <template #content>
            {{ t('dashboard.importDashboard') }}
          </template>
        </Tooltip>
      </Auth>

      <Auth :value="getButtonAuth().authEnum.export">
        <Tooltip :placement="state.isCollapse ? 'right' : 'top'">
          <div
            @click="operateHandler.export"
            class="fz32 nd-kanban-btn-active nd-focus-hide">
            <SvgIcon name="export3" class="c86919d fz16" />
          </div>
          <template #content>
            {{ t('dashboard.exportDashboard') }}
          </template>
        </Tooltip>
      </Auth>
    </div>
  </DefineTemplate>
  <div
    :class="[state.isCollapse && 'nd-kanban-tree-container-collapse no-min']"
    class="nd-kanban-tree-container"
    v-loading="state.kanBanLoading">
    <div class="nd-kanban-tree-content">
      <div
        :class="{ 'flex-direction-column': state.isCollapse }"
        class="nd-kanban-t-operate gap8">
        <ReuseTemplate v-if="!state.isCollapse" />

        <!--        <div
          @click="kanBanManage"
          class="fz32 nd-kanban-btn-active nd-focus-hide nd-collapse-hid">
          <SvgIcon name="kanban-manage1" class="c86919d fz16" />
        </div>-->
        <Auths :value="getButtonAuth().operateAuth">
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
              <Auth
                v-for="item of getButtonAuth().operateAuth"
                :key="item"
                :value="item">
                <el-dropdown-item @click="operateHandler[item]">{{
                  t(`dashboard.${item.split(':')[1]}`)
                }}</el-dropdown-item>
              </Auth>
            </template>
          </DropDownItemSelection>
        </Auths>
        <ReuseTemplate direction="column" v-if="state.isCollapse" />
      </div>
      <div class="nd-tree-select-type-list nd-collapse-hide">
        <div
          @click="treeSelectChange(item.type)"
          class="m0 nd-tree-select-type"
          :class="
            item.type === state.displaySelectType
              ? 'nd-tree-type-select-active'
              : ''
          "
          v-for="item of displaySelectTypeList"
          :key="item.type">
          {{ item.label }}
        </div>
      </div>
      <CommonInput
        v-model="state.filterKanBanVal"
        class="nd-collapse-hide pl10 pr10" />

      <div
        class="h100-percentage nd-collapse-hide overflow-hidden"
        v-loading="seePlateStore.loading">
        <div
          class="nd-tree-list-container"
          v-if="
            state.displaySelectType !== 3 &&
            filterKanBanList.some((item) => item.children.length)
          ">
          <div
            v-for="item of filterKanBanList"
            :key="item[kanBanDataUniqueKey]"
            class="nd-kanban-tree-list">
            <div
              class="flex-center flex-between nd-kanban-bg c-pointer h40 pl10 pr10"
              v-if="item[kanBanDataUniqueKey] !== 'spaceModule'"
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
              @update="(e) => dragFolderSpaceUpdate(e, item)">
              <template #item="{ element, index }">
                <div
                  :id="element[kanBanDataUniqueKey]"
                  :key="index"
                  :data-parentid="element.parentId"
                  v-show="
                    !state.activeCollapseId.includes(item[kanBanDataUniqueKey])
                  ">
                  <!-- 空间 -->
                  <Space
                    v-if="item[kanBanDataUniqueKey] === 'spaceModule'"
                    :activeCollapseId="state.activeCollapseId"
                    :currentData="element"
                    @getData="getData"
                    :activeKanBanId="state.activeKanBanId"
                    @handleCollapse="handleCollapse" />
                  <!-- 我的 -->
                  <My
                    @getData="getData"
                    :activeKanBanId="state.activeKanBanId"
                    :activeCollapseId="state.activeCollapseId"
                    :currentData="element"
                    @handleCollapse="handleCollapse"
                    v-else />
                </div>
              </template>
            </Draggable>
          </div>
        </div>

        <div
          class="nd-tree-list-container"
          v-else-if="state.displaySelectType === 3 && filterKanBanList.length">
          <div
            v-for="item of filterKanBanList"
            :key="item.businessId"
            :class="{
              'nd-kanban-active': route.query.kanBanId === item.businessId,
            }"
            @click.stop="
              selectKanban({
                ...item,
                topLevelId: topLevelMarkMap[item.dataOrigin],
              })
            "
            class="flex-center pl10 pr10 flex-between w100-percentage h40 c-pointer nd-kanban-bg nd-kanban-icon-operate">
            <span v-showTips>{{ item.name }}</span>

            <DropDownItemSelection :offset="15" placement="right">
              <span class="nd-more-icon" @click.stop>
                <SvgIcon name="kanban-more1" />
              </span>
              <template #content>
                <Auth :value="getButtonAuth().authEnum.addDash">
                  <el-dropdown-item
                    @click="
                      handleCopy({
                        ...item,
                        topLevelId: topLevelMarkMap[item.dataOrigin],
                      })
                    "
                    >{{ t('btn.copy') }}</el-dropdown-item
                  >
                </Auth>
                <el-dropdown-item
                  @click="
                    handleCollect({
                      ...item,
                      topLevelId: topLevelMarkMap[item.dataOrigin],
                    })
                  "
                  >{{ t('common.cancelFavorite') }}</el-dropdown-item
                >
              </template>
            </DropDownItemSelection>
          </div>
        </div>

        <div v-else class="h100-percentage flex-center flex-level-center">
          <Empty :desc="t('common.noData')" />
        </div>
      </div>
    </div>
    <div class="flex flex-justify-content-end nd-collapse-operate">
      <SvgIcon
        @click="updKanBanTreeCollapse"
        class="c-pointer fz18 elem-hover c86919d"
        :name="`menu-${state.isCollapse ? 'open' : 'close'}`" />
    </div>
  </div>

  <KanBanManage @getData="getData" ref="kanBanManageRef" />
  <AddKanBan @getData="getData" ref="addKanBanRef" />
  <AddFolder @getData="getData" ref="addFolderRef" />
  <AddOrEditSpace @getData="getData" ref="addOrEditSpaceRef" />
  <ExportKanBan ref="exportKanBanRef" />
  <ImportKanBan @getData="getData" ref="importKanBanRef" />
  <CopyKanban @getData="getData" ref="copyKanbanRef" />
</template>

<script setup>
import { computed, reactive, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createReusableTemplate } from '@vueuse/core'
import Draggable from 'vuedraggable'
import { ArrowDown, ArrowRight } from '@element-plus/icons-vue'
import Space from './components/Space/index.vue'
import My from './components/My/index.vue'

import KanBanManage from './components/KanBanManage.vue'
import AddKanBan from './components/AddKanBan.vue'
import AddFolder from './components/AddFolder.vue'
import AddOrEditSpace from './components/AddOrEditSpace/index.vue'
import ExportKanBan from './components/ExportKanBan.vue'
import ImportKanBan from './components/ImportKanBan.vue'
import CopyKanban from './components/CopyKanban.vue'

import { mapKanBanList } from '@/views/see-plate/utils'
import useDragEvent from './components/useDragEvent'
import useMoveEvent from '@/views/see-plate/useMoveEvent'
import { customDataSort, filterTree, flattenTree } from '@/utils/dataProcessing'
import useSeePlateStore from '@/store/modules/see-plate'
import {
  displaySelectTypeList,
  getButtonAuth,
  kanBanDataUniqueKey,
  kanbanSelectKey,
  kanbanType,
  topLevelIdMap,
  topLevelIds,
} from '@/views/see-plate/enum'
import useButtonOperation from './components/useButtonOperation.js'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const [DefineTemplate, ReuseTemplate] = createReusableTemplate()
const seePlateStore = useSeePlateStore()

const emit = defineEmits(['getInfo', 'addKanbanFn'])
const initVal = () => {
  return {
    activeKanBanId: '',
    displaySelectType: displaySelectTypeList[0].type,
    isCollapse: JSON.parse(sessionStorage.getItem('kanBanCollapse') || 'false'),
    filterKanBanVal: '',
    // 不展开看板、共享、空间标识
    activeCollapseId: [],
    kanBanLoading: false,
  }
}
const state = reactive(initVal())
const addKanBanRef = shallowRef(null)
const addFolderRef = shallowRef(null)
const kanBanManageRef = shallowRef(null)
const exportKanBanRef = shallowRef(null)
const importKanBanRef = shallowRef(null)
const addOrEditSpaceRef = shallowRef(null)

const optionalList = computed(() => {
  return mapKanBanList(seePlateStore.leftCompleteData)
})

const optionalListKeyValFlat = computed(() => {
  return flattenTree({
    // 重新排序
    data: customDataSort(optionalList.value, topLevelIds, kanBanDataUniqueKey),
    combinedFormat: true,
    uniqueKey: kanBanDataUniqueKey,
  })
})

const kanBanManage = () => {
  kanBanManageRef.value.open()
}

const operateHandler = {
  // 新建看板
  'dashboard:addDash'() {
    addKanBanRef.value.open()
  },
  // 新建文件夹
  'dashboard:addFile'() {
    addFolderRef.value.open()
  },
  // 新建空间
  'dashboard:addSpace'() {
    addOrEditSpaceRef.value.open()
  },
  // 导出
  // 'dashboard:export'() {
  export() {
    exportKanBanRef.value.open()
  },
  // 导入
  // 'dashboard:import'() {
  import() {
    importKanBanRef.value.open()
  },
}

const treeSelectChange = (val) => {
  state.filterKanBanVal = ''
  state.displaySelectType = val
}
const updKanBanTreeCollapse = () => {
  state.isCollapse = !state.isCollapse
  sessionStorage.setItem('kanBanCollapse', state.isCollapse)
}

// 根据看板类型过滤数据
const filterKanBanList = computed(() => {
  let typeData =
    state.displaySelectType === 3
      ? seePlateStore.leftCompleteData.collectModule
      : optionalList.value.filter((item) => {
          if (state.displaySelectType === 1) {
            return item[kanBanDataUniqueKey] === 'spaceModule'
          }
          if (state.displaySelectType === 2) {
            return kanbanType.spaceModule.siblingNode.includes(
              item[kanBanDataUniqueKey]
            )
          }
        })

  if (state.filterKanBanVal.trim()) {
    // 收藏
    /* if (state.displaySelectType === 3) {
      return typeData.filter((node) => {
        return node.name
          .toLowerCase()
          .includes(state.filterKanBanVal.toLowerCase())
      })
    }*/
    return filterTree(typeData, (node) => {
      return node.name
        .toLowerCase()
        .includes(state.filterKanBanVal.toLowerCase())
    })
  }
  return typeData || []
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
  let id = route.query.kanBanId || localStorage.getItem(kanbanSelectKey)
  // 初始化
  if (reset) {
    if (seePlateStore.navigationExpand) {
      state.activeCollapseId = []
    } else {
      state.activeCollapseId = Object.keys(
        optionalListKeyValFlat.value.keyVal
      ).filter((item) => !topLevelIds.includes(item))
    }
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
      seePlateStore.resetSelectedInfo()
      localStorage.removeItem(kanbanSelectKey)
    }
  }
  if (dashboard && reset) {
    // 等于空间
    state.displaySelectType = dashboard.topLevelId === 'spaceModule' ? 1 : 2
  }
}

const getData = async (reset = false, req = false) => {
  state.kanBanLoading = true
  await seePlateStore.getLeftKanBanInfo().finally((_) => {
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

const { dragFolderSpaceUpdate } = useDragEvent(getData)
const { dragOptions, moveFolder } = useMoveEvent()

const { copyKanbanRef, handleCopy, selectKanban, handleCollect } =
  useButtonOperation(getData)

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
@import 'index.scss';
</style>
