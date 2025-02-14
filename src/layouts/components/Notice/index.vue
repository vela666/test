<template>
  <CommonDrawer
    class="notice-drawer"
    v-model="state.drawerShow"
    :title="$t('layouts.notice.messageNotification')"
    :showBtn="false"
    @close="handleClose"
    size="700px"
    :loading="state.loading">
    <template #title>
      <div class="flex-center flex-between">
        <span>{{ $t('layouts.notice.messageNotification') }}</span>
        <el-link :underline="false" @click="showMessageSetUp" class="mr20">
          <el-space :size="4" class="c86919d">
            <img src="@/assets/images/n-setting.png" />
            <span>{{ $t('layouts.notice.messageSettings') }}</span>
          </el-space>
        </el-link>
      </div>
    </template>
    <div class="flex-column" style="height: 100%">
      <header class="flex-center flex-between mr20 mt20 mb20">
        <el-space :size="10">
          <el-select
            class="w160 placeholder-c86919d"
            :placeholder="$t('layouts.notice.allApps')"
            clearable
            v-model="query.appId"
            @change="getMessageList">
            <el-option
              v-for="item in state.appList"
              :key="item.appId"
              :value="item.appId"
              :label="item.appName"></el-option>
          </el-select>
          <el-select
            class="w160 placeholder-c86919d"
            :placeholder="$t('layouts.notice.allTypes')"
            clearable
            v-model="query.msgType"
            @change="getMessageList">
            <el-option
              v-for="item in state.msgTypeList"
              :key="item.msgTypeId"
              :value="item.msgTypeId"
              :label="item.msgTypeName" />
          </el-select>
          <el-checkbox
            :true-value="0"
            :false-value="-1"
            v-model="state.readStatus"
            @change="changeNoticeList">
            <span class="c5473e8">
              {{ $t('layouts.notice.showUnreadMessages') }}({{
                state.unreadCount
              }})
            </span>
          </el-checkbox>
        </el-space>
        <el-space :size="10">
          <el-button text type="primary" @click="handleReadAll">
            <el-icon><Select /></el-icon>
            {{ $t('layouts.notice.markAllAsRead') }}
          </el-button>
        </el-space>
      </header>

      <main class="c545e6e notice-main mt5">
        <el-scrollbar v-if="state.messageList.length > 0">
          <el-collapse
            v-model="state.activeName"
            accordion
            class="notice-container mr20 mb5">
            <el-collapse-item
              v-for="item in state.messageList"
              :key="item.id"
              :name="item.id"
              @click="msgDetail(item)">
              <template #title>
                <div class="flex-center flex-between">
                  <el-space class="notice-item__header flex-center" :size="10">
                    <img
                      v-if="item.msgTypeId === 1"
                      src="@/assets/images/notice-warn.png" />
                    <img
                      v-if="item.msgTypeId === 2"
                      src="@/assets/images/notice-sys.png" />
                    <img
                      v-if="item.msgTypeId === 3"
                      src="@/assets/images/notice-board.png" />
                    <div class="c545e6e ellipsis fz14" style="max-width: 460px">
                      {{ item.msgTitle }}
                    </div>
                  </el-space>

                  <div>
                    <span
                      :class="{ show: item.readStatus === 0 }"
                      class="notice-item__unread mr5" />
                    <span>
                      <span class="c86919d mr10">
                        {{
                          dayjs().isSame(dayjs(item.pushTime), 'day')
                            ? `${$t('layouts.notice.today')} ${dayjs(item.pushTime).format('HH:mm')}`
                            : item.pushTime
                        }}
                      </span>
                    </span>
                  </div>
                </div>
              </template>
              <div @click="handlePreview($event)">
                <div
                  class="notice-html-content c545e6e"
                  v-html="item.msgContent"></div>
              </div>
              <div class="collapse-footer">
                <div>
                  {{
                    dayjs().isSame(dayjs(item.pushTime), 'day')
                      ? `${$t('layouts.notice.today')} ${dayjs(item.pushTime).format('HH:mm')}`
                      : item.pushTime
                  }}
                </div>
                <div class="c-pointer" @click="state.activeName = ''">
                  <el-icon class="mr3"><ArrowUp /></el-icon>
                  {{ $t('layouts.notice.putAway') }}
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-scrollbar>
        <div v-else class="empty-container">
          <Empty :desc="$t('layouts.notice.noMessages')" />
        </div>
      </main>
    </div>
    <template #footer-r>
      <Pagination
        v-model:limit="pageInfo.pageSize"
        v-model:page="pageInfo.pageNum"
        :total="pageInfo.total"
        @getData="getMessageList" />
    </template>
  </CommonDrawer>

  <CommonDialog
    v-model="state.dialogShow"
    :width="720"
    :showBtn="false"
    :show-close="false">
    <div
      class="notice-html-content"
      @click="handlePreview($event)"
      :ref="(ref) => (state.contentRef = ref)">
      <div class="notice-header">
        <div class="notice-title mb6 c1c2028 fz24">
          {{ state.detailInfo.msgTitle }}
        </div>
        <div class="notice-info c86919d mt10 mb20">
          <span>{{ state.detailInfo.pushTime }}</span>
        </div>
      </div>
      <div v-html="state.detailInfo.msgContent" class="mt20 c545e6e"></div>
    </div>
    <template #footer>
      <el-button
        type="primary"
        @click="handleRead"
        class="w160"
        style="height: 36px">
        {{ $t('layouts.notice.alreadyAware') }}
      </el-button>
    </template>
  </CommonDialog>

  <el-image-viewer
    :initial-index="state.initImageIndex"
    :ref="(ref) => (state.previewRef = ref)"
    :url-list="state.previewUrlList"
    v-if="state.showImageViewer"
    @close="() => (state.showImageViewer = false)" />

  <CommonDialog
    :showBtn="false"
    v-model="state.dialogSetting"
    width="960"
    :title="$t('layouts.notice.messageSettings')">
    <el-table
      :data="state.setTableData"
      :header-cell-style="{ background: '#f0f2f5' }"
      border
      :span-method="arraySpanMethod">
      <el-table-column
        v-for="item in state.setColumnList"
        :key="item.prop"
        :prop="item.prop"
        :label="item.label"
        show-overflow-tooltip
        v-bind="{ ...item }">
        <template #default="scope">
          <div v-if="item.prop === 'internalEnable'">
            <el-checkbox
              v-model="scope.row[item.prop]"
              :disabled="
                (scope.row.msgTypeId === 1 &&
                  [1, 2].includes(scope.row.msgSceneId)) ||
                scope.row.msgTypeId === 3
              "
              @change="setMsg(scope)"
              :true-value="1"
              :false-value="0" />
          </div>
          <div v-else-if="item.prop === 'emailEnable'">
            <el-checkbox
              v-model="scope.row[item.prop]"
              :disabled="
                (scope.row.msgTypeId === 1 &&
                  [1, 2].includes(scope.row.msgSceneId)) ||
                scope.row.msgTypeId === 3
              "
              @change="setMsg(scope)"
              :true-value="1"
              :false-value="0" />
          </div>
          <div v-else class="over-hidden">{{ scope.row[item.prop] }}</div>
        </template>
      </el-table-column>
    </el-table>
    <template #footer-r>
      <el-button type="primary" @click="state.dialogSetting = false">
        {{ $t('common.back') }}
      </el-button>
    </template>
  </CommonDialog>
