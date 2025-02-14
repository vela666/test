import { createPinia } from 'pinia'
import { cloneDeep } from 'lodash-es'

// 解决setup方式编写pinia无法调用$reset
const storeReset = ({ store }) => {
  const initialState = cloneDeep(store.$state)
  store.$reset = () => {
    store.$patch(cloneDeep(initialState))
  }
}
// const routeStore = useRouteStore()  routeStore.$reset()
const pinia = createPinia()
pinia.use(storeReset)
export default pinia
