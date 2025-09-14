# 冥雾域名授权管理系统 - API接口文档

## 1. API概述

本文档详细描述了冥雾域名授权管理系统提供的所有API接口，包括接口地址、请求方法、请求参数、返回数据格式等信息。

**基础API路径**: `http://服务器IP:3000/api/`

## 2. 客户端授权API

### 2.1 查询授权接口 (/api/Inquire)

**功能描述**: 客户端查询指定域名的授权信息

**请求方法**: POST

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| domain | String | 是 | 要查询的域名 |

**返回数据格式**:
```json
{
  "success": true,
  "time": Number,  // 授权时长(-1永久、30一个月、365一年)
  "state": Number, // 授权状态(0无效/已过期、1有效)
  "domain": String
}
```

**错误返回**:
```json
{
  "success": false,
  "message": "错误信息"
}
```

### 2.2 授权绑定接口 (/api/bind)

**功能描述**: 客户端将卡密与域名进行绑定，获取授权证书

**请求方法**: POST

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| key | String | 是 | 授权卡密 |
| domain | String | 是 | 要绑定的域名 |

**返回数据格式**:
```json
{
  "success": true,
  "cert": String,    // Base64加密后的证书
  "privateKey": String, // 私钥
  "token": String,   // 授权令牌
  "hash": String     // 哈希值
}
```

**错误返回**:
```json
{
  "success": false,
  "message": "错误信息"
}
```

### 2.3 授权验证接口 (/api/verify)

**功能描述**: 客户端验证域名和证书的有效性

**请求方法**: POST

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| domain | String | 是 | 要验证的域名 |
| cert | String | 是 | 证书内容 |
| hash | String | 是 | 哈希值 |

**返回数据格式**:
```json
{
  "success": Boolean,  // 验证是否成功
  "state": Number      // 授权状态(0无效/已过期、1有效)
}
```

**错误返回**:
```json
{
  "success": false,
  "state": 0,
  "message": "服务器错误，请稍后再试"
}
```

### 2.4 应用信息接口 (/api/appinfo)

**功能描述**: 获取应用的详细信息

**请求方法**: POST

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| appid | String | 是 | 应用唯一标识 |

**返回数据格式**:
```json
{
  "success": true,
  "appid": String,    // 应用ID
  "name": String,     // 应用名称
  "Download": String, // 下载链接
  "version": String   // 应用版本
}
```

**错误返回**:
```json
{
  "success": false,
  "message": "错误信息"
}
```

### 2.5 盗版上报接口 (/api/unauth)

**功能描述**: 上报未授权使用的域名

**请求方法**: POST

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| domain | String | 是 | 未授权的域名 |

**返回数据格式**:
```json
{
  "success": true,
  "message": "上报成功"
}
```

**错误返回**:
```json
{
  "success": false,
  "message": "服务器错误，请稍后再试"
}
```

## 3. 系统管理API

### 3.1 获取配置接口 (/api/config)

**功能描述**: 获取系统配置信息

**请求方法**: GET

**请求参数**: 无

**返回数据格式**:
```json
{
  "success": true,
  "config": {
    "MoIP": String,  // MongoDB服务器IP
    "MoPo": String,  // MongoDB服务器端口
    "MoUs": String,  // MongoDB用户名
    "MoPs": String,  // MongoDB密码
    "Adname": String, // 管理员用户名
    "Adpsd": String   // 管理员密码
  }
}
```

**错误返回**:
```json
{
  "success": false,
  "message": "错误信息"
}
```

### 3.2 保存配置接口 (/api/save-config)

**功能描述**: 保存系统配置信息到本地文件和数据库

**请求方法**: POST

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| MoIP | String | 是 | MongoDB服务器IP |
| MoPo | String | 是 | MongoDB服务器端口 |
| MoUs | String | 是 | MongoDB用户名 |
| MoPs | String | 是 | MongoDB密码 |
| Adname | String | 是 | 管理员用户名 |
| Adpsd | String | 是 | 管理员密码 |

**返回数据格式**:
```json
{
  "success": true,
  "message": "配置保存成功"
}
```

**错误返回**:
```json
{
  "success": false,
  "message": "错误信息"
}
```

### 3.3 管理员登录接口 (/api/login)

**功能描述**: 管理员登录认证

**请求方法**: POST

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| username | String | 是 | 用户名 |
| password | String | 是 | 密码 |

**返回数据格式**:
```json
{
  "success": true,
  "message": "登录成功"
}
```

**错误返回**:
```json
{
  "success": false,
  "message": "错误信息"
}
```

### 3.4 获取统计数据接口 (/api/stats)

**功能描述**: 获取系统各项统计数据

**请求方法**: GET

**请求参数**: 无

**返回数据格式**:
```json
{
  "success": true,
  "data": {
    "activeAuthorizations": Number,  // 活跃授权数
    "unauthorizedDomains": Number,   // 未授权域名数
    "totalKeys": Number,             // 卡密总数
    "totalApps": Number              // 应用总数
  }
}
```

