<script setup>
defineOptions({
  name: 'MenuManage',
})
import { ref, reactive, onMounted, computed, watch, markRaw } from 'vue'
import { slicePagingData } from '@/utils/dataProcessing'
import { menuList, addMenu, updMenu } from '@/api/modules/menu'
import { cloneDeep, debounce } from 'lodash-es'

const formDataFn = () => ({
  menuId: null,
  parentMenuId: '',
  title: '',
  icon: '',
  path: '',
  sort: '',
  status: true,
  hidden: false,
  menuType: 0,
  operationPermission: '',
})

const disabledFn = (data, node) => {
  if (data.menuId === state.formData.menuId) {
    return true
  } else {
    return false
  }
}

const commonDrawerRef = ref(null)

const state = reactive({
  searchName: '',
  // 分页器配置
  page: 1, // 当前页码
  pageSize: 10, // 每页数量
  total: 0, // 总数
  show: false,
  drawerShow: false,
  opt: false,
  formData: formDataFn(),
})
const loading = ref(false)
const formRef = ref()
const props = ref({
  label: 'title',
  children: 'children',
  value: 'menuId',
  disabled: disabledFn,
})

const validateSort = (rule, value, callback) => {
  // 检测只能输入整数
  const regNum = new RegExp('^[0-9]+$', 'g')
  if (!regNum.test(value)) {
    callback(new Error('请输入整数'))
  } else {
    callback()
  }
}

const formRules = {
  title: [{ required: true, message: '请输入', trigger: 'blur' }],
  path: [{ required: true, message: '请输入', trigger: 'blur' }],
  sort: [
    { required: true, message: '请输入', trigger: 'blur' },
    { required: true, trigger: 'blur', validator: validateSort },
  ],
  status: [{ required: true, message: '请选择', trigger: 'blur' }],
  hidden: [{ required: true, message: '请选择', trigger: 'blur' }],
  menuType: [{ required: true, message: '请选择', trigger: 'blur' }],
}
const tableData = ref([])
const dataList = ref([])

onMounted(() => {
  getList()
})

/**
 * @description 计算搜索筛选
 * @returns {Data} data - 列表数据
 */
const filterTableData = computed(() => {
  return deepFilterTree(cloneDeep(tableData.value))
})

/**
 * @description 递归搜索筛选
 * @returns {Data} data - 列表数据
 */
const deepFilterTree = (data) => {
  const dataList = []
  data.forEach((item) => {
    if (item.children && item.children.length) {
      item.children = deepFilterTree(item.children)
      if (item.children.length) {
        dataList.push(item)
      }
      return
    }
    if (item.title.toLowerCase().indexOf(state.searchName.toLowerCase()) > -1) {
      dataList.push(item)
    }
  })
  return dataList
}

watch(
  filterTableData,
  (newVal) => {
    if (newVal && newVal.length) {
      state.total = newVal.length
      handleTableData()
    } else {
      dataList.value = []
      state.total = 0
    }
  },
  {
    immediate: true,
  }
)

const handleTableData = () => {
  dataList.value = markRaw(
    slicePagingData(filterTableData.value, state.page, state.pageSize)
  )
}

/**
 * @description 获取菜单列表
 */
const getList = async () => {
  try {
    const res = await menuList()
    if (res && res.code === 200) {
      tableData.value = res.data
    }
  } catch (error) {
    console.log(error)
  }
}

/**
 * @description 新增、编辑弹框获取菜单详情
 * @param {boolean} opt - false新增；true编辑
 * @param {Row} data - 编辑时对应的表格数据
 */
const addOrEdit = (opt, data) => {
  state.drawerShow = true
  state.opt = opt
  if (opt) {
    state.formData.menuId = data.menuId
    state.formData.parentMenuId = data.parentMenuId
    state.formData.title = data.title
    state.formData.icon = data.icon
    state.formData.path = data.path
    state.formData.sort = data.sort
    state.formData.status = data.status === 1 ? false : true
    state.formData.hidden = data.hidden
    state.formData.menuType = data.menuType
    state.formData.operationPermission = data.operationPermission
  }
}

/**
 * @description 重置新增、编辑表单
 */
const close = () => {
  Object.assign(state.formData, formDataFn())
}

/**
 * @description 新增、编辑菜单
 */
const submit = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      const params = {
        parentMenuId: state.formData.parentMenuId ?? '',
        title: state.formData.title,
        icon: state.formData.icon,
        path: state.formData.path,
        sort: state.formData.sort,
        status: state.formData.status ? 0 : 1,
        hidden: state.formData.hidden,
        menuType: state.formData.menuType,
        operationPermission: state.formData.operationPermission,
      }
      let request = addMenu
      if (state.opt) {
        params.menuId = state.formData.menuId
        request = updMenu
      }
      loading.value = true
      request(params)
        .then((res) => {
          if (res.code === 200) {
            close()
            getList()
            state.drawerShow = false
          }
        })
        .finally(() => {
          loading.value = false
        })
    }
  })
}
</script>

