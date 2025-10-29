# Android构建修复更新日志

## 问题描述
构建过程中出现以下错误：
```
> Using '--release' option for JavaCompile is not supported because it prevents the Android Gradle plugin
  from setting up the bootclasspath for compiling Java source files against Android APIs
```

## 解决方案
修改了`android/build.gradle`文件中的Java编译选项配置：

### 之前的配置：
```gradle
tasks.withType(JavaCompile) {
    options.release = 17
}
```

### 更新后的配置：
```gradle
tasks.withType(JavaCompile) {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}
```

## 原因说明
根据Android Gradle插件的要求，使用`--release`选项会阻止插件设置bootclasspath来编译针对Android API的Java源文件。官方建议使用`sourceCompatibility`和`targetCompatibility`选项来替代。

## 其他注意事项
1. 保留了对Android项目的`compileOptions`配置，确保Android模块继续使用正确的Java版本。
2. 保留了`flatDir`配置，因为这是Capacitor项目引用本地库文件所必需的。

## 验证
修改后，Android APK应该能够成功构建，不再出现上述错误。