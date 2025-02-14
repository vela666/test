import { ElMessage } from 'element-plus'
// https://docs.sheetjs.com/docs/getting-started/installation/nodejs
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { filterArraySpecifiedKey } from './dataProcessing'

// 获取表头
function getHeaderRow(sheet) {
  const headers = []
  const range = XLSX.utils.decode_range(sheet['!ref'])
  let C
  const R = range.s.r
  /* start in the first row */
  for (C = range.s.c; C <= range.e.c; ++C) {
    /* walk every column in the range */
    const cell = sheet[XLSX.utils.encode_cell({ c: C, r: R })]
    /* find the cell in the first row */
    // let hdr = 'UNKNOWN ' + C //
    let hdr = '' // <-- replace with your desired default
    if (cell && cell.t) hdr = XLSX.utils.format_cell(cell)
    headers.push(hdr)
  }
  return headers
}

/**
 * @description: 解析excel文件
 * @param file {File} 上传的文件
 * @param options {Object} 是否格式化数据
 * @param options.format {boolean} 表头和数据分离
 * {
 *     "excelData": [
 *         {
 *             "col_0": 1
 *         }
 *         ...
 *     ],
 *     "excelColumns": [
 *         {
 *             "label": "事件名(必填)",
 *             "prop": "col_0"
 *         }
 *         ...
 *     ]
 * }
 * @param options.customKey {Array | Object}  自定义key
 * [
 *     "eventName",
 *     "eventNameZh",
 *     "eventDesc"
 * ]
 * {
 *     0: "eventName",
 *     1: "eventNameZh",
 *     2: "eventDesc"
 * }
 * @param options.isFilterKey {Boolean} 是否过滤key
 * @param options.multiple {Boolean} 多个工作簿
 * @return {*}
 * @param {File} file
 */
