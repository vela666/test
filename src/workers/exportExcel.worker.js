// https://github.com/exceljs/exceljs/blob/master/README_zh.md
import ExcelJS from 'exceljs'

self.onmessage = async (event) => {
  const data = JSON.parse(event.data)
  // 1.创建工作簿
  let workbook = new ExcelJS.Workbook()
  workbook.created = new Date()
  workbook.modified = new Date()
  workbook.lastPrinted = new Date()
  // 2.创建工作表
  if (Array.isArray(data.sheets)) {
    data.sheets.forEach((sheet) => {
      createWorkSheet(workbook, sheet.sheetName, sheet.sheetData)
    })
  } else {
    createWorkSheet(workbook, data.sheets.sheetName, data.sheets.sheetData)
  }

  let tmp = await workbook.xlsx.writeBuffer()
  // 完成 Excel 处理后，将结果发送回主线程
  self.postMessage(tmp)
}

// 设置换行样式
const wrapTextAlignment = {
  vertical: 'middle',
  // horizontal: 'center',
  // 将单元格设置为自动换行
  wrapText: true,
}

const createWorkSheet = (workbook, sheetName, sheetData) => {
  const workSheet = workbook.addWorksheet(sheetName)
  // workSheet.defaultColWidth = 100

  // 将数据添加到工作表中
  sheetData?.forEach((rowData) => {
    const row = workSheet.addRow(rowData)
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.alignment = wrapTextAlignment
    })
  })
  // 设置宽度
  workSheet?.columns?.forEach((column) => {
    column.eachCell({ includeEmpty: true }, (cell) => {
      const columnWidth = Math.max(
        column.width || 0,
        cell.value
          ? countCharacters(findLongestParagraph(cell.value.toString())) + 2
          : 10
      )

      column.width = columnWidth
    })
  })

  // 设置所有单元格的格式为文本
  /*workSheet.eachRow({ includeEmpty: true }, (row) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.numFmt = '@'
    })
  })*/
}

/**
 * 计算字符串的字符数（包括中文、英文、数字等）
 * @param {string} str - 要计算字符数的字符串
 * @returns {number} - 字符数
 */
function countCharacters(str) {
  let count = 0
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i)
    if (charCode >= 0 && charCode <= 128) {
      count++ // 英文、数字等字符算作一个字符
    } else {
      count += 2 // 中文等字符算作两个字符
    }
  }
  return count
}

// 以\n 分割 取最长的字符串
function findLongestParagraph(text) {
  const paragraphs = text.split('\n')
  return paragraphs.reduce((longest, current) => {
    return current.length > longest.length ? current : longest
  }, '')
}
