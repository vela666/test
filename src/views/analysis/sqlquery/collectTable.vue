<script setup>
import { ref, reactive, nextTick } from 'vue'
import InputDialog from './components/InputDialog.vue'
import DetailSqlDropdown from './components/DetailSqlDropdown.vue'
import {
  getBookmarkList,
  updateBookmark,
  deleteBookmark,
} from '@/api/modules/analysis/sql'
import { debounce, cloneDeep } from 'lodash-es'
import { useTipModal } from '@/components/TipDialog'
import { recordBehavior } from '@/utils/record-behavior.js'
import { t } from '@/locales/i18n'

const props = defineProps({
  isSql: {
    type: Boolean,
    default: false,
  },
})

const state = reactive({
  searchContent: '',
  dataList: [],
  dataTable: [],
  pageNum: 1,
  pageSize: 10,
  total: 0,
  loading: false,
  dialogVisible: false,
  collectId: null,
  collectName: '',
})

const emit = defineEmits(['sqlSettings'])

/**
 * @description 查询收藏列表
 */
const getCollectList = debounce((type) => {
  state.loading = true
  if (type === 'init') {
    state.searchContent = ''
  }
  getBookmarkList({ searchContent: state.searchContent })
    .then((res) => {
      if (res && res.code === 200) {
        state.dataList = res.data
        handleGetList({ page: 1, limit: state.pageSize })
      }
    })
    .finally(() => {
      state.loading = false
    })
}, 300)

/**
 * @description 获取分页数据
 */
const handleGetList = ({ page, limit }) => {
  state.pageNum = page
  const data = state.dataList
  state.dataTable = data.slice((page - 1) * limit, page * limit)
  state.total = data.length
}

const getList = () => {
  handleGetList({ page: state.pageNum, limit: state.pageSize })
}

/**
 * @description 表格详情填充
 */
const handleDropdownFill = (row, callback) => {
  handleFill(row, callback)
}

/**
 * @description 填充
 */
const handleFill = async (row, callback) => {
  try {
    if (props.isSql) {
      const content = t('analysis.sqlquery.confirmFill')
      await useTipModal({
        content,
        iconType: 3,
        needLoading: false,
        btnSwap: true,
        title: t('analysis.fill'),
      })
    }
    recordBehavior({
      moduleName: '分析',
      submoduleName: 'SQL查询',
      operate: '使用语句收藏填充',
    })
    const sql = row.content
    const list = cloneDeep(row.params) || []
    emit('sqlSettings', sql, list)
    if (callback) {
      callback()
    }
  } catch (e) {
    console.log(e)
  }
}

/**
 * @description 重命名弹框
 */
const handleRename = (row) => {
  state.dialogVisible = true
  state.collectId = null
  state.collectName = ''
  nextTick(() => {
    state.collectId = row.id
    state.collectName = row.name
  })
}

/**
 * @description 重命名保存
 */
const getCollectName = (name) => {
  updateBookmark({ id: state.collectId, name }).then((res) => {
    if (res && res.code === 200) {
      state.collectId = null
      state.collectName = ''
      getCollectList()
    }
  })
}

const dropdownCollectDelect = ref([])

/**
 * @description 打开删除弹框
 */
const handleDelete = (id, index) => {
  state.collectId = id
  dropdownCollectDelect.value[index].handleOpen()
}

/**
 * @description 取消删除弹框
 */
const handleDelectCancle = (index) => {
  dropdownCollectDelect.value[index].handleClose()
}

/**
 * @description 删除动态参数
 */
const handleDelectSubmit = (index) => {
  deleteBookmark({ id: state.collectId }).then((res) => {
    if (res && res.code === 200) {
      state.collectId = null
      getCollectList()
      handleDelectCancle(index)
    }
  })
}

defineExpose({ getCollectList })

defineOptions({
  name: 'collectTable',
})
</script>
<template>
  <div v-loading="state.loading" class="sql-collect">
    <div class="flex-center mb20">
      <CommonInput
        v-model="state.searchContent"
        :desc="$t('analysis.sqlquery.searchFavoriteName')"
        class="flex1 mr10"
        @input="getCollectList" />
      <span>
        {{ $t('analysis.sqlquery.totalPageFavorite', [state.total]) }}
      </span>
    </div>
    <el-table :data="state.dataTable" class="nd-table-custom" border>
      <el-table-column
        type="index"
        :label="$t('common.orderNumber')"
        width="80">
        <template #default="scope">
          <span>{{
            scope.$index + 1 + (state.pageNum - 1) * state.pageSize
          }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('analysis.sqlquery.favoriteName')" prop="name">
        <template #default="scope">
          <div v-showTips>{{ scope.row.name }}</div>
        </template>
      </el-table-column>
      <el-table-column
        :label="$t('analysis.sqlquery.favoriteStatements')"
        prop="content">
        <template #default="scope">
          <div class="flex-center w350">
            <div class="ellipsis">{{ scope.row.content }}</div>
            <DetailSqlDropdown
              v-if="scope.row.content.length >= 50"
              :title="$t('analysis.sqlquery.viewStatements')"
              :btnName="$t('analysis.sqlquery.detail')"
              :sql="scope.row.content"
              :row="scope.row"
              @handleFill="handleDropdownFill"></DetailSqlDropdown>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.operate')">
        <template #default="scope">
          <el-button
            class="is-text"
            type="primary"
            @click="handleFill(scope.row)">
            {{ $t('analysis.fill') }}
          </el-button>
          <el-button
            class="is-text"
            type="primary"
            @click="handleRename(scope.row)">
            {{ $t('btn.rename') }}
          </el-button>
          <CommonDropdown
            :ref="(el) => (dropdownCollectDelect[scope.$index] = el)"
            width="220px">
            <template #content>
              <el-button
                class="ml12 is-text"
                type="primary"
                @click="handleDelete(scope.row.id, scope.$index)">
                {{ $t('btn.delete') }}
              </el-button>
            </template>
            <template #default>
              <div class="flex-center fz14 mt20 ml12 mb20">
                <SvgIcon name="warning1" class="cff7d00 mr5 fz18" />
                <span>{{ $t('analysis.sqlquery.removeCollection') }}</span>
              </div>
              <div class="ml10 mr10 mb10 text-align-right">
                <el-button
                  text
                  class="skip mr10"
                  @click="handleDelectCancle(scope.$index)">
                  {{ $t('btn.cancel') }}
                </el-button>
                <el-button
                  type="primary"
                  class="m0"
                  @click="handleDelectSubmit(scope.$index)">
                  {{ $t('btn.confirm') }}
                </el-button>
              </div>
            </template>
          </CommonDropdown>
        </template>
      </el-table-column>
    </el-table>
    <div class="report-view-footer flex-center flex-justify-content-end">
      <Pagination
        v-model:limit="state.pageSize"
        v-model:page="state.pageNum"
        :total="state.total"
        @getData="getList" />
    </div>
    <InputDialog
      v-model="state.dialogVisible"
      :title="$t('btn.rename')"
      :name="state.collectName"
      @getName="getCollectName"></InputDialog>
  </div>
</template>
<style lang="scss" scoped>
.sql-collect {
  padding: 20px;
  .flex1 {
    flex: 1;
  }
  .report-view-footer {
    width: 100%;
    height: 64px;
  }
}
</style>
