import express from 'express';
const router = express.Router();

// 导入中间件
import { body, validationResult } from 'express-validator';

// 导入Node.js模块
import fs from 'fs';
import path from 'path';

// 导入数据库模型
import { Key } from '../models/key.js';
import { Auth } from '../models/auth.js';
import { Cert } from '../models/cert.js';
import { Unauth } from '../models/unauth.js';
import { Apps } from '../models/apps.js';
import { AppConfig } from '../models/appconfig.js';

// 导入工具函数
import {
  generateToken, 
  encodeBase64, 
  calculateHash, 
  processDomain, 
  checkAuthorizationExpiry, 
  generateCertificate,
  generateCert,
  generateHash,
  generateAuthToken,
  generateFullCertificateInfo 
} from '../utils.js';

// 1. 授权查询接口（/api/Inquire）
router.post('/Inquire', 
  [
    body('domain').isString().notEmpty().withMessage('域名不能为空')
  ], 
  async (req, res) => {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // 处理域名
      const domain = processDomain(req.body.domain);

      // 查询授权信息
      const authInfo = await Auth.findOne({ domain });
      
      if (!authInfo) {
        return res.status(404).json({
          success: false,
          message: '未找到该域名的授权信息'
        });
      }

      // 检查授权是否过期
      const isExpired = !checkAuthorizationExpiry(authInfo.time, authInfo.createdAt);
      
      // 未过期状态为1，过期状态为0
      const status = isExpired ? 0 : authInfo.state;

      return res.json({
        success: true,
        time: authInfo.time,
        state: status,
        domain: authInfo.domain
      });
    } catch (error) {
      console.error('查询授权失败:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误，请稍后再试'
      });
    }
  }
);

// 2. 授权绑定接口（/api/bind）
router.post('/bind', 
  [
    body('key').isString().notEmpty().withMessage('授权码不能为空'),
    body('domain').isString().notEmpty().withMessage('域名不能为空')
  ], 
  async (req, res) => {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { key, domain } = req.body;
      
      // 处理域名
      const processedDomain = processDomain(domain);

      // 1. 检查授权码是否存在且未使用
      const keyInfo = await Key.findOne({ key, state: 0 });
      if (!keyInfo) {
        return res.status(400).json({
          success: false,
          message: '无效的授权码或授权码已被使用'
        });
      }

      // 2. 检查域名是否已被绑定
      const existingAuth = await Auth.findOne({ domain: processedDomain });
      if (existingAuth) {
        return res.status(400).json({
          success: false,
          message: '该域名已被绑定'
        });
      }

      // 3. 使用新的证书生成逻辑，获取完整的证书信息
      const certInfo = generateFullCertificateInfo(processedDomain, key, keyInfo.appid);

      // 7. 更新授权码状态为已使用
      keyInfo.state = 1;
      await keyInfo.save();

      // 8. 保存授权信息到auth表
      const newAuth = new Auth({
        key: key,
        domain: processedDomain,
        time: keyInfo.time,
        state: 1,
        cert: certInfo.cert,
        token: certInfo.token,
        hash: certInfo.hash
      });
      await newAuth.save();

      // 9. 保存证书信息到cert表
      const newCert = new Cert({
        domain: processedDomain,
        cert: certInfo.cert,
        Private: certInfo.privateKey,
        token: certInfo.token,
        hash: certInfo.hash
      });
      await newCert.save();

      return res.json({
        success: true,
        cert: certInfo.cert,
        privateKey: certInfo.privateKey,
        token: certInfo.token,
        hash: certInfo.hash
      });
    } catch (error) {
      console.error('授权绑定失败:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误，请稍后再试'
      });
    }
  }
);

// 3. 授权验证接口（/api/verify）
router.post('/verify', 
  [
    body('domain').isString().notEmpty().withMessage('域名不能为空'),
    body('cert').isString().notEmpty().withMessage('证书不能为空'),
    body('hash').isString().notEmpty().withMessage('哈希值不能为空')
  ], 
  async (req, res) => {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { domain, cert, hash } = req.body;
      
      // 处理域名
      const processedDomain = processDomain(domain);

      // 查询授权信息
      const authInfo = await Auth.findOne({ domain: processedDomain, cert, hash });
      
      if (!authInfo) {
        return res.json({
          success: false,
          state: 0,
          message: '授权验证失败'
        });
      }

      // 检查授权是否过期
      const isExpired = !checkAuthorizationExpiry(authInfo.time, authInfo.createdAt);
      
      // 未过期状态为1，过期状态为0
      const state = isExpired ? 0 : authInfo.state;

      return res.json({
        success: state === 1,
        state: state
      });
    } catch (error) {
      console.error('授权验证失败:', error);
      return res.status(500).json({
        success: false,
        state: 0,
        message: '服务器错误，请稍后再试'
      });
    }
  }
);

