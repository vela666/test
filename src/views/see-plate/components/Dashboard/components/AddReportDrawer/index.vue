<template>
  <CommonDrawer
    @submit="submit"
    @close="close"
    :loading="state.operateLoading"
    v-model="state.visible"
    :title="t('dashboard.addExistingReport')"
    size="900px">
    <div class="nd-report-drawer-container">
      <div class="nd-report-l">
        <div class="flex-center flex-between">
          <i18n-t
            keypath="dashboard.reportsAndNotesAdded"
            tag="div"
            class="c545e6e">
            <template #report>
              <span class="c5473e8">{{ reportAndNoteLen.report }}</span>
            </template>
            <template #note>
              <span class="c5473e8">{{ reportAndNoteLen.note }}</span>
            </template>
          </i18n-t>

          <div>
            <el-button
              v-show="!!(reportAndNoteLen.report + reportAndNoteLen.note)"
              @click="clearSelectedList"
              type="primary"
              text
              >{{ t('btn.clearAction') }}
            </el-button>
          </div>
        </div>
        <div class="nd-grid-drawer-container">
          <GridLayout
            margin="5"
            cellHeight="40px"
            parentCls=".nd-grid-drawer-container"
            boxCls="nd-grid-drawer-content"
            :minRow="4"
            noResize
            ref="gridLayoutRef"
            :list="seePlateStore.reportAndNoteList"
            v-model="seePlateStore.addSelectedReporNoteList">
            <template #default="{ item, removeItem }">
              <div
                :style="
                  item.backgroundColor &&
                  `background-color:${noteBgColorListMap[item.backgroundColor]}`
                "
                v-if="item"
                class="flex h100-percentage nd-grid-item">
                <div
                  :class="{ 'flex-column': item.minH !== 1 }"
                  class="w100-percentage overflow-hidden flex pl10 pr10 flex-level-center">
                  <div class="flex-center w100-percentage flex-between">
                    <span
                      :title="item.reportName"
                      class="c545e6e mr10 ellipsis">
                      {{ item.reportName }}
                    </span>
                    <div class="nd-operate">
                      <Tooltip v-if="item.type === 1">
                        <el-button
                          @click="
                            addOrEditNote({
                              ...item,
                              isLeft: true,
                            })
                          "
                          text
                          class="c86919d elem-hover">
                          <SvgIcon name="edit1" />
                        </el-button>
                        <template #content>{{ t('btn.edit') }}</template>
                      </Tooltip>
                      <Tooltip>
                        <el-button
                          @click="delItem(item, removeItem)"
                          text
                          class="c86919d elem-hover">
                          <SvgIcon name="delete1" />
                        </el-button>
                        <template #content>{{ t('common.remove') }}</template>
                      </Tooltip>
                    </div>
                  </div>
                  <div v-if="item.minH !== 1" class="fz12 c86919d flex-column">
                    <span v-showTips>{{
                      reportTypeListMap[item.reportType]
                    }}</span>
                    <span v-showTips>
                      {{ t('common.creator') }}：{{ item.creator }}</span
                    >
                  </div>
                </div>
              </div>
            </template>
          </GridLayout>
        </div>
      </div>
      <div class="nd-report-r" v-loading="state.loading">
        <el-tabs
          @tab-change="tabChange"
          v-model="state.tabActive"
          class="nd-tabs-container skip w100-percentage flex overflow-hidden">
          <el-tab-pane
            :label="t('dashboard.report')"
            name="1"
            class="nd-tab-pane">
            <div class="flex-column gap16">
              <CommonInput
                @input="getReportList()"
                v-model="state.reportFilter.reportName"
                :placeholder="t('dashboard.searchReport')"
                class="w100-percentage"
                clearable />
              <el-select
                @change="getReportList()"
                filterable
                v-model="state.reportFilter.dataType">
                <el-option
                  v-for="item of dataTypeList"
                  :key="item.type"
                  :value="item.type"
                  :label="item.label" />
              </el-select>
              <div class="flex gap20">
                <el-select
                  @change="getReportList()"
                  v-model="state.reportFilter.reportType"
                  clearable>
                  <el-option
                    v-for="item of reportTypeList.filter(
                      (val) => val.type !== 5
                    )"
                    :key="item.type"
                    :value="item.type"
                    :label="item.label" />
                </el-select>
                <el-select
                  @change="getReportList()"
                  v-model="state.reportFilter.labelNameList"
                  :placeholder="t('dashboard.noteFilter')"
                  filterable
                  clearable
                  :reserve-keyword="false"
                  collapse-tags
                  collapse-tags-tooltip
                  multiple>
                  <el-option
                    v-for="(item, index) of seePlateStore.labelList"
                    :key="index"
                    :label="item"
                    :value="item" />
                </el-select>
              </div>
            </div>
            <DynamicScroller
              v-if="filterReportList.length"
              :items="filterReportList"
              :min-item-size="32"
              emitUpdate
              @update="tabChange"
              key-field="businessId"
              class="dashboard-drag-in nd-list mt20">
              <template v-slot="{ item, index, active }">
                <DynamicScrollerItem
                  :item="item"
                  :active="active"
                  :style="`height:${index !== filterReportList.length - 1 ? 48 : 32}px`"
                  :size-dependencies="[item.businessId]"
                  :data-index="index">
                  <div
                    :class="[
                      reportAndNoteLen.report < 30 && 'dashboard-drag-in-item',
                      'nd-list-item',
                    ]"
                    :key="`${item.mark}&${reportAndNoteLen.report < 30}`"
                    :gs-id="item.mark"
                    :id="item.mark"
                    gs-w="6"
                    gs-h="2">
                    <div
                      :class="{ 'c-move': reportAndNoteLen.report < 30 }"
                      class="drag-handle">
                      <span class="c86919d mr20">{{
                        reportTypeListMap[item.reportType]
                      }}</span>
                      <Tooltip>
                        <span
                          class="nd-list-item-label w100-percentage ellipsis">
                          {{ item.reportName }}</span
                        >
                        <template #content>
                          <div>
                            {{ t('dashboard.reportName') }} ：{{
                              item.reportName
                            }}
                          </div>
                          <div>
                            {{ t('common.creator') }}：{{ item.creator }}
                          </div>
                        </template>
                      </Tooltip>
                    </div>
                    <SvgIcon
                      @click="addSelectedListItem(item)"
                      name="kanban-create1" />
                  </div>
                </DynamicScrollerItem>
              </template>
            </DynamicScroller>

            <div v-else class="h100-percentage flex-center flex-level-center">
              <Empty :desc="t('dashboard.noReports')" />
            </div>
          </el-tab-pane>
          <el-tab-pane
            :label="t('dashboard.note')"
            name="2"
            class="nd-tab-pane">
            <div class="flex-column gap16">
              <CommonInput
                @input="tabChange"
                v-model="state.noteFilter.noteName"
                :placeholder="t('dashboard.searchNote')"
                class="w100-percentage"
                clearable />
            </div>
            <DynamicScroller
              v-if="filterNoteList.length"
              :items="filterNoteList"
              :min-item-size="32"
              emitUpdate
              @update="tabChange"
              key-field="businessId"
              class="dashboard-drag-in nd-list mt20">
              <template v-slot="{ item, index, active }">
                <DynamicScrollerItem
                  :item="item"
                  :active="active"
                  :style="`height:${index !== filterNoteList.length - 1 ? 48 : 32}px`"
                  :size-dependencies="[item.businessId]"
                  :data-index="index">
                  <div
                    :class="[
                      reportAndNoteLen.note < 10 && 'dashboard-drag-in-item',
                      'nd-list-item',
                    ]"
                    :key="`${item.mark}&${reportAndNoteLen.note < 10}`"
                    :id="item.mark"
                    :gs-id="item.mark"
                    gs-w="12"
                    gs-h="1">
                    <div
                      :class="{ 'c-move': reportAndNoteLen.note < 10 }"
                      class="drag-handle">
                      <Tooltip>
                        <span
                          class="nd-list-item-label w100-percentage ellipsis mr10">
                          {{ item.reportName }}</span
                        >
                        <template #content>
                          <div>
                            {{ t('common.title') }}：{{ item.reportName }}
                          </div>
                          <div>
                            {{ t('common.content') }}：{{ item.noteContent }}
                          </div>
                          <div>
                            {{ t('common.creator') }}：{{ item.creator }}
                          </div>
                        </template>
                      </Tooltip>
                    </div>
                    <el-button
                      @click="addOrEditNote(item)"
                      text
                      class="c86919d elem-hover">
                      <SvgIcon name="edit1" />
                    </el-button>
                    <el-button
                      @click="addSelectedListItem(item)"
                      text
                      class="c86919d elem-hover">
                      <SvgIcon name="kanban-create1" />
                    </el-button>
                  </div>
                </DynamicScrollerItem>
              </template>
            </DynamicScroller>

            <div v-else class="h100-percentage flex-center flex-level-center">
              <Empty :desc="t('dashboard.noNotes')" />
            </div>
          </el-tab-pane>
        </el-tabs>

        <div class="nd-report-r-t-btn">
          <el-button
            @click="openReportManage"
            v-if="+state.tabActive === 1"
            type="primary"
            text
            >{{ t('dashboard.dataReport') }}
          </el-button>
          <el-button @click="addOrEditNote()" v-else type="primary" text
            >{{ t('dashboard.addNote') }}
          </el-button>
        </div>
      </div>
    </div>
  </CommonDrawer>
  <AddOrEditNoteDialog
    @updNote="updNote"
    @getData="getNoteList"
    ref="addorEditNoteDialogRef" />