export const analysisExcel = (file, options = {}) => {
  const {
    format = false,
    customKey = [],
    isFilterKey = true,
    multiple = false,
  } = options

  return new Promise((resolve, reject) => {
    if (!(file.raw instanceof File)) reject()

    const fr = new FileReader()
    fr.readAsArrayBuffer(file.raw)
    fr.onload = (e) => {
      const data = new Uint8Array(e.target.result)
      try {
        const workbook = XLSX.read(data, {
          type: 'buffer',
          cellDates: true,
          cellText: false,
          raw: true,
        })
        if (multiple) {
          const firstSheetNames = workbook.SheetNames
          const data = firstSheetNames.reduce((p, c, index) => {
            const worksheet = workbook.Sheets[c]

            /* if (worksheet['!ref']) {
              const maxVal = Object.keys(worksheet).sort((a, b) => {
                const numA = Number(a.replace(/^\D+([0-9]+)$/, '$1')) || 0
                const numB = Number(b.replace(/^\D+([0-9]+)$/, '$1')) || 0
                return numB > numA ? 1 : -1
              })[0]
              worksheet['!ref'] =
                worksheet['!ref'].replace(/^([a-zA-Z0-9]+:).+$/, '$1') + maxVal
            }*/
            if (worksheet['!ref']) {
              // 解码现有的范围
              // 此方法将工作表的 !ref 范围（如 A1:Z100）转换为一个包含起始行列和结束行列的对象。
              // 例如，A1:Z100 会被解码为 { s: { r: 0, c: 0 }, e: { r: 99, c: 25 } }
              const range = XLSX.utils.decode_range(worksheet['!ref'])

              // 初始化最大行和列
              let maxRow = range.e.r
              let maxCol = range.e.c

              // 遍历 worksheet 中的所有单元格，找到最大行和最大列
              Object.keys(worksheet).forEach((cell) => {
                // 只处理有数据的单元格
                if (cell[0] !== '!') {
                  const row = XLSX.utils.decode_cell(cell).r
                  const col = XLSX.utils.decode_cell(cell).c

                  // 更新最大行和最大列
                  maxRow = Math.max(maxRow, row)
                  maxCol = Math.max(maxCol, col)
                }
              })

              // 使用新的最大行列创建新的范围 此方法用于根据最大行列号重新生成工作表的 !ref 范围
              worksheet['!ref'] = XLSX.utils.encode_range({
                s: { r: 0, c: 0 }, // 从 A1 开始
                e: { r: maxRow, c: maxCol }, // 使用新计算的最大行列
              })
            }

            const results = XLSX.utils.sheet_to_json(worksheet, {
              // 空的默认值
              defval: '',
              blankrows: true, // 保留空行
              // raw: false, // 将单元格内容转换为字符串
            })
            const headers = getHeaderRow(worksheet)
            // 校验上传文件是否符合
            if (!validateFile(results, headers, c)) {
              reject('excel文件不符合')
            } else {
              const csv = XLSX.utils.sheet_to_csv(worksheet)
              const sourceStr = typeof csv === 'string' ? csv : ''
              const csvBlob = new Blob([sourceStr], {
                type: 'text/csv;charset=utf-8',
              })
              if (format) {
                const { excelColumns, excelData } = formatExcelData(
                  results,
                  customKey,
                  isFilterKey,
                  headers
                )
                p.push({ excelColumns, excelData, csvBlob })
              } else {
                p.push({ results, csvBlob })
              }
            }
            return p
          }, [])
          resolve(data)
        } else {
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]

          /*  if (worksheet['!ref']) {
            const maxVal = Object.keys(worksheet).sort((a, b) => {
              const numA = Number(a.replace(/^\D+([0-9]+)$/, '$1')) || 0
              const numB = Number(b.replace(/^\D+([0-9]+)$/, '$1')) || 0
              return numB > numA ? 1 : -1
            })[0]
            worksheet['!ref'] =
              worksheet['!ref'].replace(/^([a-zA-Z0-9]+:).+$/, '$1') + maxVal
          }*/

          if (worksheet['!ref']) {
            // 解码现有的范围
            // 此方法将工作表的 !ref 范围（如 A1:Z100）转换为一个包含起始行列和结束行列的对象。
            // 例如，A1:Z100 会被解码为 { s: { r: 0, c: 0 }, e: { r: 99, c: 25 } }
            const range = XLSX.utils.decode_range(worksheet['!ref'])

            // 初始化最大行和列
            let maxRow = range.e.r
            let maxCol = range.e.c

            // 遍历 worksheet 中的所有单元格，找到最大行和最大列
            Object.keys(worksheet).forEach((cell) => {
              // 只处理有数据的单元格
              if (cell[0] !== '!') {
                const row = XLSX.utils.decode_cell(cell).r
                const col = XLSX.utils.decode_cell(cell).c

                // 更新最大行和最大列
                maxRow = Math.max(maxRow, row)
                maxCol = Math.max(maxCol, col)
              }
            })

            // 使用新的最大行列创建新的范围 此方法用于根据最大行列号重新生成工作表的 !ref 范围
            worksheet['!ref'] = XLSX.utils.encode_range({
              s: { r: 0, c: 0 }, // 从 A1 开始
              e: { r: maxRow, c: maxCol }, // 使用新计算的最大行列
            })
          }

          const results = XLSX.utils.sheet_to_json(worksheet, {
            // 空的默认值
            defval: '',
            blankrows: true, // 保留空行
          })

          const headers = getHeaderRow(worksheet)
          // 校验上传文件是否符合
          if (!validateFile(results, headers)) {
            reject('excel文件不符合')
          } else {
            const csv = XLSX.utils.sheet_to_csv(worksheet)
            const sourceStr = typeof csv === 'string' ? csv : ''
            const csvBlob = new Blob([sourceStr], {
              type: 'text/csv;charset=utf-8',
            })
            if (format) {
              const { excelColumns, excelData } = formatExcelData(
                results,
                customKey,
                isFilterKey,
                headers
              )
              resolve({ excelColumns, excelData, csvBlob })
              return
            }
            resolve({ results, csvBlob })
          }
        }
      } catch (error) {
        ElMessage.warning('文件解析错误')
        reject(error)
      }
    }
  })
}

/**
 * @description: 格式化excel数据格式
 * @param  results {Array} 解析后的excel数据
 * @param  customKey {Array | Object} 自定义key
 * @param  isFilterKey {Boolean} 过滤键为prop
 * @param  headers {Array} 表头
 *
 *
 **/
const formatExcelData = (results, customKey, isFilterKey, headers) => {
  let excelColumns = []
  let excelData = []
  let header_map = new Map()
  headers.forEach((key, i) => {
    const prop = customKey[i] || `col_${i}`
    const label = key
    excelColumns.push({
      label,
      prop,
    })
    header_map.set(label + i, prop)
  })
  results.forEach((item) => {
    let obj = {}
    headers.forEach((key, index) => {
      obj[header_map.get(key + index)] = item[key] + ''
    })
    excelData.push(obj)
  })
  // 过滤不存在的标识
  const filterProps = Array.isArray(customKey)
    ? customKey
    : Object.values(customKey)

  if (isFilterKey && filterProps.length) {
    excelColumns = excelColumns.filter((item) =>
      filterProps.includes(item.prop)
    )
    excelData = filterArraySpecifiedKey(excelData, filterProps)
  }
  return {
    excelColumns,
    excelData,
  }
}

/**
 * @description: 校验上传文件是否符合
 * @return {*}
 * @param results { Array }  结果
 * @param headers { Array }  表头
 * @param sheetName { String }  工作簿名字
 */
