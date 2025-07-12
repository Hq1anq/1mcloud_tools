import express from 'express';
import dotenv from 'dotenv';
import serverRoutes from './routes/manager.js';
import proxyRoutes from './routes/proxy.js';
import configViewEngine from './config/viewEngine.js';
import getHomePage from './controllers/home.js';
import connection from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// config template engine
configViewEngine(app);

app.use(express.json());

// app.get('/', (req, res) => {
//     res.render('home'); // This will render views/home.ejs
// });

app.get('/', getHomePage);

app.get('/proxyChecker', (req, res) => {
    res.render('proxyChecker'); // This will render views/proxyChecker.ejs
});

app.get('/proxyManager', (req, res) => {
    res.render('proxyManager'); // This will render views/proxyManager.ejs
});

connection.query(
    'SELECT * FROM Users',
    function (error, results, fields) {
        if (error) {
            console.error('Error fetching users:', error);
            return;
        }
        console.log('Users:', results);
    }
)

// API routes
app.use('/api', serverRoutes);
app.use('/api', proxyRoutes);

app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
});
