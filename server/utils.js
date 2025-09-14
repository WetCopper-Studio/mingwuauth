import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// 生成32位随机Token（大小写字母+数字组合）
export const generateToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

// 生成Base64编码
export const encodeBase64 = (data) => {
  return Buffer.from(data).toString('base64');
};

// 解码Base64编码
export const decodeBase64 = (base64Data) => {
  return Buffer.from(base64Data, 'base64').toString('utf8');
};

// 计算哈希值（由证书和Token拼接后计算）
export const calculateHash = (cert, token) => {
  const combined = cert + token;
  return crypto.createHash('sha256').update(combined).digest('hex');
};

// 处理域名（去除www，中文域名转换为xn开头域名）
export const processDomain = (domain) => {
  // 去除http/https
  let processed = domain.replace(/^https?:\/\//, '');
  // 去除www
  processed = processed.replace(/^www\./, '');
  // 去除末尾的斜杠
  processed = processed.replace(/\/$/, '');
  
  // TODO: 中文域名转换为xn开头域名
  // 注意：实际应用中需要使用专门的库来处理中文域名Punycode转换
  
  return processed;
};

// 验证授权时间是否过期
export const checkAuthorizationExpiry = (authTime, createdAt) => {
  if (authTime === -1) {
    return true; // 永久授权，不会过期
  }
  
  const createdDate = new Date(createdAt);
  const expiryDate = new Date(createdDate);
  expiryDate.setDate(expiryDate.getDate() + authTime);
  
  return new Date() < expiryDate;
};

// 生成自签名证书
export const generateCertificate = (domain, appid) => {
  // 主题信息
  const subject = {
    CN: domain,
    O: '冥雾授权站',
    L: 'Changchun',
    S: 'Jilin',
    C: 'CN'
  };
  
  // 签发者信息
  const issuer = {
    CN: 'AUth',
    O: appid,
    C: 'CN'
  };
  
  // 证书有效期：当前时间到10年后
  const now = new Date();
  const expires = new Date(now);
  expires.setFullYear(expires.getFullYear() + 10);
  
  // 模拟证书内容
  const certContent = `-----BEGIN CERTIFICATE-----
MIIDazCCAlOgAwIBAgIUJQ==
// 主题信息: ${JSON.stringify(subject)}
// 签发者信息: ${JSON.stringify(issuer)}
// 颁发时间: ${now.toISOString()}
// 过期时间: ${expires.toISOString()}
// 密钥算法: RSA
-----END CERTIFICATE-----`;
  
  // 模拟私钥内容
  const privateKeyContent = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC6
// 证书私钥内容
-----END PRIVATE KEY-----`;
  
  return {
    cert: certContent,
    privateKey: privateKeyContent
  };
};

// 生成证书（兼容API调用）
export const generateCert = (domain, key, appid) => {
  const result = generateCertificate(domain, appid);
  // 对证书内容进行Base64加密
  return encodeBase64(result.cert);
};

// 生成Token（兼容API调用，带参数）
export const generateAuthToken = (domain, key) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

// 生成完整的证书信息，包含所有需要的字段
export const generateFullCertificateInfo = (domain, key, appid) => {
  const result = generateCertificate(domain, appid);
  const token = generateAuthToken(domain, key);
  
  // 对证书和私钥进行Base64加密
  const base64Cert = encodeBase64(result.cert);
  const base64PrivateKey = encodeBase64(result.privateKey);
  
  // 拼接Base64加密后的证书和Token，计算哈希值
  const hashInput = base64Cert + token;
  const hash = crypto.createHash('sha256').update(hashInput).digest('hex');
  
  return {
    cert: base64Cert,         // Base64加密后的证书
    privateKey: base64PrivateKey, // Base64加密后的私钥
    token: token,            // 原始Token
    hash: hash               // 哈希值
  };
};

// 生成Hash（兼容API调用）
export const generateHash = (cert, token) => {
  // 根据项目文档要求，拼接Base64加密后的证书和Token，然后计算哈希值
  const hashInput = cert + token;
  return crypto.createHash('sha256').update(hashInput).digest('hex');
};