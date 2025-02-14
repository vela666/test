<template>
  <div class="flex-center nd-kanban-icon-operate">
    <div
      class="flex-center pl30 pr10 flex-between w100-percentage h40 c-pointer nd-kanban-bg nd-kanban-icon-operate"
      @click.stop="emit('handleCollapse', currentData[kanBanDataUniqueKey])">
      <div class="flex-center overflow-hidden w100-percentage">
        <SvgIcon
          class="fz16 mr5 c86919d"
          v-if="currentData.icon"
          :name="currentData.icon" />
        <span class="c545e6e" v-showTips>{{ currentData.name }} </span>
      </div>
      <div class="flex-center position-relative">
        <div
          :class="{
            'no-none': ungroupedFolders.includes(
              currentData[kanBanDataUniqueKey]
            ),
          }"
          v-if="currentData?.children?.length">
          <el-icon>
            <ArrowRight
              v-if="
                activeCollapseId.includes(currentData[kanBanDataUniqueKey])
              " />
            <ArrowDown v-else />
          </el-icon>
        </div>
      </div>
    </div>
  </div>
  <Draggable
    :disabled="true"
    v-bind="dragOptions"
    :item-key="kanBanDataUniqueKey"
    :group="currentData.parentId === 'ownerModule' ? 'created' : 'shared'"
    :list="currentData.children"
    @add="(e) => dashboardAdd(e, currentData)"
    @update="(e) => dashboardUpdate(e, currentData)">
    <template #item="{ element: child }">
      <div
        v-show="!activeCollapseId.includes(currentData[kanBanDataUniqueKey])"
        :id="child[kanBanDataUniqueKey]"
        :key="child[kanBanDataUniqueKey]"
        :data-parentid="child.parentId"
        @click.stop="selectKanban(child, currentData)">
        <div
          class="flex-center pl52 pr10 flex-between w100-percentage h40 c-pointer nd-kanban-bg nd-kanban-icon-operate"
          :class="{
            'nd-kanban-active': activeKanBanId === child[kanBanDataUniqueKey],
          }">
          <span v-showTips>{{ child.name }}</span>
        </div>
      </div>
    </template>
  </Draggable>
</template>

<script setup>
import Draggable from 'vuedraggable'
import { ArrowDown, ArrowRight } from '@element-plus/icons-vue'
import { kanBanDataUniqueKey, ungroupedFolders } from '@/views/see-plate/enum'
import useDragEvent from '@/views/see-plate/components/SideKanBan/components/useDragEvent'
import useMoveEvent from '@/views/see-plate/useMoveEvent'

import useButtonOperation from '@/views/see-plate/components/SideKanBan/components/useButtonOperation'

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
  activeCollapseId: {
    type: Array,
    default() {
      return []
    },
  },
  activeKanBanId: {
    type: [String, Number],
    default: '',
  },
})
const emit = defineEmits(['handleCollapse', 'getData'])

const getData = () => {
  emit('getData')
}

const { dashboardAdd, dashboardUpdate } = useDragEvent(getData)
const { dragOptions } = useMoveEvent()

const { selectKanban } = useButtonOperation(getData)

defineOptions({
  name: 'My',
})
</script>

<style scoped lang="scss"></style>
