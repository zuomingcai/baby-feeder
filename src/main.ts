import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Vant from 'vant';
import '@vant/touch-emulator'; // 移动端 touch 模拟
import 'vant/lib/index.css';

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Vant)

app.mount('#app')
