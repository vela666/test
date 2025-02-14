// 区域检测 x,y 二维数据地图起始坐标点  w,h 检测区域宽高
import { layoutColumn } from '@/views/see-plate/enum.js'

export const regionalTest = (x, y, w, h, layoutMap) => {
  // 定义返回 x,y 偏移 及 是否有空位置
  let offsetX = 0,
    offsetY = 0,
    result = true
  // 按区域循环检测 二维数组地图
  for (let r = 0; r < w; r++) {
    for (let c = 0; c <= h; c++) {
      let point = layoutMap[y + r] ? layoutMap[y + r][x + c] : 0
      // 如该点被占据 记录偏移值
      if (point === 1) {
        result = false
        offsetX = offsetX > x + c ? offsetX : x + c
        offsetY = offsetY > y + r ? offsetY : y + r
      }
    }
  }

  return {
    result,
    offsetX,
    pos: {
      x,
      y,
    },
  }
}

// 新坐标
export const newPos = (node, layoutMap) => {
  let addItem = {
    x: 0,
    y: layoutMap.length,
    ...node,
  }
  if (layoutMap.length) {
    for (let r = 0, rLen = layoutMap.length; r < rLen; r++) {
      for (let c = 0; c <= layoutColumn - addItem.w; c++) {
        let res = regionalTest(
          c,
          r,
          addItem.w,
          rLen > r + addItem.h ? addItem.h : rLen - r,
          layoutMap
        )

        if (res.result) {
          // 更新添加数据内容
          addItem = {
            ...node,
            ...res.pos,
            // w: node.w,
            // h: node.h,
          }

          c = layoutColumn + 1
          r = rLen + 1
        } else {
          c = res.offsetX
        }
      }
    }
  }
  // 更新二维数组地图
  for (let itemR = 0; itemR < addItem.h; itemR++) {
    for (let itemC = 0; itemC < addItem.w; itemC++) {
      // 如果没有该行，初始化
      if (!layoutMap[addItem.y + itemR]) {
        layoutMap[addItem.y + itemR] = new Array(layoutColumn)
        for (let i = 0; i < layoutColumn; i++) {
          layoutMap[addItem.y + itemR][i] = 0
        }
      }
      // 标记点
      layoutMap[addItem.y + itemR][addItem.x + itemC] = 1
    }
  }

  return addItem
  // node.push(addItem)
}

// 生成二维数组地图
export const genereatePlaneArr = (data) => {
  let map = []
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      let one = data[i]
      // 循环行
      for (let r = one.y; r < one.y + one.h; r++) {
        // 循环列
        for (let c = one.x; c < one.x + one.w; c++) {
          // 检修当前行是否存在
          if (!map[r]) {
            map[r] = new Array(layoutColumn)

            for (let i = 0; i < layoutColumn; i++) {
              map[r][i] = 0
            }
          }
          // 占据为1
          map[r][c] = 1
        }
      }
    }
  }
  return map
}

export const getSortNum = (data, id, type = 'x') => {
  const objVal = data.find((item) => item.mark === id)
  return objVal ? objVal[type] : Infinity
}
