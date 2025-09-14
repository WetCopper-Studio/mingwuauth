import mongoose from 'mongoose';

const certSchema = new mongoose.Schema({
  domain: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  cert: {
    type: String,
    required: true
  },
  Private: {
    type: String,
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  hash: {
    type: String,
    required: true,
    unique: true
  }
}, {
  timestamps: true
});

// 授权证书：由域名生成自签证书
// 证书私钥：自签证书的私钥
// 授权Token：随机生成一个32位的字符串（大小写字母+数字组合）
// 哈希值：由`授权证书`、`授权Token`得出

export const Cert = mongoose.model('Cert', certSchema);

export default Cert;