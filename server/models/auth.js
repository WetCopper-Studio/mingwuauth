import mongoose from 'mongoose';

const authSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    index: true
  },
  domain: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  time: {
    type: Number,
    required: true,
    default: -1
  },
  state: {
    type: Number,
    required: true,
    default: 1
  },
  cert: {
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

// 时间字段说明：-1永久、30一个月、365一年
// 状态字段说明：0为未使用、1为已使用

export const Auth = mongoose.model('Auth', authSchema);

export default Auth;