// 4. 应用信息接口（/api/appinfo）
router.post('/appinfo', 
  [
    body('appid').isString().notEmpty().withMessage('应用ID不能为空')
  ], 
  async (req, res) => {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { appid } = req.body;

      // 查询应用信息
      const appInfo = await Apps.findOne({ appid });
      
      if (!appInfo) {
        return res.status(404).json({
          success: false,
          message: '未找到该应用信息'
        });
      }

      return res.json({
        success: true,
        appid: appInfo.appid,
        name: appInfo.name,
        Download: appInfo.Download,
        version: appInfo.version
      });
    } catch (error) {
      console.error('获取应用信息失败:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误，请稍后再试'
      });
    }
  }
);

// 5. 盗版上报接口（/api/unauth）
router.post('/unauth', 
  [
    body('domain').isString().notEmpty().withMessage('域名不能为空')
  ], 
  async (req, res) => {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { domain } = req.body;
      
      // 处理域名
      const processedDomain = processDomain(domain);

      // 保存未授权域名信息
      const newUnauth = new Unauth({
        domain: processedDomain,
        time: new Date()
      });
      await newUnauth.save();

      return res.json({
        success: true,
        message: '上报成功'
      });
    } catch (error) {
      console.error('盗版上报失败:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误，请稍后再试'
      });
    }
  }
);

// 6. 获取配置接口
router.get('/config', async (req, res) => {
  try {
    // 首先检查本地是否有config.json文件
    const configPath = path.join(process.cwd(), 'config.json');
    if (fs.existsSync(configPath)) {
      try {
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log('已检测到本地配置文件');
        return res.json({
          success: true,
          config: configData
        });
      } catch (fileError) {
        console.warn('读取本地配置文件失败:', fileError.message);
      }
    }
    
    // 如果本地没有配置文件或读取失败，则查询数据库
    const config = await AppConfig.findOne();
    
    if (config) {
      return res.json({
        success: true,
        config: config
      });
    } else {
      return res.json({
        success: false,
        message: '未找到配置信息'
      });
    }
  } catch (error) {
    console.error('获取配置失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
});

// 7. 保存配置接口
router.post('/save-config', async (req, res) => {
  try {
    const { MoIP, MoPo, MoUs, MoPs, Adname, Adpsd } = req.body;
    
    // 验证配置数据
    if (!MoIP || !MoPo || !MoUs || !MoPs || !Adname || !Adpsd) {
      return res.status(400).json({
        success: false,
        message: '配置信息不完整'
      });
    }
    
    // 首先保存到本地文件，确保配置不会丢失
    const configPath = path.join(process.cwd(), 'config.json');
    const configData = {
      MoIP, MoPo, MoUs, MoPs, Adname, Adpsd
    };
    
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
    console.log('配置已保存到本地文件');
    
    // 尝试保存到MongoDB（即使失败也不影响配置成功）
    try {
      const queryTimeout = 10000; // 10秒超时，与db.js保持一致
      
      // 检查是否已有配置（带超时）
      let config;
      try {
        config = await Promise.race([
          AppConfig.findOne(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('查询超时')), queryTimeout))
        ]);
      } catch (queryError) {
        console.warn('查询配置超时，将创建新配置:', queryError.message);
      }
      
      if (config) {
        // 更新现有配置
        config.MoIP = MoIP;
        config.MoPo = MoPo;
        config.MoUs = MoUs;
        config.MoPs = MoPs;
        config.Adname = Adname;
        config.Adpsd = Adpsd;
        
        // 保存更新（带超时）
        try {
          await Promise.race([
            config.save(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('保存超时')), queryTimeout))
          ]);
          console.log('配置已保存到数据库');
        } catch (saveError) {
          console.warn('更新配置到数据库超时:', saveError.message);
        }
      } else {
        // 创建新配置
        const newConfig = new AppConfig({
          MoIP, MoPo, MoUs, MoPs, Adname, Adpsd
        });
        
        // 保存新配置（带超时）
        try {
          await Promise.race([
            newConfig.save(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('保存超时')), queryTimeout))
          ]);
          console.log('新配置已创建并保存到数据库');
        } catch (saveError) {
          console.warn('创建配置到数据库超时:', saveError.message);
        }
      }
    } catch (dbError) {
      console.warn('保存到数据库失败（不影响配置成功）:', dbError.message);
      console.log('配置已保存到本地文件，MongoDB连接后会自动同步');
    }
    
    return res.json({
      success: true,
      message: '配置保存成功'
    });
  } catch (error) {
    console.error('保存配置失败:', error);
    return res.status(500).json({
      success: false,
      message: '保存配置失败，请稍后再试'
    });
  }
});

