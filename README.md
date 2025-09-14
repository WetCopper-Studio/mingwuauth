# 冥雾域名授权管理系统 

## 1. 项目概述

冥雾域名授权管理系统是一个基于 Vue 3 + Node.js + MongoDB 的域名授权与卡密管理平台，主要用于管理应用的域名授权、卡密生成与验证等功能。

**主要功能特点：**
- 域名授权管理（添加、查看、吊销、导出授权）
- 卡密管理（生成、查看、删除卡密）
- 应用管理（管理应用基本信息）
- 统计数据查看（系统运行状态概览）
- 未授权域名监控
- 管理员权限控制

## 2. 技术栈与依赖

### 前端技术栈
- **Vue 3**：JavaScript 前端框架
- **TypeScript**：类型安全的编程语言
- **Element Plus**：UI 组件库
- **Vue Router**：前端路由管理
- **Axios**：HTTP 客户端
- **Vite**：构建工具

### 后端技术栈
- **Node.js**：JavaScript 运行环境
- **Express**：Web 应用框架
- **MongoDB**：NoSQL 数据库
- **Mongoose**：MongoDB ODM
- **Express-validator**：请求数据验证
- **CORS**：跨域资源共享

## 3. 项目目录结构

```
mingwu/
├── .env                 # 环境变量配置
├── .gitignore           # Git 忽略文件
├── package.json         # 项目依赖与脚本
├── index.html           # HTML 入口文件
├── vite.config.ts       # Vite 配置文件
├── tsconfig.json        # TypeScript 配置文件
├── dist/                # 构建输出目录
├── public/              # 静态资源
├── src/                 # 前端源码
│   ├── App.vue          # 根组件
│   ├── main.ts          # 入口文件
│   ├── router/          # 路由配置
│   ├── services/        # API 服务
│   ├── views/           # 页面组件
│   ├── components/      # 通用组件
│   └── assets/          # 静态资源
└── server/              # 后端源码
    ├── server.js        # 服务器入口
    ├── db.js            # 数据库连接
    ├── models/          # 数据库模型
    ├── routes/          # API 路由
    └── utils.js         # 工具函数
```

### 核心文件说明

