import mongoose from 'mongoose';

const keySchema = new mongoose.Schema({
  key: {
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
    default: 0
  },
  appid: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// 时间字段说明：-1永久、30一个月、365一年
// 状态字段说明：0为未使用、1为已使用

export const Key = mongoose.model('Key', keySchema);

export default Key;