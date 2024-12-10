import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import mongoose, { model } from 'mongoose';
import MongoClient from 'mongodb';

import postRoutes from './routes/postRoutes.js';
import dalleRoutes from './routes/dalleRoutes.js';

import { connectToDB } from './db/conn.js';

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



connectToDB();

const feedbackSchema = new mongoose.Schema({
    quote: { type: String, required: true },
    theme: { type: String, required: true },
    color: { type: String, required: false },
    formality: { type: String, required: false },
    visualRating: { type: Number, required: true, min: 1, max: 5 },
    textRating: { type: Number, required: true, min: 1, max: 5 },
    feedbackText: { type: Object, required: false },
    text: { type: String, required: false },
    template: { type: String, required: false },
    model: { type: String, required: false },
});
  
const Feedback = mongoose.model('Feedback', feedbackSchema);

app.post('/api/submitFeedback', async (req, res) => {
    try {
        // Validate request body
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).send({ error: 'Bad Request', message: 'Feedback data is required' });
        }

        // Create and save the feedback document
        const feedback = await Feedback.create(req.body);
        console.log('Feedback submitted successfully:', feedback);
        res.status(201).send(feedback);
    } catch (error) {
        console.error('Error saving feedback:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).send({ error: 'Validation Error', details: error.errors });
        }

        res.status(500).send({ error: 'Internal Server Error', message: 'An unexpected error occurred while saving feedback' });
    }
});

app.listen(3333, () => {
    console.log('Server started on port 3333');
});