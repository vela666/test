import Clipboard from 'clipboard'
import { ElMessage } from 'element-plus'
import { t } from '@/locales/i18n'

let instance = null

function clipboardSuccess(successTip) {
  instance && instance.close()
  instance = ElMessage({
    message: successTip || t('common.successfulCopy') + '！',
    type: 'success',
  })
}

function clipboardError() {
  instance && instance.close()
  instance = ElMessage({
    message: t('common.copyFailed') + '！',
    type: 'error',
  })
}

/**
 * 复制文本
 * @param {string} text 需要复制的文本
 * @param {string | Event } source 触发目标
 * @param {function | null} successCallback success的回调函数
 * @param {function | null} errorCallback error的回调函数
 * @param {string} successTip 成功提示
 * @returns
 */
export default function handleClipboard(
  text,
  source,
  successCallback = null,
  errorCallback = null,
  successTip = ''
) {
  const target =
    typeof source === 'string'
      ? source
      : source instanceof Event
        ? source.target
        : null
  if (!target) return
  const clipboard = new Clipboard(target, {
    text: () => text,
  })
  clipboard.on('success', () => {
    if (typeof successCallback === 'function') {
      successCallback()
    } else {
      clipboardSuccess(successTip)
    }
    clipboard.destroy()
  })
  clipboard.on('error', () => {
    if (typeof errorCallback === 'function') {
      errorCallback()
    } else {
      clipboardError()
    }
    clipboard.destroy()
  })
  if (source instanceof Event) {
    clipboard.onClick(source)
  }
}