</template>

<script setup>
import { nextTick, onMounted, reactive, toRef, watch } from 'vue'
import { getUserApp } from '@/api/modules/app'
import {
  getMsgType,
  userMessageList,
  userMessageUnread,
  messageReadAll,
  messageRead,
  msgSetList,
  msgSet,
  popMsg,
} from '@/api/modules/notice'
import dayjs from 'dayjs'
import { isEmpty } from 'lodash-es'
import { recordBehavior } from '@/utils/record-behavior.js'
import { Select, ArrowUp } from '@element-plus/icons-vue'
import { t } from '@/locales/i18n'

const state = reactive({
  drawerShow: false,
  dialogShow: false,
  dialogSetting: false,
  readStatus: '-1',
  messageList: [],
  detailInfo: {},
  setColumnList: [
    {
      label: t('layouts.notice.messageType'),
      prop: 'msgTypeName',
      minWidth: '180',
    },
    {
      label: t('layouts.notice.messageScenario'),
      prop: 'msgSceneName',
      minWidth: '180',
    },
    {
      label: t('layouts.notice.internalMessage'),
      prop: 'internalEnable',
      minWidth: '180',
    },
    { label: t('login.email'), prop: 'emailEnable', minWidth: '180' },
  ],
  setTableData: [],
  appList: [],
  msgTypeList: [],
  unreadCount: 0,
  loading: false,
  previewRef: null,
  previewUrl: '',
  previewUrlList: [],
  contentRef: null,
  showImageViewer: false,
  initImageIndex: 0,
  detailType: 'detail',
  activeName: '',
})

