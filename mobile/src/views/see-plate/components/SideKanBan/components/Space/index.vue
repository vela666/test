<template>
  <div
    @click.stop="emit('handleCollapse', currentData[kanBanDataUniqueKey])"
    class="flex-center pl10 pr10 flex-between w100-percentage h40 c-pointer nd-kanban-bg nd-kanban-icon-operate">
    <div class="flex-center txt-bold overflow-hidden">
      <SvgIcon
        class="fz18 mr5"
        v-if="currentData.icon"
        :name="currentData.icon" />
      <span v-showTips>{{ currentData.name }}</span>
    </div>
    <div class="flex-center ml5">
      <el-icon>
        <ArrowRight
          v-if="
            activeCollapseId.includes(currentData[kanBanDataUniqueKey]) ||
            !currentData.children.length
          " />
        <ArrowDown v-else />
      </el-icon>
    </div>
  </div>
  <Draggable
    :disabled="true"
    v-bind="dragOptions"
    :list="currentData.children"
    :item-key="kanBanDataUniqueKey"
    :group="`space-${currentData[kanBanDataUniqueKey]}`"
    :move="moveSpace"
    @add="(e) => dragSpaceAdd(e, currentData)"
    @update="(e) => dragSpaceUpdate(e, currentData)">
    <template #item="{ element: space }">
      <div
        v-show="!activeCollapseId.includes(currentData[kanBanDataUniqueKey])"
        :id="space[kanBanDataUniqueKey]"
        @click.stop="selectKanban(space, currentData)"
        :data-parentid="space.parentId">
        <template v-if="space.folderOrNot">
          <div
            @click.stop="emit('handleCollapse', space[kanBanDataUniqueKey])"
            class="h40 flex-center flex-between pl30 pr10 c-pointer nd-kanban-bg nd-kanban-icon-operate">
            <div class="flex-center overflow-hidden">
              <SvgIcon
                class="fz18 mr5 c86919d"
                v-if="space.icon"
                :name="space.icon" />
              <span v-showTips :title="space.creator">{{ space.name }}</span>
            </div>
            <div class="flex-center">
              <el-icon v-if="space.children.length">
                <ArrowRight
                  v-if="
                    activeCollapseId.includes(space[kanBanDataUniqueKey])
                  " />
                <ArrowDown v-else />
              </el-icon>
            </div>
          </div>
          <Draggable
            :disabled="true"
            v-bind="dragOptions"
            :list="space.children"
            :item-key="kanBanDataUniqueKey"
            :group="`space-${currentData[kanBanDataUniqueKey]}`"
            :move="moveSpaceDashboard"
            @update="(e) => dragSpaceDashboardUpdate(e, space)"
            @add="(e) => dragSpaceDashboardAdd(e, space)">
            <template #item="{ element: child }">
              <div
                v-show="!activeCollapseId.includes(space[kanBanDataUniqueKey])"
                :id="child[kanBanDataUniqueKey]"
                :key="child[kanBanDataUniqueKey]"
                @click.stop="selectKanban(child, space)"
                :data-parentid="child.parentId">
                <div
                  class="h40 pl52 flex-center flex-between pr10 c-pointer nd-kanban-bg nd-kanban-icon-operate"
                  :class="{
                    'nd-kanban-active':
                      activeKanBanId === child[kanBanDataUniqueKey],
                  }">
                  <span
                    v-showTips
                    class="w100-percentage"
                    :title="child.creator"
                    >{{ child.name }}</span
                  >
                </div>
              </div>
            </template>
          </Draggable>
        </template>

        <div
          v-else
          class="h40 pl30 flex-center flex-between pr10 c-pointer nd-kanban-bg nd-kanban-icon-operate"
          :class="{
            'nd-kanban-active': activeKanBanId === space[kanBanDataUniqueKey],
          }">
          <span class="w100-percentage" v-showTips :title="space.creator">{{
            space.name
          }}</span>
        </div>
      </div>
    </template>
  </Draggable>
</template>

<script setup>
import { ref } from 'vue'
import Draggable from 'vuedraggable'
import { ArrowDown, ArrowRight } from '@element-plus/icons-vue'
import useDragEvent from '@/views/see-plate/components/SideKanBan/components/useDragEvent'
import useMoveEvent from '@/views/see-plate/useMoveEvent'
import { kanBanDataUniqueKey } from '@/views/see-plate/enum'
import useButtonOperation from '@/views/see-plate/components/SideKanBan/components/useButtonOperation'

import { useI18n } from 'vue-i18n'

const props = defineProps({
  offset: {
    type: [String, Number],
    default: 15,
  },
  currentData: {
    type: Object,
    default() {
      return {}
    },
  },
  activeKanBanId: {
    type: [String, Number],
    default: '',
  },
  activeCollapseId: {
    type: Array,
    default() {
      return []
    },
  },
})

const emit = defineEmits(['handleCollapse', 'getData'])

const { t } = useI18n()

const addOrEditSpaceRef = ref(null)

const getData = () => {
  emit('getData')
}

const {
  dragSpaceAdd,
  dragSpaceUpdate,
  dragSpaceDashboardAdd,
  dragSpaceDashboardUpdate,
} = useDragEvent(getData)

const { dragOptions, moveSpace, moveSpaceDashboard } = useMoveEvent()

const { selectKanban } = useButtonOperation(getData)

// 项目空间详情
const handleEditSpace = (space) => {
  addOrEditSpaceRef.value.open(space)
}

defineOptions({
  name: 'Space',
})
</script>

<style scoped lang="scss"></style>