**错误返回**:
```json
{
  "success": false,
  "message": "服务器错误，请稍后再试"
}
```

## 4. 应用管理API

### 4.1 获取应用列表接口 (/api/apps/list)

**功能描述**: 获取应用列表，支持分页和搜索

**请求方法**: POST

**请求参数**:
| 参数名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| page | Number | 否 | 1 | 页码 |
| pageSize | Number | 否 | 10 | 每页数量 |
| searchKeyword | String | 否 | "" | 搜索关键词（匹配应用ID或名称） |

**返回数据格式**:
```json
{
  "success": true,
  "data": [
    {
      "appid": String,    // 应用ID
      "name": String,     // 应用名称
      "Download": String, // 下载链接
      "version": String   // 应用版本
    }
    // 更多应用...
  ],
  "total": Number,       // 总数
  "currentPage": Number, // 当前页码
  "pageSize": Number     // 每页数量
}
```

**错误返回**:
```json
{
  "success": false,
  "message": "服务器错误，请稍后再试"
}
```

### 4.2 添加应用接口 (/api/apps/add)

**功能描述**: 添加新的应用

**请求方法**: POST

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| appid | String | 是 | 应用ID |
| name | String | 是 | 应用名称 |
| Download | String | 是 | 下载链接 |
| version | String | 是 | 版本号 |

**返回数据格式**:
```json
{
  "success": true,
  "message": "应用添加成功",
  "data": {
    "appid": String,
    "name": String,
    "Download": String,
    "version": String
  }
}
```

**错误返回**:
```json
{
  "success": false,
  "message": "错误信息"
}
```

### 4.3 更新应用接口 (/api/apps/update)

**功能描述**: 更新应用信息

**请求方法**: POST

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| appid | String | 是 | 应用ID |
| name | String | 是 | 应用名称 |
| Download | String | 是 | 下载链接 |
| version | String | 是 | 版本号 |

**返回数据格式**:
```json
{
  "success": true,
  "message": "应用更新成功",
  "data": {
    "appid": String,
    "name": String,
    "Download": String,
    "version": String
  }
}
```

**错误返回**:
```json
{
  "success": false,
  "message": "错误信息"
}
```

### 4.4 删除应用接口 (/api/apps/delete)

**功能描述**: 删除应用

**请求方法**: POST

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| appid | String | 是 | 应用ID |

**返回数据格式**:
```json
{
  "success": true,
  "message": "应用删除成功"
}
```

**错误返回**:
```json
{
  "success": false,
  "message": "错误信息"
}
```

## 5. 卡密管理API

### 5.1 获取卡密列表接口 (/api/keys/list)

**功能描述**: 获取卡密列表，支持分页和筛选

**请求方法**: POST

**请求参数**:
| 参数名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| page | Number | 否 | 1 | 页码 |
| pageSize | Number | 否 | 10 | 每页数量 |
| searchKeyword | String | 否 | "" | 搜索关键词（匹配卡密） |
| stateFilter | Number | 否 | "" | 状态筛选(0未使用、1已使用) |
| timeFilter | Number | 否 | "" | 授权时长筛选(-1永久、30一个月、365一年) |
| appidFilter | String | 否 | "" | 应用ID筛选 |

**返回数据格式**:
```json
{
  "success": true,
  "data": [
    {
      "key": String,     // 卡密
      "time": Number,    // 授权时长
      "state": Number,   // 状态(0未使用、1已使用)
      "appid": String    // 所属应用ID
    }
    // 更多卡密...
  ],
  "total": Number,       // 总数
  "currentPage": Number, // 当前页码
  "pageSize": Number     // 每页数量
}
```

**错误返回**:
```json
{
  "success": false,
  "message": "服务器错误，请稍后再试"
}
```

### 5.2 生成卡密接口 (/api/keys/generate)

**功能描述**: 批量生成新的卡密

**请求方法**: POST

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| count | Number | 是 | 生成数量(1-100之间) |
| time | Number | 是 | 授权时长(-1永久、30一个月、365一年) |
| appid | String | 是 | 所属应用ID |

**返回数据格式**:
```json
{
  "success": true,
  "message": "成功生成 X 个卡密",
  "keys": [
    "卡密1",
    "卡密2",
    // 更多卡密...
  ]
}
```

**错误返回**:
```json
{
  "success": false,
  "message": "服务器错误，请稍后再试"
}
```

### 5.3 删除卡密接口 (/api/keys/delete)

**功能描述**: 删除未使用的卡密

**请求方法**: POST

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| key | String | 是 | 要删除的卡密 |

**返回数据格式**:
```json
{
  "success": true,
  "message": "卡密删除成功"
}
```

**错误返回**:
```json
{
  "success": false,
  "message": "错误信息"
}
```

## 6. 域名授权管理API