const initQuery = () => ({
  appId: '',
  msgType: '',
})

const query = reactive(initQuery())

const pageInfo = reactive({
  pageNum: 1,
  pageSize: 20,
  total: 0,
})

onMounted(() => {
  getPopMsg()
  getUnread()
})

/**
 * @description: 是否用户登录弹出消息
 * @return {*}
 */
const getPopMsg = () => {
  popMsg().then((res) => {
    const flag = isEmpty(res.data)
    if (!flag) {
      state.dialogShow = true
      state.detailInfo = res.data
      state.detailType = 'pop'
    }
  })
}

/**
 * @description: 知道了-- 已读
 * @return {*}
 */
const handleRead = () => {
  state.dialogShow = false
  if (state.detailType === 'pop') readMsg(state.detailInfo.userMsgId)
}

/**
 * @description: 消息详情
 * @return {*}
 */
const msgDetail = (info) => {
  if (!info.readStatus) readMsg(info.userMsgId)
}

/**
 * @description: 读取消息
 * @return {*}
 */
const readMsg = (id) => {
  messageRead(id).then(() => {
    getMessageList()
    getUnread()
  })
}

/**
 * @description: 消息设置
 * @return {*}
 */
const setMsg = (scope) => {
  const { msgSetId, internalEnable, emailEnable } = scope.row
  const params = {
    msgSetId,
    internalEnable,
    emailEnable,
  }
  msgSet(params).then(() => {
    getMsgSetList()
  })
}

const open = () => {
  state.drawerShow = true
  recordBehavior({
    moduleName: '通用',
    submoduleName: '消息通知',
    operate: '查看消息通知',
  })
  getAppList()
  getMessageList()
  getMsgTypeList()
  getUnread()
}

/**
 * @description: 获取应用列表
 * @return {*}
 */
const getAppList = () => {
  getUserApp().then((res) => {
    state.appList = res.data
  })
}

/**
 * @description: 获取消息类型
 * @return {*}
 */
const getMsgTypeList = () => {
  getMsgType().then((res) => {
    state.msgTypeList = res.data
  })
}

/**
 * @description: 获取消息列表
 * @return {*}
 */
const getMessageList = () => {
  const params = {
    ...query,
    page: pageInfo.pageNum,
    size: pageInfo.pageSize,
    readStatus: state.readStatus,
  }
  state.loading = true
  userMessageList(params)
    .then((res) => {
      const { list, page } = res.data
      state.messageList = list
      pageInfo.total = page.totalCount
    })
    .finally(() => {
      state.loading = false
    })
}

/**
 * @description: 统计消息未读数
 * @return {*}
 */
const getUnread = () => {
  userMessageUnread().then((res) => {
    state.unreadCount = res.data
  })
}

/**
 * @description: 全部/未读
 * @return {*}
 */
const changeNoticeList = (val) => {
  pageInfo.pageNum = 1
  pageInfo.pageSize = 20
  getUnread()
  getMessageList()
}

/**
 * @description: 全部标记为已读
 * @return {*}
 */
const handleReadAll = () => {
  messageReadAll().then(() => {
    getMessageList()
    getUnread()
  })
}

