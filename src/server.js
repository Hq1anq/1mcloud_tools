import express from 'express';
import dotenv from 'dotenv';
import serverRoutes from './routes/server.js';
import proxyRoutes from './routes/proxy.js';
import configViewEngine from './config/viewEngine.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// config template engine
configViewEngine(app);

app.use(express.json());

app.get('/', (req, res) => {
    res.render('index'); // This will render views/index.ejs
});

// API routes
app.use('/api', serverRoutes);
app.use('/api', proxyRoutes);

app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
});