<template>
  <CommonLayout>
    <template #hl>
      <CommonInput
        desc="搜索菜单名称"
        class="w220"
        v-model="state.searchName" />
    </template>
    <template #hr>
      <el-button type="primary" @click="addOrEdit(false)">
        <SvgIcon name="add1" class="fz16 mr3" />
        新建菜单</el-button
      >
    </template>
    <el-table
      :data="dataList"
      border
      row-key="menuId"
      default-expand-all
      style="width: 100%"
      class="nd-table-custom">
      <el-table-column
        prop="title"
        label="菜单名称"
        min-width="100"></el-table-column>
      <el-table-column prop="sort" label="排序" min-width="100" />
      <el-table-column prop="path" label="菜单路径" min-width="180" />
      <el-table-column prop="status" label="状态" min-width="100">
        <template #default="scope">
          <div>
            <span
              class="redio-status"
              :style="{
                'background-color':
                  scope.row.status === 1
                    ? 'var(--eas-color-danger)'
                    : 'var(--eas-color-success)',
              }"></span>
            <span>{{ scope.row.status === 1 ? '禁用' : '启用' }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" min-width="180" />
      <el-table-column prop="updateTime" label="最后修改时间" min-width="180" />
      <el-table-column label="操作" min-width="80">
        <template #default="scope">
          <div class="eas-table-operation">
            <el-button
              text
              type="primary"
              class="is-normal-button mr20"
              @click="addOrEdit(true, scope.row)"
              >修改
            </el-button>
            <!-- <el-button
              text
              type="primary"
              class="is-normal-button mr20"
              :disabled="scope.row.status === 0"
              >删除
            </el-button> -->
          </div>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <Pagination
        v-model:limit="state.pageSize"
        v-model:page="state.page"
        :total="state.total"
        @getData="handleTableData" />
    </template>
  </CommonLayout>
  <CommonDrawer
    v-model="state.drawerShow"
    :loading="loading"
    size="600px"
    ref="commonDrawerRef"
    :title="`${state.formData.menuId !== null ? '编辑菜单' : '新建菜单'}`"
    @close="close"
    @submit="submit">
    <el-form
      :rules="formRules"
      label-position="top"
      label-width="100px"
      :model="state.formData"
      ref="formRef">
      <el-form-item label="选择父级菜单" prop="parentMenuId">
        <el-tree-select
          v-model="state.formData.parentMenuId"
          :data="tableData"
          :props="props"
          check-strictly
          filterable
          clearable
          :render-after-expand="false"
          placeholder="请选择">
        </el-tree-select>
      </el-form-item>
      <el-form-item label="菜单名称" prop="title">
        <CommonInput
          desc="请输入"
          maxlength="20"
          :prefixSlot="false"
          show-word-limit
          v-model="state.formData.title" />
      </el-form-item>
      <el-form-item label="菜单图标" prop="icon">
        <CommonInput
          desc="请输入"
          maxlength="50"
          :prefixSlot="false"
          show-word-limit
          v-model="state.formData.icon" />
      </el-form-item>
      <el-form-item label="菜单路径" prop="path">
        <CommonInput
          desc="请输入"
          maxlength="200"
          :prefixSlot="false"
          show-word-limit
          v-model="state.formData.path" />
      </el-form-item>
      <el-form-item label="菜单排序" prop="sort">
        <CommonInput
          desc="请输入"
          maxlength="3"
          :trimSpace="false"
          :prefixSlot="false"
          show-word-limit
          v-model.trim="state.formData.sort" />
      </el-form-item>
      <el-form-item label="菜单状态" prop="status">
        <el-switch v-model="state.formData.status" />
      </el-form-item>
      <el-form-item label="菜单展示" prop="hidden">
        <el-radio-group v-model="state.formData.hidden">
          <el-radio :value="false">展示</el-radio>
          <el-radio :value="true">不展示</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="使用场景" prop="menuType">
        <el-radio-group v-model="state.formData.menuType">
          <el-radio :value="0">所有用户角色</el-radio>
          <el-radio :value="1">公司管理员</el-radio>
          <el-radio :value="2">超管</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="按钮" prop="operationPermission">
        <CommonInput
          desc="请输入"
          :rows="3"
          type="textarea"
          :prefixSlot="false"
          v-model="state.formData.operationPermission" />
      </el-form-item>
    </el-form>
  </CommonDrawer>
</template>

<style scoped lang="scss">
.el-table {
  .redio-status {
    display: inline-block;
    width: 8px;
    height: 8px;
    margin: 0 5px;
    border-radius: 4px;
  }
}
</style>
