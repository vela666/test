<template>
  <div ref="el" :id="boxCls" class="nd-grid-layout-container">
    <div
      v-for="item of gridData"
      class="grid-stack-item sub-grid-stack-item"
      :gs-x="item.x"
      :gs-y="item.y"
      :gs-id="item.mark"
      :gs-h="item.h"
      :gs-w="item.w"
      :gs-min-h="item.minH"
      :gs-min-w="item.minW"
      :gs-max-w="item.maxW"
      :gs-max-h="item.maxH"
      :gs-no-resize="item.noResize"
      :id="item.mark"
      :key="item.mark">
      <div class="grid-stack-item-content">
        <slot :item="item" :removeItem="() => removeItem(item.mark)"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import 'gridstack/dist/gridstack.min.css'
import { GridStack } from 'gridstack'
import { debounce, throttle } from 'lodash-es'
import { layoutColumn } from '@/views/see-plate/enum.js'

const props = defineProps({
  // 是否允许拖拽等
  staticGrid: {
    type: Boolean,
    default: false,
  },
  // 唯一键
  uniqueKey: {
    type: String,
    default: 'mark',
  },
  // 待选数据
  list: {
    type: Array,
    default: () => [],
  },
  noResize: {
    type: Boolean,
    default: false,
  },
  noDrag: {
    type: Boolean,
    default: false,
  },
  cellHeight: {
    type: [Number, String],
    default: 110,
  },
  parentCls: {
    type: String,
    default: '',
  },
  // 用于实例化时区分多个容器，以免冲突
  boxCls: {
    type: String,
    default: '',
  },
  margin: {
    type: [Number, String],
    default: 10,
  },
  // 指定拖动元素的类名 如 handler render方式渲染不支持
  dragHandle: {
    type: String,
    default: '',
  },
  minRow: {
    type: Number,
    default: 0,
  },
  // 外部拖拽的容器类名(选择器（例如'.dashboard-drag-in .dashboard-drag-in-item')
  // https://gridstackjs.com/demo/two.html
  /*
  <div class="dashboard-drag-in">
     <div class="dashboard-drag-in-item">
       <div class="drag-handle">拖我</div>
       内容
     </div>
  </div>
  */
  // externalDragIn=".dashboard-drag-in .dashboard-drag-in-item" 则是最后一个类名 "dashboard-drag-in-item" 整个可拖拽
  externalDragIn: {
    type: String,
    default: '.dashboard-drag-in .dashboard-drag-in-item',
  },
  // 指定拖动的类名
  externalDragHandle: {
    type: String,
    default: '.drag-handle',
  },
})

const emit = defineEmits(['layoutChange'])

// 已知问题 h设为1时 获取不到 h字段
// h和w  minH和minW 必须有一对
// [{id: '1', w: 6, h: 4, x: 0, y: 10}]
const gridData = defineModel({
  type: Array,
  default() {
    return []
  },
  set(val) {
    return val
  },
})
// 不要使用 ref(null) 作为代理 在比较结构时会破坏所有逻辑.
// see https://github.com/gridstack/gridstack.js/issues/2115
let myGridStack = null
let requestIdleCallbackId = null
// https://github.com/gridstack/gridstack.js/tree/master/doc
const gridOptions = {
  // animate: false,
  // float: false,
  // 不初始化项目
  // auto: false,
  // cellHeightThrottle: 500,
  cellHeight: props.cellHeight,
  disableResize: props.noResize,
  disableDrag: props.noDrag,
  // 只有该类名的元素才能拖动
  // handle: '.' + props.dragHandle,
  handleClass: props.dragHandle,
  margin: props.margin,
  /*  marginTop: 0,
  marginRight: 5,
  marginBottom: 20,
  marginLeft: 5,*/
  staticGrid: props.staticGrid,
  resizable: {
    // 只允许从某个方向调整大小
    // s 下,n 上,ne 右上,e 右边,se 右下,sw 左下,w 左边,nw 左上
    handles: 'se',
  },
  draggable: {
    // 当元素被拖动到网格底部或顶部时启用或禁用滚动条滚动, 自带的有问题,自己实现
    scroll: false,
  },
  column: layoutColumn,
  // 最小行数，防止网格在空时崩溃。
  minRow: props.minRow,
  styleInHead: true,
  disableOneColumnMode: true,
  // rtl: true,
  // 接受从其他网格或外部拖动的元素
  acceptWidgets(el) {
    return true
  },
}
const el = ref(null)
const layoutData = computed(() => {
  return [...gridData.value, ...props.list]
})