// 8. 管理员登录接口（/api/login）
router.post('/login', 
  [
    body('username').isString().notEmpty().withMessage('用户名不能为空'),
    body('password').isString().notEmpty().withMessage('密码不能为空')
  ], 
  async (req, res) => {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;

      // 查询配置信息中的管理员账号密码，设置超时处理
      let config;
      try {
        // 设置查询超时时间为5秒
        config = await Promise.race([
          AppConfig.findOne(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('数据库查询超时')), 5000))
        ]);
      } catch (dbError) {
        console.error('数据库查询失败:', dbError.message);
        // 如果数据库查询失败，尝试直接使用本地配置文件进行验证
        try {
          const configPath = path.join(process.cwd(), 'config.json');
          if (fs.existsSync(configPath)) {
            const localConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (username === localConfig.Adname && password === localConfig.Adpsd) {
              return res.json({
                success: true,
                message: '登录成功'
              });
            } else {
              return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
              });
            }
          }
        } catch (fileError) {
          console.error('读取本地配置文件失败:', fileError.message);
        }
        
        return res.status(500).json({
          success: false,
          message: '数据库连接超时，请稍后再试'
        });
      }
      
      if (!config) {
        return res.status(404).json({
          success: false,
          message: '未找到配置信息'
        });
      }

      // 验证用户名和密码
      if (username === config.Adname && password === config.Adpsd) {
        return res.json({
          success: true,
          message: '登录成功'
        });
      } else {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }
    } catch (error) {
      console.error('登录失败:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误，请稍后再试'
      });
    }
  }
);

// 9. 获取应用列表接口（/api/apps/list）
router.post('/apps/list', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, searchKeyword = '' } = req.body;
    const skip = (page - 1) * pageSize;
    
    // 构建查询条件
    const query = {};
    if (searchKeyword) {
      query.$or = [
        { appid: { $regex: searchKeyword, $options: 'i' } },
        { name: { $regex: searchKeyword, $options: 'i' } }
      ];
    }
    
    // 查询数据
    const apps = await Apps.find(query)
      .skip(skip)
      .limit(Number(pageSize))
      .sort({ updatedAt: -1 });
    
    // 查询总数
    const total = await Apps.countDocuments(query);
    
    return res.json({
      success: true,
      data: apps,
      total,
      currentPage: Number(page),
      pageSize: Number(pageSize)
    });
  } catch (error) {
    console.error('获取应用列表失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
});

// 10. 添加应用接口（/api/apps/add）
router.post('/apps/add', 
  [
    body('appid').isString().notEmpty().withMessage('应用ID不能为空'),
    body('name').isString().notEmpty().withMessage('应用名称不能为空'),
    body('Download').isString().notEmpty().withMessage('下载链接不能为空'),
    body('version').isString().notEmpty().withMessage('版本号不能为空')
  ], 
  async (req, res) => {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { appid, name, Download, version } = req.body;
      
      // 检查应用ID是否已存在
      const existingApp = await Apps.findOne({ appid });
      if (existingApp) {
        return res.status(400).json({
          success: false,
          message: '应用ID已存在'
        });
      }
      
      // 创建新应用
      const newApp = new Apps({
        appid,
        name,
        Download,
        version
      });
      
      await newApp.save();
      
      return res.json({
        success: true,
        message: '应用添加成功',
        data: newApp
      });
    } catch (error) {
      console.error('添加应用失败:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误，请稍后再试'
      });
    }
  }
);

// 11. 更新应用接口（/api/apps/update）
router.post('/apps/update', 
  [
    body('appid').isString().notEmpty().withMessage('应用ID不能为空'),
    body('name').isString().notEmpty().withMessage('应用名称不能为空'),
    body('Download').isString().notEmpty().withMessage('下载链接不能为空'),
    body('version').isString().notEmpty().withMessage('版本号不能为空')
  ], 
  async (req, res) => {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { appid, name, Download, version } = req.body;
      
      // 更新应用
      const updatedApp = await Apps.findOneAndUpdate(
        { appid },
        { name, Download, version },
        { new: true }
      );
      
      if (!updatedApp) {
        return res.status(404).json({
          success: false,
          message: '未找到该应用'
        });
      }
      
      return res.json({
        success: true,
        message: '应用更新成功',
        data: updatedApp
      });
    } catch (error) {
      console.error('更新应用失败:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误，请稍后再试'
      });
    }
  }
);