</template>

<script setup>
import { computed, reactive, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  getDataTypeList,
  reportTypeList,
  reportTypeListMap,
} from '@/enumeration/report'
import useSeePlateStore from '@/store/modules/see-plate'
import GridLayout from '../GridLayout/index.vue'
import AddOrEditNoteDialog from './AddOrEditNoteDialog.vue'
import { delNullProperty } from '@/utils/dataProcessing'
import {
  asyncReportBinding,
  asyncSaveViewPosition,
} from '@/api/modules/see-plate/dashboard'
import { noteBgColorListMap } from '@/enumeration/note.js'
import { debounce } from 'lodash-es'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const route = useRoute()
const router = useRouter()
const seePlateStore = useSeePlateStore()
const dataTypeList = getDataTypeList()
const emit = defineEmits(['getData'])
const initVal = () => {
  return {
    tabActive: '1',
    visible: false,
    reportFilter: {
      // 报表名称
      reportName: '',
      // 谁创建的 1 全部 2 我创建的 3 他人分享的
      dataType: 2,
      // 标签值列表，多个使用逗号隔开
      labelNameList: [],
      // 报表类型
      reportType: '',
    },
    noteFilter: {
      // 便签名称
      noteName: '',
    },
    operateLoading: false,
    loading: false,
  }
}
let updNoteList = {}
let delNoteList = {}
const gridLayoutRef = shallowRef(null)
const addorEditNoteDialogRef = shallowRef(null)
const state = reactive(initVal())

