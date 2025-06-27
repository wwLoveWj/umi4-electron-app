## 打包问题

在国内，建议配置 electron 的下载镜像为淘宝源：
npm config set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/

## 在根目录下创建 .npmrc 文件，配置以下内容：

electron_mirror=https://npmmirror.com/mirrors/electron/
electron_builder_binaries_mirror=https://npmmirror.com/mirrors/electron-builder-binaries/

<!-- 原文链接：https://blog.csdn.net/F520Hz/article/details/136544798 -->

## node 环境打印中文的话可能会出现乱码的情况，在终端输入

chcp 65001

## 官网

https://www.electronjs.org/zh/docs/latest/tutorial/debugging-main-process

umi g page