const showMessageSetUp = () => {
  state.dialogSetting = true
  recordBehavior({
    moduleName: '通用',
    submoduleName: '消息通知',
    operate: '消息设置',
  })
}
watch(
  () => state.dialogSetting,
  (val) => {
    if (val) {
      getMsgSetList()
    }
  }
)

/**
 * @description: 获取消息设置列表
 * @return {*}
 */
const getMsgSetList = () => {
  msgSetList().then((res) => {
    const idMap = {}
    res.data.forEach((item) => {
      if (!idMap[item.msgTypeId]) {
        idMap[item.msgTypeId] = 1
      } else {
        idMap[item.msgTypeId] += 1
      }
    })
    res.data.forEach((item) => {
      item.rowspan = idMap[item.msgTypeId]
    })
    state.setTableData = res.data
  })
}

/**
 * @description: 合并列
 * @return {*}
 */
const arraySpanMethod = ({ row, column, rowIndex, columnIndex }) => {
  if (columnIndex === 0) {
    if (row.rowspan && rowIndex % row.rowspan === 0) {
      return [row.rowspan, 1]
    } else {
      return [0, 0]
    }
  }
}

const handleClose = () => {
  state.readStatus = '-1'
  Object.assign(query, initQuery())
}

/**
 * @description: 预览图片
 * @return {*}
 */
const handlePreview = (e) => {
  if (e.target.tagName === 'IMG') {
    state.previewUrl = e.target.src
    state.previewUrlList = [...state.contentRef.querySelectorAll('img')].map(
      (item) => item.src
    )
    state.initImageIndex = state.previewUrlList.findIndex(
      (item) => item === e.target.src
    )
    state.showImageViewer = true
  }
}

defineExpose({
  open,
  unreadCount: toRef(state, 'unreadCount'),
})
</script>

<style lang="scss" scoped>
.notice-main {
  flex: 1;
  overflow: hidden;
  position: relative;
}
.notice-item {
  width: 100%;
  // height: 108px;
  border-radius: var(--el-border-radius-small);
  padding: 20px;

  &:hover {
    background: var(--eas-color-primary-light-1);
  }
  cursor: pointer;
  &__header {
    font-weight: bold;
  }
  &__unread {
    display: inline-block;
    width: 6px;
    height: 6px;
    background: var(--el-color-error);
    border-radius: 50%;
    position: relative;
    top: -3px;
    visibility: hidden;
    &.show {
      visibility: visible;
    }
  }
}
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  inset: 0;
}
:deep(.placeholder-c86919d) {
  --el-text-color-placeholder: #86919d;
  .el-select__wrapper {
    box-shadow: none;
  }
}
:deep(.notice-container) {
  border: none;
  .el-collapse-item {
    background: #ffffff;
    border-radius: 4px;
    box-shadow: 3px 3px 6px 0px rgba(84, 115, 231, 0.1);
    & + .el-collapse-item {
      margin-top: 10px;
    }
  }
  .el-collapse-item__header {
    border-bottom: none;
    display: flex;
    align-items: center;
    padding: 0 4px 0 16px;
    border-radius: 4px;
    height: 64px;
    > div {
      flex: 1;
    }
  }
  .el-collapse-item__wrap {
    border: none;
    border-radius: 4px;
  }
  .el-collapse-item__content {
    padding-bottom: 0px;
    padding: 0 16px;
  }
  .el-collapse-item__arrow {
    color: #86919d;
  }
  .collapse-footer {
    height: 38px;
    border-top: 1px solid #f2f2f2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #86919d;
  }
}
</style>

<style lang="scss">
.notice-html-content {
  padding-left: 28px;
  margin-bottom: 16px;
  img {
    max-width: 100%;
  }
}
.notice-drawer {
  .el-drawer__header {
    height: 64px;
    padding: 0 20px;
    margin-bottom: 0;
  }
  .el-drawer__body {
    background: #f6f6f9;
  }
  .n-drawer-tab-c .n-drawer-tab-c-t {
    padding-left: 20px;
    padding-right: 0;
  }
  .p-20-32 {
    padding: 20px;
  }
}
</style>