const reportAndNoteLen = computed(() => {
  return seePlateStore.addSelectedReporNoteList.reduce(
    (p, c) => {
      if (c.type === 1) {
        // 便签
        p.note += 1
      } else {
        p.report += 1
      }
      return p
    },
    { report: 0, note: 0 }
  )
})

const filterReportList = computed(() => {
  const businessIds = seePlateStore.addSelectedReporNoteList.map(
    (v) => v.businessId
  )
  return seePlateStore.reportList.filter(
    (item) => !businessIds.includes(item.businessId) && item.reportType !== 5
  )
})

const filterNoteList = computed(() => {
  const addSelectedReporNoteList = seePlateStore.addSelectedReporNoteList.map(
    (v) => v.businessId
  )
  return seePlateStore.noteList.filter(
    (item) =>
      !addSelectedReporNoteList.includes(item.businessId) &&
      item.reportName
        .toLowerCase()
        .includes(state.noteFilter.noteName.toLowerCase())
  )
})

const addOrEditNote = (val) => {
  addorEditNoteDialogRef.value.open(val)
}

const delItem = (val, cb) => {
  if (val.type === 1) {
    delNoteList[val.businessId] = val.reportName
  }
  cb()
}

const updNote = (val) => {
  // 记录在左侧更新的便签信息 决定要不要重新获取数据
  if (val.isLeft || delNoteList[val.businessId]) {
    updNoteList[val.businessId] = val.reportName
  }
  const data = seePlateStore.addSelectedReporNoteList.find(
    (item) => item.businessId === val.businessId
  )

  if (data) {
    // 中图
    const w = val.viewSizeType === 1 ? 6 : 12
    const params = {
      w,
      newW: w,
      minW: w,
      maxW: w,
    }
    Object.assign(data, {
      ...val,
      ...params,
    })

    gridLayoutRef.value.updateInfo(data.mark, {
      ...params,
      x: 12 === data.newW ? 0 : data.x,
    })
  }
}

const openReportManage = (val) => {
  const routeUrl = router.resolve({
    path: `/analysis/report?virtualAppId=${sessionStorage.getItem('appId')}`,
  })
  window.open(routeUrl.href)
}

const tabChange = debounce(() => {
  gridLayoutRef.value?.setExternalDrag()
}, 300)

const clearSelectedList = () => {
  gridLayoutRef.value.removeAll()
}

