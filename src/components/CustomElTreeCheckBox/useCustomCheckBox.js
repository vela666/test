import { computed } from 'vue'
import {
  findAllParentItems,
  findAllSubItems,
  findParentData,
  flattenTree,
} from '@/utils/dataProcessing'

const checkStrictlyKey = ['check-strictly', 'checkStrictly']
export default function ({ config, attrs, uniqueKey, dataList }) {
  const isCheckStrictlyTrue = computed(() => {
    const hasCheckStrictly = Object.keys(attrs).some((key) => {
      return checkStrictlyKey.includes(key)
    })

    if (hasCheckStrictly) {
      return !checkStrictlyKey.some((key) => {
        return attrs[key] === false
      })
    }
    return false
  })

  /*  function updateCheckedStatus(node, checked) {
    if (node?.[config.children]?.length) {
      node[config.children].forEach((child) => {
        if (!child[config.disabled]) {
          child.checked = checked
        }
        updateCheckedStatus(child, checked)
      })
    }
  }*/

  // 递归检查树结构中某一层的所有节点的 checked 属性是否都为 true
  function isAllChildrenChecked(node, notSkipDisabled = false) {
    // 如果当前节点没有子节点，直接返回当前节点的 checked 属性
    if (!node?.[config.children]?.length) {
      return node.checked
    }

    // 跳过未显示的节点
    if (node.display === false) {
      return true
    }

    // 遍历当前节点的子节点，递归检查每个子节点
    for (const child of node[config.children]) {
      if (
        (notSkipDisabled && child[config.disabled]) ||
        child.display === false
      ) {
        continue
      }

      // 递归检查当前子节点
      if (!isAllChildrenChecked(child, notSkipDisabled)) {
        // 如果有一个子节点的 checked 属性为 false，就返回 false
        return false
      }
    }

    return true // 所有子节点的 checked 属性都为 true，返回 true
  }

  // 判断所有节点是否有选中
  /*function isAnyNodeChecked(node) {
    // 检查当前节点的 checked 属性是否为 true
    if (node.checked)  return true;

    // 如果 checked 属性不存在，检查 children 是否存在
    if (node && node.children && node.children.length > 0) {
      // 遍历子节点，递归调用 isAnyNodeChecked
      for (let i = 0; i < node.children.length; i++) {
        if (isAnyNodeChecked(node.children[i])) {
          return true; // 如果任何一个子节点是 checked，则返回 true
        }
      }
    }

    // 如果没有找到任何 checked 节点，则返回 false
    return false;
  }*/

  function hasAnyChildChecked(node) {
    // 检查当前节点的 children 是否存在
    if (node?.[config.children]?.length) {
      // 遍历子节点，检查每个子节点的 checked 属性
      for (let i = 0; i < node[config.children].length; i++) {
        // 如果当前子节点的 checked 属性为 true且为显示，返回 true
        if (
          node[config.children][i].checked &&
          node[config.children][i].display !== false
        ) {
          return true
        }

        // 递归调用 isAnyChildChecked，检查当前子节点的子节点
        if (hasAnyChildChecked(node[config.children][i])) return true
      }
    }
    // 如果没有找到任何子节点的 checked 属性为 true，则返回 false
    return false
  }

  // leafOnly true, 它将返回当前选中节点的子节点(不包含父节点)
  // includeHalfChecked true, 返回值包含半选中节点数据
  const getCheckedNodes = (leafOnly = false, includeHalfChecked = false) => {
    const checkedNodes = []
    const traverse = (node) => {
      node?.forEach((child) => {
        // if ((child.checked || includeHalfChecked && child.indeterminate) && (!leafOnly || leafOnly && child.isLeaf)) {
        if (
          (child.checked || (includeHalfChecked && child.indeterminate)) &&
          (!leafOnly || !child?.[config.children]?.length)
        ) {
          checkedNodes.push(child)
        }
        traverse(child[config.children])
      })
    }
    traverse(dataList.value)
    return checkedNodes
  }

  // leafOnly true, 它只返回当前选中的子节点数组。
  const getCheckedKeys = (leafOnly = false) => {
    return getCheckedNodes(leafOnly).map(
      (data) => (data || {})[uniqueKey.value]
    )
  }

  const handleSubNodeCheckedAndIndeterminate = (
    data,
    checked,
    targetIds = null
  ) => {
    let subItems = findAllSubItems(data, config.children)
    subItems.reverse().forEach((item) => {
      if (
        !item[config.disabled] &&
        (!targetIds || targetIds.includes(item[uniqueKey.value])) &&
        item.display !== false
      ) {
        item.checked = checked
      }

      if (item?.[config.children]?.length) {
        item.indeterminate =
          hasAnyChildChecked(item) && !isAllChildrenChecked(item)
      }
    })
  }

  // 清空时clearAll为true
  const setCheckedNodes = (data, checked = true, clearAll = false) => {
    data = Array.isArray(data) ? data : [data]
    setCheckedKeys(
      data.map((item) => (item || {})[uniqueKey.value]),
      checked,
      clearAll
    )
  }

  // 清空时clearAll为true
  const setCheckedKeys = (targetIds, checked = true, clearAll = false) => {
    let data = flattenTree(dataList.value)
    data.reverse().forEach((node) => {
      if (node.display !== false || clearAll) {
        if (checked === false) {
          // 如果targetIds存在则为false 否则为自身的值
          node.checked = targetIds.includes(node[uniqueKey.value])
            ? checked
            : node.checked
        } else {
          node.checked = targetIds.includes(node[uniqueKey.value])
        }

        if (node?.[config.children]?.length) {
          if (!isCheckStrictlyTrue.value) {
            if (node.checked) {
              handleSubNodeCheckedAndIndeterminate(
                node,
                checked,
                checked ? null : targetIds
              )
            }
            const anyChildChecked = hasAnyChildChecked(node)
            node.indeterminate = anyChildChecked && !isAllChildrenChecked(node)
            node.checked = isAllChildrenChecked(node, anyChildChecked)
          }
        }
      }
    })
    // 更改源数据
    /*   function internalSetChecked(tree) {
      tree.forEach((node) => {
        if (targetIds.includes(node[uniqueKey.value])) {
          node.checked = checked
        }

        if (node?.[config.children]?.length) {
          internalSetChecked(node[config.children])
          if (!isCheckStrictlyTrue.value) {
            if (node.checked) {
              handleSubNodeCheckedAndIndeterminate(
                node,
                checked,
                checked ? null : targetIds
              )
            }
            node.indeterminate =
              hasAnyChildChecked(node) && !isAllChildrenChecked(node)
            node.checked = isAllChildrenChecked(node, true)
          }
        }
      })
    }
    internalSetChecked(dataList.value)*/
    // 返回新数据
    /* return tree.map((node) => {
      const newNode = { ...node } // 创建节点的浅拷贝，以避免修改原始树
      if (targetIds.includes(newNode.id)) {
        newNode.checked = true
      }
      if (node?.children?.length) {
        newNode.children = setCheckedKeys(targetIds, newNode.children)

        newNode.indeterminate =
          hasAnyChildChecked(newNode) && !isAllChildrenChecked(newNode)
        newNode.checked = isAllChildrenChecked(newNode)
      }

      return newNode
    })*/
  }

  const clearAllSelection = () => {
    let data = flattenTree(dataList.value)
    data.forEach((item) => {
      if (item.indeterminate !== undefined) {
        item.indeterminate = false
      }

      if (item.checked !== undefined) {
        item.checked = false
      }
    })

    /*const resetCheckedValues = (tree) => {
      tree.forEach((item) => {
        if (item.indeterminate !== undefined) {
          item.indeterminate = false
        }

        if (item.checked !== undefined) {
          item.checked = false
        }

        if (item?.[config.children]?.length) {
          resetCheckedValues(item[config.children])
        }
      })
    }

    resetCheckedValues(dataList.value)*/
  }

  const checkBoxChange = (checked, currentData) => {
    if (isCheckStrictlyTrue.value) return
    const parentData = findParentData(
      dataList.value,
      currentData[uniqueKey.value],
      uniqueKey.value,
      config.children
    )
    // 没有父级或有子级
    if (!parentData || currentData?.[config.children]?.length) {
      // updateCheckedStatus(currentData, checked)
      handleSubNodeCheckedAndIndeterminate(currentData, checked)
      currentData.indeterminate =
        hasAnyChildChecked(currentData) && !isAllChildrenChecked(currentData)
    }

    if (!parentData) return

    const allParentItems = findAllParentItems(
      dataList.value,
      currentData[uniqueKey.value],
      false,
      uniqueKey.value,
      config.children
    )
    allParentItems.reverse().forEach((item) => {
      const anyChecked = hasAnyChildChecked(item)
      item.indeterminate = anyChecked && !isAllChildrenChecked(item)
      item.checked = isAllChildrenChecked(item, anyChecked)
    })
  }

  return {
    checkBoxChange,
    getCheckedNodes,
    getCheckedKeys,
    setCheckedKeys,
    setCheckedNodes,
    clearAllSelection,
  }
}
