<script setup>
import { onMounted, reactive, ref } from 'vue'
import {
  getSysParms,
  refreshSysParms,
  saveSysParms,
} from '@/api/modules/system-params'
import { cloneDeep } from 'lodash-es'
import { ElMessage, ElMessageBox } from 'element-plus'

const formDataFn = () => ({
  paramName: '',
  paramValue: '',
  description: '',
  paramSwitch: 1,
  usePlatform: 3,
  executionNodeName: '',
})

const state = reactive({
  columns: [
    { prop: 'paramSwitch', label: '参数状态', width: 80 }, // 1:启用,2:关闭
    { prop: 'paramName', label: '参数名称', width: 200 },
    { prop: 'paramValue', label: '参数内容', width: 150 },
    { prop: 'description', label: '参数描述', width: 150 },
    { prop: 'usePlatform', label: '执行环境', width: 80 }, // 1:国内,2:海外,3:通用
    { prop: 'executionNodeName', label: '节点名称', width: 100 },
    { prop: 'updateTime', label: '最后更新时间', width: 160 },
    { prop: 'createTime', label: '创建时间', width: 160 },
    { prop: 'operation', label: '操作', width: 80, fixed: 'right' },
  ],
  tableData: [],
  loading: false,
  drawerShow: false,
  editFlag: false,
  drawerLoading: false,
  formRules: {
    paramName: [{ required: true, message: '请输入', trigger: 'blur' }],
  },
  formData: formDataFn(),
})

const usePlatformMap = new Map([
  [1, '国内'],
  [2, '海外'],
  [3, '通用'],
])

const formRef = ref()

onMounted(() => {
  getData()
})

/**
 * @description 获取列表
 */
const getData = () => {
  state.loading = true
  getSysParms()
    .then((res) => {
      if (res && res.code === 200) {
        state.tableData = res.data
      }
    })
    .finally(() => {
      state.loading = false
    })
}

/**
 * @description 更新缓存
 */
const handleRefresh = () => {
  state.loading = true
  refreshSysParms()
    .then((res) => {
      if (res && res.code === 200) {
        ElMessage.success('操作成功')
      }
    })
    .finally(() => {
      state.loading = false
    })
}

/**
 * @description 新增弹框
 */
const handleAdd = () => {
  state.drawerShow = true
}

/**
 * @description 编辑弹框
 */
const handleEdit = (row) => {
  state.drawerShow = true
  state.editFlag = true
  Object.assign(state.formData, cloneDeep(row))
}

/**
 * @description 启动/关闭
 */
const handleSwitch = async (row, val, index) => {
  try {
    if (val === 2) {
      await ElMessageBox.confirm(
        `确定关闭【${row.paramName}】参数吗？`,
        `提示`,
        {
          type: 'warning',
          closeOnClickModal: false,
          closeOnPressEscape: false,
          center: true,
          customClass: 'nd-message-box-424',
        }
      )
    }
  } catch (error) {
    state.tableData[index].paramSwitch =
      state.tableData[index].paramSwitch === 1 ? 2 : 1
    return
  }
  Object.assign(state.formData, cloneDeep(row))
  state.formData.paramSwitch = val
  state.loading = true
  save('switch')
}

/**
 * @description 重置表单
 */
const close = () => {
  state.editFlag = false
  Object.assign(state.formData, formDataFn())
}

/**
 * @description 提交
 */
const submit = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      state.drawerLoading = true
      save(state.editFlag ? 'edit' : 'add')
    }
  })
}

/**
 * @description 新增、编辑提交表单
 */
const save = (type) => {
  const data = cloneDeep(state.formData)
  saveSysParms(data)
    .then((res) => {
      if (res && res.code === 200) {
        if (type === 'add') {
          ElMessage.success('新增成功')
        } else if (type === 'edit') {
          ElMessage.success('编辑成功')
        } else if (type === 'switch') {
          ElMessage.success(
            `【${data.paramName}】参数已${data.paramSwitch === 1 ? '开启' : '关闭'}`
          )
        } else {
          ElMessage.success('操作成功')
        }
        state.drawerShow = false
        close()
        getData()
      }
    })
    .finally(() => {
      if (type) {
        close()
      }
      state.loading = false
      state.drawerLoading = false
    })
}
</script>
<template>
  <CommonLayout v-loading="state.loading">
    <template #hr>
      <el-button type="primary" @click="handleRefresh"> 更新缓存 </el-button>
      <el-button type="primary" @click="handleAdd">
        <SvgIcon name="add1" class="fz16 mr3" />
        新增参数
      </el-button>
    </template>
    <el-table
      class="nd-table-custom"
      border
      default-expand-all
      :data="state.tableData"
      style="width: 100%">
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column
        v-for="item in state.columns"
        :key="item.prop"
        :label="item.label"
        :prop="item.prop"
        :min-width="item.width"
        :fixed="item.fixed"
        show-overflow-tooltip>
        <template #default="scope">
          <template v-if="item.prop === 'paramSwitch'">
            <el-switch
              v-model="scope.row.paramSwitch"
              :active-value="1"
              :inactive-value="2"
              @change="(val) => handleSwitch(scope.row, val, scope.$index)" />
          </template>
          <template v-if="item.prop === 'usePlatform'">
            {{ usePlatformMap.get(scope.row.usePlatform) }}
          </template>
          <template v-if="item.prop === 'operation'">
            <el-button @click="handleEdit(scope.row)" type="primary" text>
              编辑
            </el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>
  </CommonLayout>
  <CommonDrawer
    v-model="state.drawerShow"
    :loading="state.drawerLoading"
    size="600px"
    ref="commonDrawerRef"
    :title="`${state.editFlag ? '编辑' : '新增'}参数`"
    @close="close"
    @submit="submit">
    <el-form
      :rules="state.formRules"
      label-position="top"
      label-width="100px"
      :model="state.formData"
      ref="formRef">
      <el-form-item label="参数名称" prop="paramName">
        <CommonInput
          desc="请输入"
          :prefixSlot="false"
          v-model="state.formData.paramName"
          :disabled="state.editFlag" />
      </el-form-item>
      <el-form-item label="参数内容" prop="paramValue">
        <CommonInput
          desc="请输入"
          :rows="3"
          type="textarea"
          :prefixSlot="false"
          v-model="state.formData.paramValue" />
      </el-form-item>
      <el-form-item label="参数描述" prop="description">
        <CommonInput
          desc="请输入"
          :rows="3"
          type="textarea"
          :prefixSlot="false"
          v-model="state.formData.description" />
      </el-form-item>
      <el-form-item label="参数状态" prop="paramSwitch">
        <el-switch
          v-model="state.formData.paramSwitch"
          :active-value="1"
          :inactive-value="2" />
      </el-form-item>
      <el-form-item label="执行环境" prop="usePlatform">
        <el-radio-group v-model="state.formData.usePlatform">
          <el-radio :value="1">国内</el-radio>
          <el-radio :value="2">海外</el-radio>
          <el-radio :value="3">通用</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="节点名称" prop="executionNodeName">
        <CommonInput
          desc="请输入"
          :prefixSlot="false"
          v-model="state.formData.executionNodeName" />
      </el-form-item>
    </el-form>
  </CommonDrawer>
</template>
<style lang="scss" scoped></style>
