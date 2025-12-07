import express from 'express'
import dotenv from 'dotenv'
import routes from './routes/web.js'
import { configViewEngine } from './config/viewEngine.js'
import { connectDB } from './config/database.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// config template engine
configViewEngine(app)

app.use(express.json()) // for json
app.use(express.urlencoded({ extended: true })) // for form data

app.get('/proxyChecker', (req, res) => {
  res.render('proxyChecker') // This will render views/proxyChecker.ejs
})

app.get('/', (req, res) => {
  res.render('proxyManager') // This will render views/proxyManager.ejs
})

app.get('/proxyManager', (req, res) => {
  res.render('proxyManager') // This will render views/proxyManager.ejs
})

// API routes
app.use('/', routes)

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`)
  console.log(`Proxy server running on port ${PORT}`)
  connectDB()
})