### 6.1 添加域名授权接口 (/api/auth/add)

**功能描述**: 添加新的域名授权

**请求方法**: POST

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| domain | String | 是 | 要授权的域名 |
| key | String | 是 | 授权卡密 |
| appid | String | 是 | 所属应用ID |

**返回数据格式**:
```json
{
  "success": true,
  "message": "域名授权添加成功",
  "data": {
    "key": String,     // 卡密
    "domain": String,  // 域名
    "time": Number,    // 授权时长
    "state": Number,   // 状态(0有效、1已过期)
    "cert": String,    // 证书
    "token": String,   // 令牌
    "hash": String     // 哈希值
  }
}
```

**错误返回**:
```json
{
  "success": false,
  "message": "错误信息"
}
```

### 6.2 获取域名授权列表接口 (/api/auth/list)

**功能描述**: 获取域名授权列表，支持分页和筛选

**请求方法**: POST

**请求参数**:
| 参数名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| page | Number | 否 | 1 | 页码 |
| pageSize | Number | 否 | 10 | 每页数量 |
| searchKeyword | String | 否 | "" | 搜索关键词（匹配域名或卡密） |
| stateFilter | Number | 否 | "" | 状态筛选(0有效、1已过期) |
| timeFilter | Number | 否 | "" | 授权时长筛选(-1永久、30一个月、365一年) |
| appidFilter | String | 否 | "" | 应用ID筛选 |

**返回数据格式**:
```json
{
  "success": true,
  "data": [
    {
      "key": String,     // 卡密
      "domain": String,  // 域名
      "time": Number,    // 授权时长
      "state": Number,   // 状态
      "cert": String,    // 证书
      "token": String,   // 令牌
      "hash": String     // 哈希值
    }
    // 更多授权...
  ],
  "total": Number,       // 总数
  "currentPage": Number, // 当前页码
  "pageSize": Number     // 每页数量
}
```

**错误返回**:
```json
{
  "success": false,
  "message": "服务器错误，请稍后再试"
}
```

### 6.3 获取未授权域名列表接口 (/api/unauth/list)

**功能描述**: 获取未授权域名列表，支持分页和搜索

**请求方法**: POST

**请求参数**:
| 参数名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| page | Number | 否 | 1 | 页码 |
| pageSize | Number | 否 | 10 | 每页数量 |
| searchKeyword | String | 否 | "" | 搜索关键词（匹配域名） |

**返回数据格式**:
```json
{
  "success": true,
  "data": [
    {
      "domain": String,  // 未授权域名
      "time": Date       // 上报时间
    }
    // 更多未授权域名...
  ],
  "total": Number,       // 总数
  "currentPage": Number, // 当前页码
  "pageSize": Number     // 每页数量
}
```

**错误返回**:
```json
{
  "success": false,
  "message": "服务器错误，请稍后再试"
}
```

## 7. 数据类型说明

### 7.1 授权时长 (time)
- `-1`: 永久授权
- `30`: 一个月授权
- `365`: 一年授权

### 7.2 状态 (state)

**卡密状态**:
- `0`: 未使用
- `1`: 已使用

**授权状态**:
- `0`: 有效
- `1`: 已过期

## 8. 错误码说明

| 状态码 | 描述 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未授权访问/登录失败 |
| 404 | 资源未找到 |
| 500 | 服务器内部错误 |

## 9. API调用示例

### 9.1 查询授权示例

```javascript
// 示例使用axios调用查询授权接口
const axios = require('axios');

async function checkAuthorization(domain) {
  try {
    const response = await axios.post('http://localhost:3000/api/Inquire', {
      domain: domain
    });
    console.log('授权信息:', response.data);
    return response.data;
  } catch (error) {
    console.error('查询授权失败:', error.response.data);
    throw error;
  }
}

// 调用示例
checkAuthorization('example.com');
```

### 9.2 生成卡密示例

```javascript
// 示例使用axios调用生成卡密接口
const axios = require('axios');

async function generateKeys(count, time, appid) {
  try {
    const response = await axios.post('http://localhost:3000/api/keys/generate', {
      count: count,
      time: time,
      appid: appid
    });
    console.log('生成卡密成功:', response.data);
    return response.data.keys;
  } catch (error) {
    console.error('生成卡密失败:', error.response.data);
    throw error;
  }
}

// 调用示例 - 生成5个永久授权卡密
generateKeys(5, -1, 'app001');
```

## 10. 安全注意事项

1. **接口保护**: 管理类API接口应当在前端进行权限验证后调用
2. **数据传输**: 建议在生产环境中使用HTTPS协议传输数据
3. **密码存储**: 系统目前以明文方式存储密码，建议在后续版本中进行加密存储
4. **输入验证**: 所有接口均对输入数据进行基本验证，但仍需在客户端进行合理的数据校验
5. **错误处理**: 接口返回的错误信息应当妥善处理，避免直接展示给最终用户