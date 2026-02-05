# AccountHub

AccountHub 是一个全面的 Supabase 应用管理后台。它作为一个集中式的后端管理界面，用于管理多个应用程序，提供统一的用户账户和会员信息控制。

## 概述

该管理后台连接到一个 Supabase 实例，该实例作为多个应用程序的后端。通过 AccountHub，管理员可以：

- **用户管理**：查看、编辑和管理所有关联应用的用户账户
- **会员管理**：处理用户的订阅和会员信息
- **多应用支持**：从单一界面管理多个应用的用户和会员
- **集中控制**：统一的仪表板处理所有用户相关操作

## 技术栈

- **React** - UI 框架
- **TypeScript** - 类型安全开发
- **Vite** - 快速构建工具和开发服务器
- **Supabase** - 后端和数据库

## 快速开始

### 前置要求

- Node.js (v18 或更高版本)
- 具有适当表和权限的 Supabase 项目

### 安装

```bash
npm install
```

### 开发

```bash
npm run dev
```

### 构建

```bash
npm run build
```

## 项目结构

```
accounthub/
├── src/
│   ├── components/     # 可复用的 UI 组件
│   ├── pages/          # 应用页面
│   ├── lib/            # 工具函数和配置
│   └── App.tsx         # 主应用组件
├── public/             # 静态资源
└── README.md
```

## 配置

在相应的配置文件中配置 Supabase 连接：
- Supabase URL
- Supabase anon/public key
- 用户和会员的数据库表结构

## 功能特性

### 用户管理
- 查看所有应用的用户
- 编辑用户资料和信息
- 管理用户认证状态
- 搜索和筛选用户

### 会员管理
- 跟踪订阅状态
- 管理会员等级
- 查看支付历史
- 处理会员续费

## 开发说明

本项目使用：
- React Compiler 优化性能
- ESLint 保证代码质量
- TypeScript 提供类型安全
- Vite 提供快速开发体验

## 许可证

[在此添加您的许可证]