// 12. 删除应用接口（/api/apps/delete）
router.post('/apps/delete', 
  [
    body('appid').isString().notEmpty().withMessage('应用ID不能为空')
  ], 
  async (req, res) => {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { appid } = req.body;
      
      // 删除应用
      const deletedApp = await Apps.findOneAndDelete({ appid });
      
      if (!deletedApp) {
        return res.status(404).json({
          success: false,
          message: '未找到该应用'
        });
      }
      
      return res.json({
        success: true,
        message: '应用删除成功'
      });
    } catch (error) {
      console.error('删除应用失败:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误，请稍后再试'
      });
    }
  }
);

// 13. 获取卡密列表接口（/api/keys/list）
router.post('/keys/list', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, searchKeyword = '', stateFilter = '', timeFilter = '', appidFilter = '' } = req.body;
    const skip = (page - 1) * pageSize;
    
    // 构建查询条件
    const query = {};
    if (searchKeyword) {
      query.key = { $regex: searchKeyword, $options: 'i' };
    }
    if (stateFilter !== '') {
      query.state = parseInt(stateFilter);
    }
    if (timeFilter !== '') {
      query.time = parseInt(timeFilter);
    }
    if (appidFilter !== '') {
      query.appid = appidFilter;
    }
    
    // 查询数据
    const keys = await Key.find(query)
      .skip(skip)
      .limit(Number(pageSize))
      .sort({ updatedAt: -1 });
    
    // 查询总数
    const total = await Key.countDocuments(query);
    
    return res.json({
      success: true,
      data: keys,
      total,
      currentPage: Number(page),
      pageSize: Number(pageSize)
    });
  } catch (error) {
    console.error('获取卡密列表失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
});

// 14. 生成卡密接口（/api/keys/generate）
router.post('/keys/generate', 
  [
    body('count').isInt({ min: 1, max: 100 }).withMessage('生成数量应在1-100之间'),
    body('time').isIn([-1, 30, 365]).withMessage('授权时长无效'),
    body('appid').isString().notEmpty().withMessage('应用ID不能为空')
  ], 
  async (req, res) => {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { count, time, appid } = req.body;
      
      // 生成随机卡密
      const generateRandomKey = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let key = '';
        for (let i = 0; i < 16; i++) {
          key += chars.charAt(Math.floor(Math.random() * chars.length));
          // 添加分隔符
          if ((i + 1) % 4 === 0 && i < 15) {
            key += '-';
          }
        }
        return key;
      };
      
      // 生成卡密数组
      const keysToGenerate = [];
      const generatedKeys = [];
      
      for (let i = 0; i < count; i++) {
        let newKey;
        let isUnique = false;
        
        // 确保生成的卡密唯一
        while (!isUnique) {
          newKey = generateRandomKey();
          const exists = await Key.findOne({ key: newKey });
          if (!exists) {
            isUnique = true;
          }
        }
        
        keysToGenerate.push({
          key: newKey,
          time: time,
          state: 0,
          appid: appid
        });
        
        generatedKeys.push(newKey);
      }
      
      // 批量插入卡密
      await Key.insertMany(keysToGenerate);
      
      return res.json({
        success: true,
        message: `成功生成 ${count} 个卡密`,
        keys: generatedKeys
      });
    } catch (error) {
      console.error('生成卡密失败:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误，请稍后再试'
      });
    }
  }
);

// 15. 删除卡密接口（/api/keys/delete）
router.post('/keys/delete', 
  [
    body('key').isString().notEmpty().withMessage('卡密不能为空')
  ], 
  async (req, res) => {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { key } = req.body;
      
      // 检查卡密是否存在且未使用
      const keyInfo = await Key.findOne({ key, state: 0 });
      if (!keyInfo) {
        return res.status(404).json({
          success: false,
          message: '未找到该卡密或卡密已使用'
        });
      }
      
      // 删除卡密
      await Key.deleteOne({ key });
      
      return res.json({
        success: true,
        message: '卡密删除成功'
      });
    } catch (error) {
      console.error('删除卡密失败:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误，请稍后再试'
      });
    }
  }
);