const execLayoutChange = () => {
  emit('layoutChange', getSaveLayout())
}

const removeItem = (target) => {
  gridData.value = gridData.value.filter((item) => {
    return item.mark !== target
  })
  myGridStack.removeWidget(`#${target}`)
  execLayoutChange()
}

const updateInfo = (target, data) => {
  nextTick(() => {
    // console.log(target, 'target')
    myGridStack.update(target, data)
    // updLayout()
  })
}

// 重新布局
const updLayout = () => {
  nextTick(() => {
    // 重新布局
    // list 保持小部件的左->右顺序相同，即使这意味着如果不合适则留下一个空槽
    // compact 可能会重新排序项目以填补任何空白
    // doSort-false让您提前进行自己的排序，以防您需要控制不同的顺序。（默认排序）
    // compact(layout = 'compact', doSort = true)
    myGridStack.compact('list')
  })
}

const makeLayout = (node) => {
  nextTick(() => {
    myGridStack.makeWidget(`#${node}`)
    // execLayoutChange()
  })
}

const findGridData = (id) => {
  return layoutData.value.find((val) => val[props.uniqueKey] === id)
}

const getSaveLayout = (saveContent = false, saveGridOpt = false) => {
  return myGridStack.getGridItems().map((item) => {
    const id = item.getAttribute('id')
    const w = +item.getAttribute('gs-w') || 6
    const h = +item.getAttribute('gs-h') || 1
    const x = +item.getAttribute('gs-x')
    const y = +item.getAttribute('gs-y')
    return {
      ...findGridData(id),
      w,
      h,
      x,
      y,
    }
  })
  // return myGridStack.save(saveContent, saveGridOpt)
}

// 返回实例化
const getMyGridStack = () => {
  return myGridStack
}

//清空所有
const removeAll = () => {
  gridData.value = []
  myGridStack.removeAll()
}

// 设置外部拖入
const setExternalDrag = () => {
  if (!props.externalDragIn) return
  requestIdleCallbackId && window.cancelIdleCallback(requestIdleCallbackId)
  requestIdleCallbackId = window.requestIdleCallback(
    () => {
      GridStack.setupDragIn(props.externalDragIn, {
        handle: props.externalDragHandle,
        helper(event) {
          return event.target.cloneNode(true)
        },
      })
    },
    {
      timeout: 300,
    }
  )
}