const addSelectedListItem = (data) => {
  const len = data.type === 1 ? 10 : 30
  const label = t(`dashboard.${data.type === 1 ? 'note' : 'report'}`)
  if (reportAndNoteLen.value[data.type === 1 ? 'note' : 'report'] >= len) {
    ElMessage.warning(
      t('dashboard.maxAddLimit', {
        label,
        len,
      })
    )
    return
  }
  seePlateStore.addSelectedReporNoteList.push(data)
  gridLayoutRef.value.makeLayout(data.mark)
}

const getReportList = async (exec = true) => {
  exec && (state.loading = true)
  await seePlateStore
    .asyncGetReportList({
      ...delNullProperty(state.reportFilter),
    })
    .finally((_) => {
      tabChange()
      exec && (state.loading = false)
    })
}

const getNoteList = async (exec = true) => {
  exec && (state.loading = true)
  await seePlateStore.asyncGetNoteList().finally((_) => {
    tabChange()
    exec && (state.loading = false)
  })
}

const open = async () => {
  Object.assign(state, initVal())
  state.visible = true
  state.operateLoading = true
  await Promise.allSettled([
    seePlateStore.getReportNoteDetails(false),
    getReportList(false),
    getNoteList(false),
    seePlateStore.asyncGetTagList(),
  ]).finally((_) => {
    state.operateLoading = false
  })
  gridLayoutRef.value.initLayout()
}

const close = () => {
  if (Object.keys(updNoteList).length) {
    emit('getData')
  }
  updNoteList = {}
  delNoteList = {}
}

const submit = async () => {
  try {
    if (reportAndNoteLen.value.report + reportAndNoteLen.value.note > 40) {
      ElMessage.warning(t('dashboard.maxLimitExceeded'))
      return
    }
    state.operateLoading = true
    await asyncReportBinding({
      businessId: route.query.kanBanId,
      dataType: 1,
      moduleType: route.query.moduleType,
      ...gridLayoutRef.value.getSaveLayout().reduce(
        (p, item) => {
          p[item.type === 1 ? 'noteIds' : 'reportBusinessIds'].push(
            item.businessId
          )
          return p
        },
        { reportBusinessIds: [], noteIds: [] }
      ),
    })
    await asyncSaveViewPosition({
      businessId: route.query.kanBanId,
      viewConfig: JSON.stringify(
        gridLayoutRef.value.getSaveLayout().map((item) => {
          // 元素的 h 都被缩小了， 最终提交时在取newH字段的值
          return {
            id: item.reportId,
            i: item.reportId,
            // 存储业务id
            mark: item.businessId,
            w: item.newW,
            h: item.newH,
            x: item.x,
            y: item.y,
            type: item.type,
          }
        })
      ),
    })
    updNoteList = {}
    state.visible = false
    ElMessage.success(t('common.operationSuccessfully'))
    emit('getData')
  } catch (e) {
    console.log(e)
  }
  state.operateLoading = false
}

defineExpose({
  open,
})
defineOptions({
  name: 'AddReportDrawer',
})
</script>

<style lang="scss">
#nd-grid-drawer-content {
  .grid-stack-item-content {
    .nd-grid-item {
      background-color: var(--eas-color-primary-light-1);
      .nd-operate {
        display: none;
      }
      &:hover {
        .nd-operate {
          display: flex;
        }
      }
    }
  }
}
</style>
<style scoped lang="scss">
.nd-tab-pane {
  display: flex;
  flex-direction: column;

  .nd-list {
    height: 100%;
  }

  .nd-list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    height: 32px;
    background-color: var(--eas-hover-color);
    border-radius: 2px;
    white-space: nowrap;

    > div {
      display: flex;
      align-items: center;
      overflow: hidden;
      margin-right: 10px;
      width: 100%;
    }

    .nd-list-item-label {
      color: var(--eas-text-color-primary);
      &:hover {
        color: var(--eas-color-primary);
      }
    }

    .svg-icon {
      cursor: pointer;
      color: var(--eas-text-color-light);

      &:hover {
        color: var(--eas-color-primary);
      }
    }
  }
}

.nd-report-drawer-container {
  display: flex;
  height: 100%;
  overflow: hidden;

  > div {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 450px;
    overflow: hidden;
    //flex: 1;
  }
}

.nd-report-l {
  border-right: 1px solid var(--eas-border-color);
  padding-right: 10px;

  .nd-grid-drawer-container {
    overflow-x: hidden;
    overflow-y: auto;
    height: 100%;
    position: relative;
  }
}

.nd-report-r {
  position: relative;
  padding-left: 10px;

  .nd-report-r-t-btn {
    position: absolute;
    top: 0;
    right: 0;
  }
}
</style>