// 16. 添加域名授权接口（/api/auth/add）
router.post('/auth/add', 
  [
    body('domain').isString().notEmpty().withMessage('域名不能为空'),
    body('key').isString().notEmpty().withMessage('卡密不能为空'),
    body('appid').isString().notEmpty().withMessage('应用ID不能为空')
  ], 
  async (req, res) => {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { domain, key, appid } = req.body;
      
      // 检查卡密是否存在且未使用
      const keyInfo = await Key.findOne({ key, state: 0 });
      if (!keyInfo) {
        return res.status(404).json({
          success: false,
          message: '未找到该卡密或卡密已使用'
        });
      }
      
      // 检查域名是否已被授权
      const existingAuth = await Auth.findOne({ domain });
      if (existingAuth) {
        return res.status(400).json({
          success: false,
          message: '该域名已经被授权，请先吊销原授权'
        });
      }
      
      // 使用新的证书生成逻辑，获取完整的证书信息
      const certInfo = generateFullCertificateInfo(domain, key, appid);
      
      // 创建新的授权记录
      const newAuth = new Auth({
        key,
        domain,
        time: keyInfo.time,
        state: 0, // 有效状态
        cert: certInfo.cert,        // Base64加密后的证书
        token: certInfo.token,      // 原始Token
        hash: certInfo.hash         // 哈希值
      });
      
      await newAuth.save();
      
      // 更新卡密状态为已使用
      await Key.updateOne({ key }, { state: 1, domain });
      
      return res.json({
        success: true,
        message: '域名授权添加成功',
        data: newAuth
      });
    } catch (error) {
      console.error('添加域名授权失败:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误，请稍后再试'
      });
    }
  }
);

// 17. 获取域名授权列表接口（/api/auth/list）
router.post('/auth/list', async (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 10, 
      searchKeyword = '',
      stateFilter = '',
      timeFilter = '',
      appidFilter = '' 
    } = req.body;
    const skip = (page - 1) * pageSize;
    
    // 构建查询条件
    const query = {};
    
    // 搜索关键词筛选
    if (searchKeyword) {
      // 支持同时搜索域名或卡密
      query.$or = [
        { domain: { $regex: searchKeyword, $options: 'i' } },
        { key: { $regex: searchKeyword, $options: 'i' } }
      ];
    }
    
    // 状态筛选
    if (stateFilter !== '') {
      query.state = Number(stateFilter);
    }
    
    // 授权时长筛选
    if (timeFilter !== '') {
      query.time = Number(timeFilter);
    }
    
    // 应用ID筛选
    if (appidFilter !== '') {
      query.appid = appidFilter;
    }
    
    // 查询数据
    const auths = await Auth.find(query)
      .skip(skip)
      .limit(Number(pageSize))
      .sort({ createdAt: -1 });
    
    // 查询总数
    const total = await Auth.countDocuments(query);
    
    return res.json({
      success: true,
      data: auths,
      total,
      currentPage: Number(page),
      pageSize: Number(pageSize)
    });
  } catch (error) {
    console.error('获取域名授权列表失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
});

// 17. 获取未授权域名列表接口（/api/unauth/list）
router.post('/unauth/list', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, searchKeyword = '' } = req.body;
    const skip = (page - 1) * pageSize;
    
    // 构建查询条件
    const query = {};
    if (searchKeyword) {
      query.domain = { $regex: searchKeyword, $options: 'i' };
    }
    
    // 查询数据
    const unauths = await Unauth.find(query)
      .skip(skip)
      .limit(Number(pageSize))
      .sort({ time: -1 });
    
    // 查询总数
    const total = await Unauth.countDocuments(query);
    
    return res.json({
      success: true,
      data: unauths,
      total,
      currentPage: Number(page),
      pageSize: Number(pageSize)
    });
  } catch (error) {
    console.error('获取未授权域名列表失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
});

// 18. 获取统计数据接口（/api/stats）
router.get('/stats', async (req, res) => {
  try {
    // 获取活跃授权数
    const activeAuthorizations = await Auth.countDocuments({ state: 1 });
    
    // 获取未授权域名数
    const unauthorizedDomains = await Unauth.countDocuments();
    
    // 获取卡密总数
    const totalKeys = await Key.countDocuments();
    
    // 获取应用总数
    const totalApps = await Apps.countDocuments();
    
    return res.json({
      success: true,
      data: {
        activeAuthorizations,
        unauthorizedDomains,
        totalKeys,
        totalApps
      }
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误，请稍后再试'
    });
  }
});

export default router;