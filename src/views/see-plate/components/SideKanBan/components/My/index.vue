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
          class="nd-arrow-icon"
          v-if="currentData?.children?.length">
          <el-icon>
            <ArrowRight
              v-if="
                activeCollapseId.includes(currentData[kanBanDataUniqueKey])
              " />
            <ArrowDown v-else />
          </el-icon>
        </div>

        <DropDownItemSelection
          v-if="!ungroupedFolders.includes(currentData[kanBanDataUniqueKey])"
          :offset="offset"
          placement="right">
          <span class="nd-more-icon" @click.stop>
            <SvgIcon name="kanban-more1" />
          </span>
          <template #content>
            <el-dropdown-item @click="handleRename(currentData)"
              >{{ t('btn.rename') }}
            </el-dropdown-item>
            <el-dropdown-item
              @click="handleMove(currentData)"
              v-if="currentData.parentId !== 'shareModule'"
              >{{ t('btn.moveTo') }}
            </el-dropdown-item>
            <el-dropdown-item @click="handleDelete(currentData)" command="del"
              >{{ t('btn.delete') }}
            </el-dropdown-item>
          </template>
        </DropDownItemSelection>
      </div>
    </div>
  </div>
  <Draggable
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
          <DropDownItemSelection
            v-if="
              currentData.parentId !== 'shareModule' ||
              getButtonAuth().authEnum.addDash
            "
            :offset="offset"
            placement="right">
            <span class="nd-more-icon" @click.stop>
              <SvgIcon name="kanban-more1" />
            </span>
            <template #content>
              <template v-if="currentData.parentId !== 'shareModule'">
                <el-dropdown-item @click="handleRename(child)">
                  {{ t('btn.rename') }}</el-dropdown-item
                >
                <el-dropdown-item @click="handleMove(child)">
                  {{ t('btn.moveTo') }}</el-dropdown-item
                >
              </template>
              <Auth :value="getButtonAuth().authEnum.addDash">
                <el-dropdown-item @click="handleCopy(child)">
                  {{ t('btn.copy') }}</el-dropdown-item
                >
              </Auth>
              <el-dropdown-item @click="handleCollect(child)">
                {{
                  t(`common.${child.starOrNot ? 'cancelFavorite' : 'favorite'}`)
                }}
              </el-dropdown-item>
              <el-dropdown-item
                @click="handleDelete(child)"
                v-if="currentData.parentId !== 'shareModule'">
                {{ t('btn.delete') }}</el-dropdown-item
              >
            </template>
          </DropDownItemSelection>
        </div>
      </div>
    </template>
  </Draggable>
  <EditFolderOrKanban @getData="getData" ref="editFolderOrKanbanRef" />
  <OperateVerifyDialog btnSwap ref="operateVerifyDialogRef" />
  <CopyKanban @getData="getData" ref="copyKanbanRef" />
  <MoveFolderOrKanban @getData="getData" ref="movefolderorkanbanRef" />
</template>

<script setup>
import Draggable from 'vuedraggable'
import { ArrowDown, ArrowRight } from '@element-plus/icons-vue'
import {
  kanBanDataUniqueKey,
  ungroupedFolders,
  getButtonAuth,
} from '@/views/see-plate/enum'
import useDragEvent from '../useDragEvent'
import useMoveEvent from '@/views/see-plate/useMoveEvent'
import EditFolderOrKanban from '../EditFolderOrKanban.vue'
import MoveFolderOrKanban from '../MoveFolderOrKanban.vue'
import CopyKanban from '../CopyKanban.vue'

import useButtonOperation from '../useButtonOperation'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
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

const {
  copyKanbanRef,
  editFolderOrKanbanRef,
  movefolderorkanbanRef,
  operateVerifyDialogRef,
  handleMove,
  handleCopy,
  handleRename,
  handleDelete,
  selectKanban,
  handleCollect,
} = useButtonOperation(getData)

defineOptions({
  name: 'My',
})
</script>

<style scoped lang="scss"></style>
