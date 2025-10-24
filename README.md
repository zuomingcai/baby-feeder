# Baby Feeder

宝宝饮食记录应用

## 简介

这是一个基于Vue.js的移动应用，用于记录宝宝的饮食情况。

## 技术栈

- Vue.js 3
- Vite
- TypeScript
- Pinia (状态管理)
- Vue Router
- Vant (UI组件库)

## 开发环境搭建

### 前端开发

1. 安装依赖：
   ```bash
   npm install
   ```

2. 启动开发服务器：
   ```bash
   npm run dev
   ```

3. 构建生产版本：
   ```bash
   npm run build
   ```

### Android打包

本项目支持通过GitHub Actions自动构建Android APK，无需本地安装Android Studio。

#### 使用GitHub Actions构建APK

1. 将代码推送到GitHub仓库
2. GitHub Actions会自动触发构建流程
3. 构建完成后，可以在Actions页面下载APK文件

##### 手动触发构建

1. 在GitHub仓库页面，点击"Actions"选项卡
2. 选择"Build Android APK"工作流
3. 点击"Run workflow"按钮
4. 选择要构建的分支并启动工作流

##### 下载构建产物

1. 在Actions页面找到成功的构建记录
2. 展开"Artifacts"部分
3. 下载"baby-feeder-debug-apk"文件
4. 重命名为.apk格式并安装到Android设备上

#### 本地构建APK（可选）

如果不使用GitHub Actions，也可以在本地构建APK：

1. 安装Android命令行工具
2. 设置ANDROID_SDK_ROOT环境变量
3. 安装Java 17 JDK
4. 运行以下命令：
   ```bash
   # 构建Web资源
   npm run build
   
   # 同步到Android项目
   npx cap sync
   
   # 构建APK
   cd android
   ./gradlew assembleDebug
   ```

4. APK文件位置：`android/app/build/outputs/apk/debug/app-debug.apk`

## 项目结构

```
baby-feeder/
├── src/
│   ├── views/          # 页面组件
│   ├── router/         # 路由配置
│   ├── services/       # 服务层
│   ├── stores/         # 状态管理
│   └── config/         # 配置文件
├── android/            # Android原生项目
└── .github/workflows/  # GitHub Actions工作流
```

## 路由模式

本项目使用Vue Router的hash模式，以适应移动端部署需求。

## 注意事项

- 项目使用UUID作为数据主键，符合数据库设计规范
- 所有类和函数都遵循代码规范，保持简洁易维护
- 数据存储使用本地数据库，确保离线可用性
