import { asyncGetOauthCode } from '@/api/modules/user'

// 生成对应版本链接
// version = 1国内版本，2海外版本 路径
export async function generateVersionUrl(
  version,
  needParams = true,
  path = ''
) {
  let code = ''
  if (needParams) {
    const { data } = await asyncGetOauthCode()
    code = data
  }
  const envName =
    parseInt(version) === 1
      ? 'VITE_APP_DOMAIN_DOMESTIC'
      : 'VITE_APP_DOMAIN_OVERSEAS'
  const params = needParams ? `?v_change_code=${code}&_=${Date.now()}` : ''
  return `${import.meta.env[envName]}${path}${params}`
}

// 1 = 国内 2 = 国外 对应环境变量的 .env.development
// 国内地址
const domestic = [
  '192.168.10.5:88',
  '192.168.10.5:98',
  'localhost:5173',
  'easpro.fineboost.cn',
  'e.fineboost.cn',
]
export const domesticOverseasMark = () => {
  return domestic.includes(location.host) ? 1 : 2
}