const initLayout = () => {
  nextTick(() => {
    // https://github.com/gridstack/gridstack.js/tree/master/doc#resizableel-val
    // 不要使用 grid.value = GridStack.init()
    myGridStack?.destroy(false)
    myGridStack = GridStack.init(
      gridOptions,
      // 指定容器区分实例
      `#${props.boxCls}`
    )
    let execStartDrag = false
    let isMousewheel = false
    let parentEl = null
    let timeoutId = null
    // 拖动时禁止滚动条
    const parentElMousewheel = (e) => {
      clearTimeout(timeoutId)
      // e.preventDefault()
      isMousewheel = true
      timeoutId = setTimeout(() => {
        isMousewheel = false
        timeoutId = null
      }, 1500)
    }
    if (props.parentCls) {
      parentEl = document.querySelector(`${props.parentCls}`)
      let startElPos = 0
      // 拖动开始  从外部拖拽进来的不会执行这事件
      myGridStack.on('dragstart', (event, el) => {
        console.log('dragstart')
        startElPos = el.getBoundingClientRect().top
        execStartDrag = true
      })

      // 拖动中
      myGridStack.on(
        'drag',
        throttle((event, el) => {
          parentEl?.removeEventListener('wheel', parentElMousewheel, {
            passive: false,
          })
          parentEl.addEventListener('wheel', parentElMousewheel, {
            passive: false,
          })
          // 鼠标滑轮没有滚动
          if (!isMousewheel) {
            const dragEl = document.querySelector(
              `#${props.boxCls} .grid-stack-placeholder`
            )
            let current = dragEl?.getBoundingClientRect()
            if (!current) return
            // 从外部拖拽进来时位置
            if (!execStartDrag && startElPos === 0) {
              startElPos = current.top
            }
            // let top = 0

            // 获取当前拖动元素的位置信息
            /*      let current = el.getBoundingClientRect()
               let top = 0
               // 从外部拖拽进来时位置
               if (!execStartDrag) {
                 const dragEl = document.querySelector(
                   `#${props.boxCls} .grid-stack-placeholder`
                 )
                 const dragPos = dragEl.getBoundingClientRect()
                 if (startElPos === 0) {
                   startElPos = dragPos.top
                 }
                 current = dragPos
               }*/

            // 向下拖动
            /*   if (current.top > startElPos) {
                 console.log('向下')
                 // top = current.top - startElPos + current.height
                 top = startElPos + current.height / 2
               } // 向上拖动
               else if (current.top < startElPos) {
                 console.log('向上')
                 // top = -(startElPos - current.top + current.height)
                 top = -(startElPos + current.height / 2)
               }
             */
            parentEl.scrollTo({
              top: parentEl.scrollTop + (current.top - startElPos),
              behavior: 'smooth',
            })
          }
        }, 150)
      )
    }

    //更改位置/大小
    myGridStack.on(
      'change',
      debounce((event, items) => {
        parentEl?.removeEventListener('wheel', parentElMousewheel, {
          passive: false,
        })
        execLayoutChange()
      })
    )
    // 添加
    myGridStack.on('added', (event, items) => {
      parentEl?.removeEventListener('wheel', parentElMousewheel, {
        passive: false,
      })
    })

    // 删除
    myGridStack.on('removed', (event, items) => {
      setExternalDrag()
    })

    // 拖动停止
    myGridStack.on('dragstop', (event, el) => {
      parentEl?.removeEventListener('wheel', parentElMousewheel, {
        passive: false,
      })
      execStartDrag = false
      // emit('layoutChange', getSaveLayout())
    })

    // 外部拖拽进入
    myGridStack.on('dropped', (event, previousWidget, newWidget) => {
      // 如果 setupDragIn 用了helper 则需要执行该函数 删除 不然会多出个相同元素
      const id = newWidget.id
      myGridStack.removeWidget(newWidget.el)
      const params = {
        ...findGridData(id),
        x: newWidget.x,
        y: newWidget.y,
      }
      gridData.value.push(params)
      makeLayout(params.mark)
    })
    setExternalDrag()
    execLayoutChange()
  })
}

defineExpose({
  el,
  removeAll,
  updLayout,
  updateInfo,
  removeItem,
  initLayout,
  makeLayout,
  getSaveLayout,
  getMyGridStack,
  setExternalDrag,
})

defineOptions({
  name: 'GridLayout',
})
</script>

<style lang="scss">
.nd-grid-layout-container {
  .grid-stack-item-content {
    border-radius: 4px;
    overflow: hidden !important;
  }
  .placeholder-content {
    background-color: var(--eas-hover-color-1);
  }
  .ui-draggable-dragging,
  .ui-resizable-resizing {
    > .grid-stack-item-content {
      box-shadow: 0 3px 6px 1px rgba(28, 39, 80, 0.2);
    }
  }
  .ui-resizable-autohide > .ui-resizable-handle {
    display: block;
  }
  .ui-resizable-handle.ui-resizable-se {
    background: none;
    transform: none;
    &:after {
      content: '';
      width: 8px;
      height: 8px;
      position: absolute;
      right: 3px;
      bottom: 3px;
      border-right: 2px solid var(--eas-color-primary);
      border-bottom: 2px solid var(--eas-color-primary);
    }
  }
}