#### 前端文件
- **src/main.ts**：前端应用入口点，初始化 Vue 应用实例
- **src/router/index.ts**：前端路由配置，定义页面路由和权限控制
- **src/services/authService.js**：API 服务封装，处理与后端的通信
- **src/views/admin/**：管理员后台页面组件

#### 后端文件
- **server/server.js**：后端服务器入口点，配置 Express 应用
- **server/db.js**：数据库连接与初始化逻辑
- **server/models/**：数据库模型定义
- **server/routes/api.js**：API 路由定义
- **server/utils.js**：工具函数，如 token 生成、加密等

## 4. 核心功能模块

### 4.1 域名授权管理

**功能描述**：管理已授权的域名信息，包括添加、查看、吊销和导出授权。

**实现页面**：`src/views/admin/DomainAuthManagement.vue`

**核心功能点**：
- 分页展示域名授权列表
- 按状态、时长、应用进行筛选
- 搜索域名或卡密
- 添加新的域名授权
- 查看授权详情
- 吊销未过期的授权
- 导出授权记录为 CSV 文件

**关键 API**：
- `/api/auth/list`：获取域名授权列表
- `/api/auth/add`：添加新的域名授权
- `/api/auth/delete`：删除域名授权

### 4.2 卡密管理

**功能描述**：生成、查看和管理系统中的卡密。

**实现页面**：`src/views/admin/CardManagement.vue`

**核心功能点**：
- 分页展示卡密列表
- 按状态、时长、应用进行筛选
- 搜索卡密
- 批量生成卡密
- 删除未使用的卡密

**关键 API**：
- `/api/key/list`：获取卡密列表
- `/api/key/generate`：生成卡密
- `/api/key/delete`：删除卡密

### 4.3 应用管理

**功能描述**：管理系统中的应用信息。

**实现页面**：`src/views/admin/AppManagement.vue`

**核心功能点**：
- 展示应用列表
- 添加新应用
- 编辑应用信息
- 删除应用

**关键 API**：
- `/api/app/list`：获取应用列表
- `/api/app/add`：添加应用
- `/api/app/update`：更新应用
- `/api/app/delete`：删除应用

### 4.4 未授权域名监控

**功能描述**：监控并管理未授权的域名访问。

**实现页面**：`src/views/admin/UnauthorizedDomain.vue`

**核心功能点**：
- 展示未授权域名列表
- 搜索未授权域名
- 查看未授权域名详情
- 处理未授权域名

**关键 API**：
- `/api/unauth/list`：获取未授权域名列表
- `/api/unauth/delete`：删除未授权域名记录

### 4.5 系统配置

**功能描述**：配置系统的基本参数，如数据库连接信息。

**实现页面**：`src/views/admin/DBConfig.vue`

**核心功能点**：
- 配置数据库连接信息
- 保存配置到文件和数据库

**关键 API**：
- `/api/config/save`：保存系统配置

## 5. 数据库设计

### 5.1 Auth 集合（授权信息）

```javascript
const authSchema = new mongoose.Schema({
  key: { type: String, required: true, index: true },  // 卡密
  domain: { type: String, required: true, unique: true, index: true },  // 域名
  time: { type: Number, required: true, default: -1 },  // 授权时长（-1永久、30一个月、365一年）
  state: { type: Number, required: true, default: 1 },  // 状态（0有效、1已过期）
  cert: { type: String, required: true },  // Base64加密后的证书
  token: { type: String, required: true, unique: true },  // 原始Token
  hash: { type: String, required: true, unique: true }  // 哈希值
}, { timestamps: true });  // 自动添加createdAt和updatedAt字段
```

### 5.2 Key 集合（卡密信息）

```javascript
const keySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },  // 卡密值
  time: { type: Number, required: true, default: -1 },  // 授权时长
  state: { type: Number, required: true, default: 0 },  // 状态（0未使用、1已使用）
  appid: { type: String, required: true }  // 所属应用ID
}, { timestamps: true });
```

### 5.3 Apps 集合（应用信息）

```javascript
const appsSchema = new mongoose.Schema({
  appid: { type: String, required: true, unique: true, index: true },  // 应用唯一标识
  name: { type: String, required: true },  // 应用名称
  Download: { type: String, required: true },  // 下载链接
  version: { type: String, required: true }  // 应用版本
}, { timestamps: true });
```

### 5.4 AppConfig 集合（系统配置）

存储系统的配置信息，如数据库连接参数、管理员账号等。

### 5.5 Cert 集合（证书信息）

存储系统生成的证书相关信息。

### 5.6 Unauth 集合（未授权域名信息）

存储未授权域名的访问记录。

## 6. API 接口文档

- [Apifox](https://mingwu.apifox.cn/)

## 7. 部署指南

### 7.1 环境准备
- Node.js 16.x 或更高版本
- MongoDB 4.4 或更高版本

### 7.2 安装依赖

```bash
npm install
```

### 7.3 构建前端

```bash
npm run build
```

### 7.4 启动服务

**开发模式**（同时启动前端开发服务器和后端API服务）：
```bash
npm run dev-all
```

**生产模式**（先构建前端，然后同时启动前端静态文件服务和后端API服务）：
```bash
npm run start
```

**只启动后端API服务**：
```bash
npm run server
```

### 7.5 配置说明

系统启动后，需要访问 `/admin/db-config` 页面配置数据库连接信息。配置完成后，系统会自动保存配置到 `config.json` 文件和数据库中。

**数据库配置项**：
- MoIP：MongoDB 服务器 IP 地址
- MoPo：MongoDB 服务器端口
- MoUs：MongoDB 用户名
- MoPs：MongoDB 密码
- Adname：管理员用户名
- Adpsd：管理员密码

## 8. 开发指南

### 8.1 开发流程
1. 克隆代码库
2. 安装依赖：`npm install`
3. 启动开发服务器：`npm run dev-all`
4. 访问 `http://localhost:5173/` 进行开发测试

### 8.2 代码规范
- 前端使用 TypeScript 和 Vue 3 的 Composition API
- 后端使用 Express 和 Mongoose ODM
- 代码风格遵循项目中已有的模式

### 8.3 常见问题排查

**数据库连接失败**：

- 检查 MongoDB 服务是否正常运行
- 确认数据库配置信息是否正确
- 检查网络连接和防火墙设置

**授权状态显示错误**：
- 确认 Auth 集合中的 state 字段值是否正确（0表示有效，1表示已过期）
- 检查前端表格中 formatter 的使用方式是否正确

**跨域问题**：
- 系统已配置 CORS 中间件，正常情况下不需要额外配置
- 如有特殊需求，可以在 `server.js` 中调整 CORS 配置

## 9. 系统安全

- 管理员登录状态使用 localStorage 存储 token
- 敏感数据（如数据库密码）应妥善保管，不要泄露到代码库
- API 接口进行了输入验证，防止恶意请求
- 建议在生产环境中使用 HTTPS 协议

## 10. 扩展建议

- 添加更完善的用户权限管理系统
- 增加日志记录和审计功能
- 优化系统性能，特别是在大数据量情况下
- 添加更多的数据可视化功能
- 实现多语言支持