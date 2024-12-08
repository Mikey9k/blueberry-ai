import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
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
    submittedRating: { type: Number, required: true, min: 1, max: 5 },
    feedbackText: { type: String, required: false },
  });
  
  const Feedback = mongoose.model('Feedback', feedbackSchema);
  
  app.post('/api/submitFeedback', async (req, res) => {
    try {
        const feedback = await Feedback.create(req.body); // Create and save the document in one step
        res.status(201).send(feedback); 
    } catch (error) {
      console.error('Error saving feedback:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).send({ error: 'Validation Error', details: error.errors });
      }
      res.status(500).send({ error: 'Internal Server Error' });
    }
  });

app.listen(3333, () => {
    console.log('Server started on port 3333');
});