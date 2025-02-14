<template>
  <CommonLayout>
    <template #hl>
      <el-select
        placeholder="消息场景"
        v-model="state.msgSceneId"
        @change="getList"
        style="width: 180px"
        clearable>
        <el-option
          v-for="item in state.newsSceneList"
          :key="item.msgSceneId"
          :label="item.msgSceneName"
          :value="item.msgSceneId" />
      </el-select>
    </template>
    <template #hr>
      <el-button type="primary" @click="state.msgRef.open()">
        新建消息
      </el-button>
    </template>
    <el-table
      class="nd-table-custom"
      :data="state.pageData"
      border
      v-loading="state.loading">
      <el-table-column
        v-for="item in columns"
        :key="item.prop"
        :label="item.label"
        :prop="item.prop"
        show-overflow-tooltip
        v-bind="{ ...item }">
        <template #default="scope">
          <template v-if="item.prop === 'allUser'">
            <span v-if="scope.row.allUser === 1">全部成员</span>
            <span v-else>
              {{
                scope.row.msgCompanyUserList
                  .map((item) => item.nickName)
                  .join(',')
              }}
            </span>
          </template>
          <!-- 1: 草稿  2：未发布  3：已发布 -->
          <template v-if="item.prop === 'msgStatus'">
            <span v-if="scope.row.msgStatus === 1" class="default-status">
              草稿
            </span>
            <span v-if="scope.row.msgStatus === 2" class="primary-status">
              未发布
            </span>
            <span v-if="scope.row.msgStatus === 3" class="success-status">
              已发布
            </span>
          </template>
          <!-- 1: 草稿  2：未发布  3：已发布 -->
          <template v-else-if="item.prop === 'operation'">
            <el-button
              v-if="scope.row.msgStatus === 1"
              @click="handleOperate(scope.row, 'send')"
              type="primary"
              text>
              发布
            </el-button>
            <el-button
              v-if="scope.row.msgStatus === 2"
              @click="handleOperate(scope.row, 'revoke')"
              type="primary"
              text>
              撤回
            </el-button>
            <el-button
              v-if="scope.row.msgStatus === 1"
              @click="handleView(scope.row, 'edit')"
              type="primary"
              text>
              编辑
            </el-button>
            <el-button
              @click="handleView(scope.row, 'view')"
              type="primary"
              text>
              详情
            </el-button>
            <el-button
              v-if="scope.row.msgStatus !== 3"
              @click="handleOperate(scope.row, 'del')"
              type="primary"
              text>
              删除
            </el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <Pagination
        v-model:limit="pageInfo.pageSize"
        v-model:page="pageInfo.pageNum"
        :total="pageInfo.total"
        @getData="getList" />
    </template>
  </CommonLayout>
  <MessageSet
    :ref="(ref) => (state.msgRef = ref)"
    :newsSceneList="state.newsSceneList"
    :userList="state.userList"
    @getList="getList" />
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import {
  getMsgSceneList,
  getMessageList,
  revokeMessage,
  deleteMessage,
  sendMessage,
  selectCompanyUser,
} from '@/api/modules/notice'
import MessageSet from './MessageSet.vue'
import { useTipModal } from '@/components/TipDialog'
import { ElMessage } from 'element-plus'

const state = reactive({
  newsSceneList: [],
  msgSceneId: '',
  pageData: [],
  loading: false,
  msgRef: null,
  userList: [],
})

const pageInfo = reactive({
  pageNum: 1,
  pageSize: 20,
  total: 0,
})

const columns = [
  {
    label: '消息场景',
    prop: 'msgSceneName',
  },
  {
    label: '消息标题',
    prop: 'msgTitle',
  },
  {
    label: '消息状态',
    prop: 'msgStatus',
  },
  {
    label: '发送时间',
    prop: 'pushTime',
  },
  {
    label: '接收成员',
    prop: 'allUser',
  },
  {
    label: '操作',
    prop: 'operation',
    fixed: 'right',
  },
]

onMounted(() => {
  msgSceneList()
  getList()
  getUsetList()
})

/**
 * @description: 获取成员列表
 * @return {*}
 */
const getUsetList = () => {
  selectCompanyUser().then((res) => {
    state.userList = convertToTree(res.data)
  })
}

/**
 * @description: 扁平结构转换为树结构
 * @return {*}
 * @param {*} items
 */
const convertToTree = (flatData) => {
  const results = []
  const itemMap = {}

  for (const item of flatData) {
    const parent_id = item.companyId
    if (!itemMap[parent_id]) {
      itemMap[parent_id] = {
        ...item,
        nickName: item.companyName,
        userId: item.companyId + '_company',
        children: [],
      }
    }
    itemMap[parent_id].children.push(item)
  }

  Object.keys(itemMap).forEach((item) => {
    results.push(itemMap[item])
  })

  return results
}

/**
 * @description: 获取消息场景
 * @return {*}
 */
const msgSceneList = () => {
  getMsgSceneList().then((res) => {
    state.newsSceneList = res.data
  })
}

/**
 * @description: 获取消息列表
 * @return {*}
 */
const getList = () => {
  const params = {
    page: pageInfo.pageNum,
    size: pageInfo.pageSize,
    msgSceneId: state.msgSceneId,
  }
  state.loading = true
  getMessageList(params)
    .then((res) => {
      const { list, page } = res.data
      state.pageData = list
      pageInfo.total = page.totalCount
    })
    .finally((_) => {
      state.loading = false
    })
}

/**
 * @description: 发布/撤回/删除
 * @return {*}
 */
const handleOperate = async ({ msgId, msgTitle }, type) => {
  const operateMap = {
    send: {
      title: '发布',
      content: `确定发布消息【${msgTitle}】吗？`,
      message: '操作成功',
      method: sendMessage,
    },
    revoke: {
      title: '撤回',
      content: `确定撤回消息【${msgTitle}】吗？`,
      message: '撤回成功',
      method: revokeMessage,
    },
    del: {
      title: '删除',
      content: `确定删除消息【${msgTitle}】吗？`,
      message: '删除成功',
      method: deleteMessage,
    },
  }

  try {
    const { title, message, content, method } = operateMap[type]
    await useTipModal({
      title,
      content,
      btnSwap: true,
      needLoading: false,
    })

    method(msgId).then(() => {
      ElMessage.success(message)
      getList()
    })
  } catch (error) {
    console.log(error)
  }
}

/**
 * @description: 编辑/详情
 * @return {*}
 */
const handleView = (row, type) => {
  state.msgRef?.handleView(row, type)
}
</script>
