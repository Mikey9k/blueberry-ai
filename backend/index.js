import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';

import postRoutes from './routes/postRoutes.js';
import dalleRoutes from './routes/dalleRoutes.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/v1/post', postRoutes);
app.use('/api/v1/dalle', dalleRoutes);

app.get('/test', (req, res) => {
    return res.json('Hello World! :)');
});

app.get('/create', (req, res) => {
    console.log(req.query);
    return res.json("ok");
});

app.listen(3333, () => {
    console.log('Server started on port 3333');
});