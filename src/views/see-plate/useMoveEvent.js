// authority 1 查看 2 协作 3 管理
// toOrder里的tyoe 1 看板 2 文件夹 3 空间
export default function () {
  // 未分组
  const unclassified = [-1, -2]
  const moveFolder = (e) => {
    const draggedFolderId = e.draggedContext.element?.id
    const relatedFolderId = e.relatedContext.element?.id
    if (
      unclassified.includes(draggedFolderId) ||
      unclassified.includes(relatedFolderId)
    ) {
      return false
    }
    return true
  }

  const moveSpace = (e) => {
    const draggedAuthority = e.draggedContext.element?.authority
    const relatedAuthority = e.relatedContext.element?.authority
    if (draggedAuthority <= 1) return false
    if (relatedAuthority <= 1) return false
    //
    if (e.draggedContext.element?.type === 'folder' && draggedAuthority < 3)
      return false

    /*  console.log(
      {
        draggedContext: e.draggedContext.element,
        relatedContext: e.relatedContext.element,
      },
      e.draggedContext.element?.type !== e.relatedContext.element?.parentType &&
        e.relatedContext.element?.parentAuthority > 1,
      'moveSpace'
    )*/
    // 防止文件夹拖到文件夹里且目标父级的权限不是查看
    if (
      !e.relatedContext.element ||
      (e.draggedContext.element?.type !==
        e.relatedContext.element?.parentType &&
        e.relatedContext.element?.parentAuthority > 1)
    ) {
      return true
    }
    return false
  }

  /*
  const moveSpace = (e) => {
    const draggedAuthority = e.draggedContext.element?.authority
    const relatedAuthority = e.relatedContext.element?.authority
    if (draggedAuthority <= 1) return false

    console.log(
      {
        draggedContext: e.draggedContext.element,
        relatedContext: e.relatedContext.element,
      },
      e.draggedContext.element?.type !== e.relatedContext.element?.parentType &&
        e.relatedContext.element?.parentAuthority > 1,
      'moveSpace'
    )
    // 是协作或管理且防止文件夹拖到文件夹里
    if (
      relatedAuthority !== 1 &&
      e.draggedContext.element?.type !== e.relatedContext.element?.parentType
    ) {
      return true
    }
    return false
  }
*/

  const moveSpaceDashboard = (e) => {
    const draggedAuthority = e.draggedContext.element?.authority
    const relatedAuthority = e.relatedContext.element?.authority
    /*console.log(
      {
        draggedContext: e.draggedContext.element,
        relatedContext: e.relatedContext.element,
      },
      'moveSpaceDashboard'
    )*/

    if (draggedAuthority <= 1) return false
    if (relatedAuthority <= 1) return false
    // 目标父级的权限不是查看
    if (e.relatedContext.element?.parentAuthority > 1) {
      return true
    }
    /*if (draggedAuthority <= 1) return false
    if (relatedAuthority !== 1) return true*/
    return false
  }

  // 拖动组件配置
  const dragOptions = {
    animation: 100,
    // group: 'description',
    // ghostClass: 'ghost',
    // 指定图标来拖动
    // handle: '.indicator-move',
  }

  return {
    dragOptions,
    moveSpace,
    moveFolder,
    moveSpaceDashboard,
  }
}
