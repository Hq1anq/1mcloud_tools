import mongoose from 'mongoose'

const proxySchema = new mongoose.Schema({
  sid: Number,
  ip_port: String,
  country: String,
  type: String,
  created: String,
  expired: String,
  ip_changed: Number,
  status: String,
  note: String,
  user_pass: String, // optional
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
})

const Proxy = mongoose.model('Proxy', proxySchema)

export default Proxy
