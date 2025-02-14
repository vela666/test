<template>
  <el-form-item
    :rules="[{ required: true, message: t('common.pleaseSelect') }]"
    :label="label || t('btn.moveTo')"
    :prop="prop">
    <el-tree-select
      filterable
      :class="['nd-move-data-tree-select', props.class]"
      :data="selectList"
      :node-key="kanBanDataUniqueKey"
      :props="{
        disabled: 'selectDisabled',
        label: 'name',
        class() {
          return 'nd-data-tree-select-item'
        },
      }"
      check-strictly
      default-expand-all
      v-model="value">
      <template #default="{ data }">
        <div class="flex-center" :class="{ 'txt-bold': data.topLevel }">
          <SvgIcon
            :class="{
              c86919d:
                !data.topLevel &&
                !data.selectDisabled &&
                value !== data[kanBanDataUniqueKey],
            }"
            class="fz18 mr5"
            v-if="data.icon"
            :name="data.icon" />
          <span>{{ data.name }}</span>
        </div>
      </template>
    </el-tree-select>
  </el-form-item>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { filterTree, recursionFindData } from '@/utils/dataProcessing'
import { mapKanBanList } from '@/views/see-plate/utils'
import { kanBanDataUniqueKey, ungroupedFolders } from '@/views/see-plate/enum'
import { isObject } from '@/utils/types'
// import useUserStore from '@/store/modules/user'
import useSeePlateStore from '@/store/modules/see-plate'
import useUnifiedPanelStore from '@/store/modules/unified-panel.js'
import { useI18n } from 'vue-i18n'

// const userStore = useUserStore()
const { t } = useI18n()
const useSeePlate = useSeePlateStore()
const unifiedPanelStore = useUnifiedPanelStore()

const props = defineProps({
  class: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  prop: {
    type: String,
    default: 'folderId',
  },
  // 选择的文件夹或看板数据
  selectData: {
    type: Object,
    default() {
      return {}
    },
  },
  needShare: {
    type: Boolean,
    default: false,
  },
  // 综合看板
  comprehensive: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['change'])
const value = defineModel({
  type: [String, Number],
  default: '',
})

/*
const userId = computed(() => {
  return userStore.userInfo.userId
})
*/

const optionalList = computed(() => {
  return mapKanBanList({
    data: props.comprehensive
      ? unifiedPanelStore.leftCompleteData
      : useSeePlate.leftCompleteData,
    delKey: props.needShare ? [] : ['shareModule'],
  })
})

const typeEnum = ['folder', 'space']
const shareTypeEnum = ['dashboard', 'folder']
const selectList = computed(() => {
  let data = filterTree(optionalList.value, (node, parent) => {
    if (props.selectData.parentId === parent[kanBanDataUniqueKey]) {
      parent.selectDisabled = true
    }

    let bool = typeEnum.includes(node.type)

    if (props.needShare) {
      bool = !shareTypeEnum.includes(node.type)
    }
    // return bool && (!node.authority || node.authority > 1)
    return (
      bool &&
      (!node.authority ||
        ungroupedFolders.includes(node[kanBanDataUniqueKey]) ||
        node.authority > 1)
    )
  })

  if (isObject(props.selectData) && Object.keys(props.selectData).length) {
    const isFolder = props.selectData.type === 'folder'
    if (isFolder) {
      // 我创建的
      const isOwnerModule = props.selectData.topLevelId === 'ownerModule'

      const isSpacesNode = (node) => node.type === 'space'

      const isKanbanCreatedNode = (node) =>
        node[kanBanDataUniqueKey] === 'ownerModule'

      data = filterTree(data, (node, parent) => {
        // 空间禁用
        if (
          !isOwnerModule &&
          props.selectData.parentId === parent[kanBanDataUniqueKey]
        ) {
          parent.selectDisabled = true
        }
        return isOwnerModule
          ? isSpacesNode(node)
          : isSpacesNode(node) || isKanbanCreatedNode(node)
      })
    }

    // 是空间且当前登陆用户不是创建者
    /*    if (
      props.selectData.topLevelId === 'spaceModule' &&
      // props.selectData.authority === 2 &&
      props.selectData.createUserId !== userId.value
    ) {
      data = filterTree(data, (node, parent) => {
        return (
          // 协作者
          parent.authority === 2 &&
          parent.subIds.includes(props.selectData[kanBanDataUniqueKey])
        )
      })
    }*/
  }
  return data.map((item) => {
    let selectDisabled =
      props.selectData.topLevelId === 'ownerModule' ||
      props.selectData.type !== 'folder' ||
      item[kanBanDataUniqueKey] === 'spaceModule'

    if (props.needShare) {
      selectDisabled = item[kanBanDataUniqueKey] === 'spaceModule'
    }
    return {
      ...item,
      selectDisabled,
    }
  })
})

const formRef = ref(null)

watch(
  value,
  (val) => {
    if (!(val + '')) return
    emit(
      'change',
      recursionFindData(optionalList.value, val, kanBanDataUniqueKey)
    )
  },
  {
    immediate: true,
  }
)

defineOptions({
  name: 'SelectFolderOrSpace',
})
</script>

<style lang="scss">
.nd-move-data-tree-select {
  .nd-data-tree-select-item {
    /*  > .el-tree-node__content {
      .el-select-dropdown__item {
        cursor: default;
        color: var(--eas-text-color-primary);
      }
    }*/
    .el-tree-node__content {
      height: 40px;
    }
    .selected {
      * {
        color: var(--eas-color-primary) !important;
      }
    }
    .el-select-dropdown__item {
      padding-left: 0;
    }
    /*.el-icon {
      display: none;
    }*/
  }
}
</style>
