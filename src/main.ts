import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Vant from 'vant';
import '@vant/touch-emulator'; // 移动端 touch 模拟
import 'vant/lib/index.css';

// 引入Capacitor App插件用于处理返回按钮
import { App as CapacitorApp } from '@capacitor/app';
// 引入Capacitor StatusBar插件用于处理状态栏
import { StatusBar, Style } from '@capacitor/status-bar';
import type { Router } from 'vue-router';

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Vant)

if (false) {

    // 设置状态栏样式（仅在Capacitor环境中运行）
    if (typeof StatusBar !== 'undefined') {
        // 设置状态栏字体为深色，背景为浅色
        StatusBar.setStyle({ style: Style.Dark });
        // 设置状态栏背景色为浅灰色
        StatusBar.setBackgroundColor({ color: '#F5F5F5' });
    }

    // 获取路由器实例
    const routerInstance: Router = router;

    // 提取公共的返回处理逻辑
    const handleBackAction = (canGoBack: boolean) => {
        // 检查是否有弹出的选择器需要关闭
        const popups = document.querySelectorAll('.van-popup');
        // 从后往前遍历，确保关闭最上层的popup
        for (let i = popups.length - 1; i >= 0; i--) {
            const popup = popups[i] as HTMLElement;
            // 只对可见的popup发送关闭事件
            if (popup && popup.classList.contains('van-popup') &&
                (popup.style.display !== 'none')) {
                // 找到显示中的popup，触发关闭事件
                const closeEvent = new CustomEvent('popup-close', {
                    detail: { source: 'backbutton' }
                });
                popup.dispatchEvent(closeEvent);
                return;
            }
        }

        // 如果无法返回或在首页，则退出应用
        if (!canGoBack || routerInstance.currentRoute.value.path === '/') {
            CapacitorApp.exitApp();
        } else {
            // 否则正常返回
            routerInstance.back();
        }
    };

    // 添加返回按钮事件监听
    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        handleBackAction(canGoBack);
    });

    // 添加ESC键盘事件监听
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            // 如果没有关闭popup，则执行正常的返回逻辑
            // 对于键盘事件，我们假设可以返回（因为这不是物理返回按钮）
            handleBackAction(true);
        }
    });
}
app.mount('#app')
