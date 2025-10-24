import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RecordView from '../views/RecordView.vue'
import SettingsView from '../views/SettingsView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/add',
      name: 'add',
      component: RecordView
    },
    {
      path: '/edit/:id',
      name: 'edit',
      component: RecordView
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView
    }
  ],
})

export default router
