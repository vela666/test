<template>
  <div
    v-loading="state.kanBanLoading"
    class="nd-kanban-tree-container no-min no-max">
    <div class="nd-kanban-tree-content">
      <div class="nd-tree-select-type-list mt10">
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
        :desc="$t('btn.search')"
        v-model="state.filterKanBanVal"
        class="pl10 pr10" />

      <div
        class="h100-percentage overflow-hidden"
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
              :disabled="true"
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
          </div>
        </div>

        <div v-else class="h100-percentage flex-center flex-level-center">
          <Empty :desc="t('common.noData')" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Draggable from 'vuedraggable'
import { ArrowDown, ArrowRight } from '@element-plus/icons-vue'
import Space from './components/Space/index.vue'
import My from './components/My/index.vue'
import { mapKanBanList } from '@/views/see-plate/utils'
import useDragEvent from '@/views/see-plate/components/SideKanBan/components/useDragEvent'
import useMoveEvent from '@/views/see-plate/useMoveEvent'
import { customDataSort, filterTree, flattenTree } from '@/utils/dataProcessing'
import useSeePlateStore from '@/store/modules/see-plate'
import eventBus from '@/plugins/event-bus.js'

import {
  displaySelectTypeList,
  kanBanDataUniqueKey,
  kanbanSelectKey,
  kanbanType,
  topLevelIdMap,
  topLevelIds,
  topLevelMarkMap,
} from '@/views/see-plate/enum'
import useButtonOperation from '@/views/see-plate/components/SideKanBan/components/useButtonOperation'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const seePlateStore = useSeePlateStore()

const initVal = () => {
  return {
    activeKanBanId: '',
    displaySelectType: displaySelectTypeList[0].type,
    filterKanBanVal: '',
    // 不展开看板、共享、空间标识
    activeCollapseId: [],
    kanBanLoading: false,
  }
}
const state = reactive(initVal())

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

const treeSelectChange = (val) => {
  state.filterKanBanVal = ''
  state.displaySelectType = val
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
    req && eventBus.emit('getInfo')
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

const { selectKanban } = useButtonOperation(getData)

eventBus.on('execLoading', (bool = true) => {
  state.kanBanLoading = bool
})

defineOptions({
  name: 'SideKanBan',
})
</script>

<style scoped lang="scss">
@import '@/views/see-plate/components/SideKanBan/index.scss';
.nd-kanban-tree-container {
  flex: 1;
  overflow: hidden;
}

.nd-kanban-tree-container {
  height: 100%;
}
</style>
