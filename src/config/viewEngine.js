import express from 'express';

const configViewEngine = (app) => {
    app.set('views', 'src/views'); // Set the views directory);
    app.set('view engine', 'ejs');
    app.use(express.static('src/public')); // Serve static files from public directory
}

export default configViewEngine;