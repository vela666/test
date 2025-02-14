import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ElTree } from 'element-plus'
import {
  filterTree,
  traverseTree,
  findTopLevelParent,
  flattenTree,
} from '@/utils/dataProcessing'
import { isBoolean } from '@/utils/types'
import { uniqBy } from 'lodash-es'

export default function ({ props, emit, selected }) {
  const initVal = () => {
    return {
      isIndeterminate: false,
      search: '',
      checked: false,
      optionalList: [],
      cloneOptionalData: [],
    }
  }
  const state = reactive(initVal())

  const treeRef = ref(null)

  const treeProps = computed(() => {
    return {
      ...ElTree.props.props.default(),
      ...props.props,
    }
  })

  const treeDataFlat = computed(() => {
    return flattenTree(state.cloneOptionalData)
  })

  // 默认选中数据
  const defaultSelectedNode = computed(() => {
    return treeDataFlat.value.filter((item) => item.selected)
  })

  // 默认选中及禁用的
  const defaultSelectedAndDisabledNode = computed(() => {
    // skip在 src/components/CustomElTreeCheckBox/index.vue filter方法里禁用父级时为true
    return defaultSelectedNode.value.filter(
      (item) => item[treeProps.value.disabled] && item.skip !== true
    )
  })

  // 已选列表
  const selectLists = computed(() => {
    const data = treeRef.value?.getCheckedNodes(true) || []
    const ids = data.map((item) => item[props.nodeKey])
    selected.value = data
    emit(
      'change',
      filterTree(props.data, (node) => ids.includes(node[props.nodeKey]))
    )
    return data
  })

  const mapSelectLists = computed(() => {
    return selectLists.value.reduce((p, item) => {
      const topLeavel = findTopLevelParent(
        state.cloneOptionalData,
        item[props.nodeKey],
        props.nodeKey
      )
      if (topLeavel) {
        const label = topLeavel[treeProps.value.label]
        ;(p[label] = p[label] || []).push(item)
      }
      return p
    }, {})
  })

  // src/components/CustomElTreeCheckBox/index.vue filter方法处理了
  const filterMethod = (query, node) => {
    return node.display
  }

  // 设置全选或半选状态
  const setSelected = () => {
    /* const defaultSelectedAndDisabledNodeLen =
      defaultSelectedAndDisabledNode.value.length*/

    if (!state.optionalList.length) {
      state.checked = false
      state.isIndeterminate = false
      return
    }

    const selectListsLen = selectLists.value.length

    const uniqBySelected = uniqBy(
      [...selectLists.value, ...defaultSelectedAndDisabledNode.value],
      props.nodeKey
    )

    const checked = state.optionalList.every((item) => {
      return uniqBySelected.some(
        (n) => n[props.nodeKey] === item[props.nodeKey]
      )
    })

    state.isIndeterminate = !!selectListsLen && !checked

    // 设置全选状态
    if (state.checked !== checked) {
      state.checked = checked
    }
  }

  const checkBoxChange = () => {
    nextTick(() => {
      setSelected()
    })
  }

  const checkedAll = (bool, clearAll = false) => {
    const list = defaultSelectedAndDisabledNode.value
    // 设置勾选节点  平铺的数据
    if (bool) {
      /*  ;[...state.optionalList, ...list].forEach((item) => {
        treeRef.value.setChecked(item, true)
      })*/
      treeRef.value.setCheckedNodes([...state.optionalList, ...list])
      // treeRef.value.setCheckedKeys([882, -2, 884])
    } else {
      treeRef.value.setCheckedNodes(list, true, clearAll)
    }
    state.isIndeterminate = !!selectLists.value.length && !bool
  }

  const delData = (val) => {
    if (isBoolean(val)) {
      checkedAll(false, true)
    } else {
      treeRef.value.setCheckedNodes(val, false, true)
    }
    setSelected()
  }

  const updNode = (data = selectLists.value) => {
    nextTick(() => {
      // 仅保留未禁用和needFilter为false和显示的数据
      state.optionalList = treeDataFlat.value.filter(
        (item) =>
          !item[treeProps.value.disabled] &&
          !item.needFilter &&
          item.display !== false
      )
      treeRef.value.setCheckedNodes(data)
      setSelected()
    })
  }

  watch(
    () => props.data,
    (val) => {
      // Object.assign(state, initVal())
      // 回显方式1：在传递props.data前修改props.data自身的数据
      //  data = traverseTree(data, (item) => {
      //     item.disabled = true
      //     item.selected = true
      //  })
      // 回显方式2：要在props.data有值前给 props.selectedList赋值 才能实现回显

      const selectedMap = new Map(
        props.selectedList.map((item) => [item[props.nodeKey], item])
      )
      state.cloneOptionalData = traverseTree(
        filterTree(val, (node) => {
          const data = selectedMap.get(node[props.nodeKey])
          // 过滤 notShow 为true的
          if (data) {
            return !data.notShow
          }
          return !node.notShow
        }),
        (item, parent) => {
          // 有子级的过滤掉
          if (item[treeProps.value.children]?.length) {
            item.needFilter = true
          }
          // 回显列表
          if (props.selectedList.length) {
            const data = selectedMap.get(item[props.nodeKey])
            // 处理选中和禁用的节点
            if (data) {
              Object.assign(item, data, {
                selected: data.selected ?? true,
                [treeProps.value.disabled]: data[treeProps.value.disabled],
                notShow: data.notShow,
              })

              // 更新父级里的值
              if (parent) {
                parent[treeProps.value.children].forEach((sub) => {
                  if (sub[props.nodeKey] === item[props.nodeKey]) {
                    sub[treeProps.value.disabled] =
                      item[treeProps.value.disabled]
                  }
                })
              }
            }
          }
          if (parent) {
            // console.log(parent[treeProps.value.children])
            parent[treeProps.value.disabled] = parent[
              treeProps.value.children
            ].every((sub) => sub[treeProps.value.disabled])
          }

          if (
            item.hasOwnProperty(treeProps.value.children) &&
            !item[treeProps.value.children].length
          ) {
            item[treeProps.value.disabled] = true
          }
        }
      ).map((item) => {
        return {
          ...item,
          [treeProps.value.disabled]: item[treeProps.value.children]?.every(
            (sub) => sub[treeProps.value.disabled]
          ),
        }
      })

      state.cloneOptionalData = filterTree(state.cloneOptionalData, (node) => {
        // 过滤 notShow 为true的
        return !node.notShow
      })

      updNode(defaultSelectedNode.value)
    },
    {
      immediate: true,
    }
  )

  // 仅保留未禁用和needFilter为false和显示的数据
  watch(
    treeDataFlat,
    (val) => {
      state.optionalList = val.filter(
        (item) =>
          !item[treeProps.value.disabled] &&
          !item.needFilter &&
          item.display !== false
      )
    },
    {
      immediate: true,
    }
  )

  watch(
    () => state.search,
    (val) => {
      treeRef.value.filter(val)
    }
  )

  return {
    state,
    treeRef,
    treeProps,
    selectLists,
    treeDataFlat,
    mapSelectLists,
    defaultSelectedNode,
    defaultSelectedAndDisabledNode,
    delData,
    updNode,
    checkedAll,
    filterMethod,
    checkBoxChange,
  }
}