export const validateFile = (results, headers, sheetName = '') => {
  if (!Array.isArray(results) || results.length === 0) {
    ElMessage.warning('上传文件为空')
    return false
  }
  /* if (Object.keys(results[0]).some((key) => key === '__EMPTY')) {
    ElMessage.warning('上传文件中表头有空值')
    return false
  }  */
  if (headers.filter(Boolean).length !== headers.length) {
    const emptyIndex = headers.reduce((p, c, index) => {
      if (/^\s*$/.test(c)) {
        p.push(index + 1)
      }
      return p
    }, [])
    let tips = `第 ${emptyIndex.join('、')} 列表头为空，请填写内容或删除该列。`
    if (sheetName) {
      tips = `工作簿【${sheetName}】中，第 ${emptyIndex.join('、')} 列表头为空，请填写内容或删除该列。`
    }
    ElMessage.warning(tips)
    return false
  }

  // if (!verifyHeader) return true

  // const excel_header = Object.keys(results[0])
  // // 校验excel表头是否符合
  // for (const header of excel_header) {
  //   const { flag, message } = validateExcelHeader(header)
  //   if (!flag) {
  //     ElMessage.warning(message)
  //     return false
  //   }
  // }

  return true
}

/**
 * @description: 校验excel表头是否符合
 * @return {*}
 */
export const validateExcelHeader = (value) => {
  let message
  let flag = true
  if (!value.trim() || String(value).indexOf('__EMPTY') > -1) {
    message = '表头不能为空'
  } else if (/\s+/.test(value)) {
    message = '表头不能包含空格'
  } else if (!/^(?!^\d)[a-z\d_]+$/.test(value)) {
    message = '表头只能包含小写字母,下划线,数字,不能以数字开头'
  } else if (value.length > 30) {
    message = '表头长度在30个字符以内'
  }

  if (message) flag = false

  return {
    message,
    flag,
  }
}

// 该方式在webpack4中 需要配合 worker-loader使用
// import exportExcelWorker from '@/workers/exportExcel.worker'
// 导出excel 可设置单元格样式等
// 支持导出loading
/*data = {
  fileName: '文件名',
  // 多个工作表
  sheets: [
    {
      sheetName: '工作表名字 可选',
      sheetData: [
        ['2023-05-21\n2023-05-28', 'A2', 'A3'],
        ['A2', 'B2'],
        ['A3', 'B3', 'C3']
      ]
    },
    {
      sheetName: '工作表名字 可选',
      sheetData: [['A1', 'B1', 'C1'], ['A2', 'B2'], ['A3']]
    }
  ]
  // 单个工作表
  sheets: {
    // sheetName: '工作表名字 可选',
    sheetData: [['A1', 'B1', 'C1'], ['A2', 'B2'], ['A3']]
  }
}*/
export async function exportToExcel(data) {
  return new Promise((resolve, reject) => {
    // 该方式在webpack4中 需要配合 worker-loader使用
    // let myWorker = new exportExcelWorker()
    // webpack5和vite的使用方式
    let myWorker = new Worker(
      new URL('@/workers/exportExcel.worker.js', import.meta.url),
      {
        type: 'module',
      }
    )

    // 发送数据给 Web Worker 进行处理
    myWorker.postMessage(JSON.stringify(data))

    // 监听 Web Worker 的返回结果
    myWorker.onmessage = (event) => {
      try {
        saveAs(new Blob([event.data]), `${data.fileName}.xlsx`)
        resolve()
      } catch (err) {
        reject(`excel导出失败，原因为：${err}`)
        // console.log(`excel导出失败，原因为：${err}`)
      }
      // 关闭 Web Worker
      myWorker.terminate()
    }
  })
}
/**
 * @description: 导出文件
 * @return {*}
 * @param {*} response
 */
export const downloadFile = (response) => {
  const contentDisposition = response.headers.get('content-disposition')
  const lowerCaseContentDisposition = contentDisposition.toLowerCase()

  /*const fileName = response.headers['content-disposition'].includes('fileName')
    ? decodeURIComponent(response.headers['content-disposition'].split('=')[1])
    : `${Date.now()}.csv`*/
  const fileName = lowerCaseContentDisposition.includes('filename')
    ? decodeURIComponent(contentDisposition.split('=')[1])
    : `${Date.now()}.csv`
  /* decodeURIComponent(
    contentDisposition
      .split(/filename=|fileName=/i)[1]
      .split(';')[0]
      .trim()
      .replace(/['"]/g, '')
  )*/
  const type =
    fileName.split('.')[1] === 'csv'
      ? 'text/csv;charset=utf-8'
      : 'application/vnd.ms-excel'

  const blob = new Blob([response.data], {
    type,
  })

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  a.remove()
  window.URL.revokeObjectURL(a.href)
}
