// 匹配前后的斜杠
// '/chart-example'.replace(firstAndLastSlash, '').split('-')
export const firstAndLastSlash = /^\/+|\/+$/g
// 获取最后一个/的值且不包含后缀
// let path = './language/zh.js';
// let regex = /\/([^/]+?)(?=\.[^.\\/]+$|$)/; // 匹配最后一个斜杠前的内容
// console.log(path.match(regex))

// 获取最后一个/的值
// let path = './language/zh.js'
// let regex = /\/([^/]+)$/ // 匹配最后一个斜杠后面的内容
// console.log(path.match(regex)?.[1])

// 用于匹配一个字符串是否由空白字符（空格、制表符、换行符等）组成，且该字符串长度大于等于1
export const whitespaceRegex = /^\s+$/

// 匹配非数字
export const matchNotNumberRegex = /\D/g

// 不能全是数字，且只能包含英文、数字和下划线
export const alphanumericWithUnderscoreRegex = /^(?![0-9]+$)[a-zA-Z0-9_]+$/
