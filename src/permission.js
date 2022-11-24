import router from './router'
import store from './store'
import { Message } from 'element-ui'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import { getToken } from '@/utils/auth' // get token from cookie
import getPageTitle from '@/utils/get-page-title'

// 关闭进度环
NProgress.configure({ showSpinner: false }) // NProgress Configuration

const whiteList = ['/login', '/auth-redirect'] // no redirect whitelist

router.beforeEach(async(to, from, next) => {
  // start progress bar
  NProgress.start()

  // set page title 浏览器Tab页的标题
  document.title = getPageTitle(to.meta.title)

  /*
    策略：
      1、页面会先从 cookie 中查看是否存有 token，没有，就走一遍上一部分的流程重新登录，
         如果有token,就会把这个 token 返给后端去拉取user_info，保证用户信息是最新的。
      2、动态根据用户的 role 算出其对应有权限的路由，再通过router.addRoutes动态挂载路由。
   */
  // determine whether the user has logged in
  const hasToken = getToken()

  if (hasToken) {
    if (to.path === '/login') {
      // if is logged in, redirect to the home page
      next({ path: '/' })
      NProgress.done() // hack: https://github.com/PanJiaChen/vue-element-admin/pull/2939
    } else {
      // determine whether the user has obtained his permission roles through getInfo
      const hasRoles = store.getters.roles && store.getters.roles.length > 0
      if (hasRoles) {
        next()
      } else {
        try {
          // get user info
          // note: roles must be a object array! such as: ['admin'] or ,['developer','editor']
          const { roles } = await store.dispatch('user/getInfo')

          // generate accessible routes map based on roles
          const accessRoutes = await store.dispatch('permission/generateRoutes', roles)

          // dynamically add accessible routes
          router.addRoutes(accessRoutes)

          // hack method to ensure that addRoutes is complete
          // set the replace: true, so the navigation will not leave a history record
          /*
              1、next()是放行，其他的诸如：next('/logon') 、 next(to) 或者 next({ ...to, replace: true })都不是放行，而是：中断当前导航，执行新的导航
              2、next('/login')不是说直接去/login路由，而是中断这一次路由守卫的操作，又进入一次路由守卫，就像嵌套一样，一层路由守卫
              3、在addRoutes()之后第一次访问被添加的路由会白屏，这是因为刚刚addRoutes()就立刻访问被添加的路由，然而此时addRoutes()没有执行结束
              4、next({ ...to, replace: true })确保addRoutes()时动态添加的路由已经被完全加载上去
              5、replace: true只是一个设置信息，告诉VUE本次操作后，不能通过浏览器后退按钮，返回前一个路由。
           */
          next({ ...to, replace: true })
        } catch (error) {
          // remove token and go to login page to re-login
          await store.dispatch('user/resetToken')
          Message.error(error || 'Has Error')
          next(`/login?redirect=${to.path}`)
          NProgress.done()
        }
      }
    }
  } else {
    /* has no token*/

    if (whiteList.indexOf(to.path) !== -1) {
      // in the free login whitelist, go directly
      next()
    } else {
      // other pages that do not have permission to access are redirected to the login page.
      next(`/login?redirect=${to.path}`)
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  // finish progress bar
  NProgress.done()
})