/*.grid-stack {
  background: #fafad2;
}

.grid-stack-item-content {
  text-align: center;
  background-color: #18bc9c;
  overflow: hidden !important;
}

.grid-stack-item-removing {
  opacity: 0.5;
}

.trash {
  height: 100px;
  background: rgba(255, 0, 0, 0.1) center center
    url(data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTYuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjY0cHgiIGhlaWdodD0iNjRweCIgdmlld0JveD0iMCAwIDQzOC41MjkgNDM4LjUyOSIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDM4LjUyOSA0MzguNTI5OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxnPgoJPGc+CgkJPHBhdGggZD0iTTQxNy42ODksNzUuNjU0Yy0xLjcxMS0xLjcwOS0zLjkwMS0yLjU2OC02LjU2My0yLjU2OGgtODguMjI0TDMwMi45MTcsMjUuNDFjLTIuODU0LTcuMDQ0LTcuOTk0LTEzLjA0LTE1LjQxMy0xNy45ODkgICAgQzI4MC4wNzgsMi40NzMsMjcyLjU1NiwwLDI2NC45NDUsMGgtOTEuMzYzYy03LjYxMSwwLTE1LjEzMSwyLjQ3My0yMi41NTQsNy40MjFjLTcuNDI0LDQuOTQ5LTEyLjU2MywxMC45NDQtMTUuNDE5LDE3Ljk4OSAgICBsLTE5Ljk4NSw0Ny42NzZoLTg4LjIyYy0yLjY2NywwLTQuODUzLDAuODU5LTYuNTY3LDIuNTY4Yy0xLjcwOSwxLjcxMy0yLjU2OCwzLjkwMy0yLjU2OCw2LjU2N3YxOC4yNzQgICAgYzAsMi42NjQsMC44NTUsNC44NTQsMi41NjgsNi41NjRjMS43MTQsMS43MTIsMy45MDQsMi41NjgsNi41NjcsMi41NjhoMjcuNDA2djI3MS44YzAsMTUuODAzLDQuNDczLDI5LjI2NiwxMy40MTgsNDAuMzk4ICAgIGM4Ljk0NywxMS4xMzksMTkuNzAxLDE2LjcwMywzMi4yNjQsMTYuNzAzaDIzNy41NDJjMTIuNTY2LDAsMjMuMzE5LTUuNzU2LDMyLjI2NS0xNy4yNjhjOC45NDUtMTEuNTIsMTMuNDE1LTI1LjE3NCwxMy40MTUtNDAuOTcxICAgIFYxMDkuNjI3aDI3LjQxMWMyLjY2MiwwLDQuODUzLTAuODU2LDYuNTYzLTIuNTY4YzEuNzA4LTEuNzA5LDIuNTctMy45LDIuNTctNi41NjRWODIuMjIxICAgIEM0MjAuMjYsNzkuNTU3LDQxOS4zOTcsNzcuMzY3LDQxNy42ODksNzUuNjU0eiBNMTY5LjMwMSwzOS42NzhjMS4zMzEtMS43MTIsMi45NS0yLjc2Miw0Ljg1My0zLjE0aDkwLjUwNCAgICBjMS45MDMsMC4zODEsMy41MjUsMS40Myw0Ljg1NCwzLjE0bDEzLjcwOSwzMy40MDRIMTU1LjMxMUwxNjkuMzAxLDM5LjY3OHogTTM0Ny4xNzMsMzgwLjI5MWMwLDQuMTg2LTAuNjY0LDguMDQyLTEuOTk5LDExLjU2MSAgICBjLTEuMzM0LDMuNTE4LTIuNzE3LDYuMDg4LTQuMTQxLDcuNzA2Yy0xLjQzMSwxLjYyMi0yLjQyMywyLjQyNy0yLjk5OCwyLjQyN0gxMDAuNDkzYy0wLjU3MSwwLTEuNTY1LTAuODA1LTIuOTk2LTIuNDI3ICAgIGMtMS40MjktMS42MTgtMi44MS00LjE4OC00LjE0My03LjcwNmMtMS4zMzEtMy41MTktMS45OTctNy4zNzktMS45OTctMTEuNTYxVjEwOS42MjdoMjU1LjgxNVYzODAuMjkxeiIgZmlsbD0iI2ZmOWNhZSIvPgoJCTxwYXRoIGQ9Ik0xMzcuMDQsMzQ3LjE3MmgxOC4yNzFjMi42NjcsMCw0Ljg1OC0wLjg1NSw2LjU2Ny0yLjU2N2MxLjcwOS0xLjcxOCwyLjU2OC0zLjkwMSwyLjU2OC02LjU3VjE3My41ODEgICAgYzAtMi42NjMtMC44NTktNC44NTMtMi41NjgtNi41NjdjLTEuNzE0LTEuNzA5LTMuODk5LTIuNTY1LTYuNTY3LTIuNTY1SDEzNy4wNGMtMi42NjcsMC00Ljg1NCwwLjg1NS02LjU2NywyLjU2NSAgICBjLTEuNzExLDEuNzE0LTIuNTY4LDMuOTA0LTIuNTY4LDYuNTY3djE2NC40NTRjMCwyLjY2OSwwLjg1NCw0Ljg1MywyLjU2OCw2LjU3QzEzMi4xODYsMzQ2LjMxNiwxMzQuMzczLDM0Ny4xNzIsMTM3LjA0LDM0Ny4xNzJ6IiBmaWxsPSIjZmY5Y2FlIi8+CgkJPHBhdGggZD0iTTIxMC4xMjksMzQ3LjE3MmgxOC4yNzFjMi42NjYsMCw0Ljg1Ni0wLjg1NSw2LjU2NC0yLjU2N2MxLjcxOC0xLjcxOCwyLjU2OS0zLjkwMSwyLjU2OS02LjU3VjE3My41ODEgICAgYzAtMi42NjMtMC44NTItNC44NTMtMi41NjktNi41NjdjLTEuNzA4LTEuNzA5LTMuODk4LTIuNTY1LTYuNTY0LTIuNTY1aC0xOC4yNzFjLTIuNjY0LDAtNC44NTQsMC44NTUtNi41NjcsMi41NjUgICAgYy0xLjcxNCwxLjcxNC0yLjU2OCwzLjkwNC0yLjU2OCw2LjU2N3YxNjQuNDU0YzAsMi42NjksMC44NTQsNC44NTMsMi41NjgsNi41N0MyMDUuMjc0LDM0Ni4zMTYsMjA3LjQ2NSwzNDcuMTcyLDIxMC4xMjksMzQ3LjE3MnogICAgIiBmaWxsPSIjZmY5Y2FlIi8+CgkJPHBhdGggZD0iTTI4My4yMiwzNDcuMTcyaDE4LjI2OGMyLjY2OSwwLDQuODU5LTAuODU1LDYuNTctMi41NjdjMS43MTEtMS43MTgsMi41NjItMy45MDEsMi41NjItNi41N1YxNzMuNTgxICAgIGMwLTIuNjYzLTAuODUyLTQuODUzLTIuNTYyLTYuNTY3Yy0xLjcxMS0xLjcwOS0zLjkwMS0yLjU2NS02LjU3LTIuNTY1SDI4My4yMmMtMi42NywwLTQuODUzLDAuODU1LTYuNTcxLDIuNTY1ICAgIGMtMS43MTEsMS43MTQtMi41NjYsMy45MDQtMi41NjYsNi41Njd2MTY0LjQ1NGMwLDIuNjY5LDAuODU1LDQuODUzLDIuNTY2LDYuNTdDMjc4LjM2NywzNDYuMzE2LDI4MC41NSwzNDcuMTcyLDI4My4yMiwzNDcuMTcyeiIgZmlsbD0iI2ZmOWNhZSIvPgoJPC9nPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=)
    no-repeat;
}

!* make nested grid have slightly darker bg take almost all space (need some to tell them apart) so items inside can have similar to external size+margin *!
.grid-stack > .grid-stack-item.grid-stack-sub-grid > .grid-stack-item-content {
  background: rgba(0, 0, 0, 0.1);
  inset: 0 2px;
}

.grid-stack.grid-stack-nested {
  background: none;
  !* background-color: red; *!
  !* take entire space *!
  position: absolute;
  inset: 0; !* TODO change top: if you have content in nested grid *!
}*/
</style>
