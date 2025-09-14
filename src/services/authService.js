import axios from 'axios';

// 创建axios实例
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 30000, // 增加超时时间到30秒
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
apiClient.interceptors.request.use(
  config => {
    // 可以在这里添加token等认证信息
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    console.error('API请求错误:', error);
    // 统一错误处理
    if (error.response) {
      // 服务器返回了错误状态码
      const { status, data } = error.response;
      switch (status) {
        case 400:
          return Promise.reject({
            success: false,
            message: data.message || '请求参数错误'
          });
        case 401:
          // 未授权，可以在这里跳转到登录页
          return Promise.reject({
            success: false,
            message: '未授权，请登录'
          });
        case 404:
          return Promise.reject({
            success: false,
            message: '请求的资源不存在'
          });
        case 500:
          return Promise.reject({
            success: false,
            message: '服务器内部错误，请稍后再试'
          });
        default:
          return Promise.reject({
            success: false,
            message: data.message || '请求失败'
          });
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      return Promise.reject({
        success: false,
        message: '网络错误，请检查网络连接'
      });
    } else {
      // 请求配置出错
      return Promise.reject({
        success: false,
        message: error.message || '请求失败'
      });
    }
  }
);

// API方法封装
const authService = {
  // 1. 授权查询
  inquireAuthorization: async (domain) => {
    try {
      const response = await apiClient.post('/Inquire', { domain });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 2. 授权绑定
  bindAuthorization: async (key, domain) => {
    try {
      const response = await apiClient.post('/bind', { key, domain });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 3. 授权验证
  verifyAuthorization: async (domain, cert, hash) => {
    try {
      const response = await apiClient.post('/verify', { domain, cert, hash });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 4. 应用信息
  getAppInfo: async (appid) => {
    try {
      const response = await apiClient.post('/appinfo', { appid });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 5. 盗版上报
  reportUnauthorized: async (domain) => {
    try {
      const response = await apiClient.post('/unauth', { domain });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 6. 获取卡密列表
  getKeyList: async (params = {}) => {
    try {
      const response = await apiClient.post('/keys/list', params);
      return response;
    } catch (error) {
      console.error('获取卡密列表失败:', error);
      throw error;
    }
  },

  // 7. 生成卡密
  generateKeys: async (params) => {
    try {
      const response = await apiClient.post('/keys/generate', params);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 8. 删除卡密
  deleteKey: async (key) => {
    try {
      const response = await apiClient.post('/keys/delete', { key });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // 9. 获取应用列表
getAppList: async (params = {}) => {
  try {
    const response = await apiClient.post('/apps/list', params);
    return response;
  } catch (error) {
    throw error;
  }
},

// 10. 获取统计数据
getStats: async () => {
  try {
    const response = await apiClient.get('/stats');
    return response;
  } catch (error) {
    console.error('获取统计数据失败:', error);
    // 如果接口不存在，返回默认值
    return {
      success: true,
      data: {
        totalKeys: 0,
        activeAuthorizations: 0,
        totalApps: 0,
        unauthorizedDomains: 0
      }
    };
  }
},

// 11. 获取最近活动
getRecentActivities: async () => {
  try {
    // 由于后端没有专门的接口获取最近活动，这里暂时返回空数组
    // 在实际应用中，应该添加相应的API端点和活动日志记录功能
    return {
      success: true,
      data: []
    };
  } catch (error) {
    throw error;
  }
},

// 12. 获取域名授权列表
getAuthList: async (params = {}) => {
  try {
    // 由于服务端没有专门的授权列表接口，我们需要创建这个接口
    // 目前先尝试使用一个临时的接口路径，后续会在服务端添加
    const response = await apiClient.post('/auth/list', params);
    return response;
  } catch (error) {
    console.error('获取域名授权列表失败:', error);
    throw error;
  }
},

// 13. 获取未授权域名列表
getUnauthList: async (params = {}) => {
  try {
    // 由于服务端没有专门的未授权域名列表接口，我们需要创建这个接口
    // 目前先尝试使用一个临时的接口路径，后续会在服务端添加
    const response = await apiClient.post('/unauth/list', params);
    return response;
  } catch (error) {
    console.error('获取未授权域名列表失败:', error);
    throw error;
  }
},

// 14. 添加域名授权
addAuth: async (domain, key, appid) => {
  try {
    const response = await apiClient.post('/auth/add', { domain, key, appid });
    return response;
  } catch (error) {
    console.error('添加域名授权失败:', error);
    throw error;
  }
}
};

// 导出服务对象
export default authService;

// 导出apiClient实例，供其他组件直接使用
export { apiClient as apiClient };