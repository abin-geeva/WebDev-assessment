require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const port = Number(process.env.PORT) || 3000;

const portfolioSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  age: { type: Number, min: 13, max: 120 },
  location: { type: String, trim: true, maxlength: 120 },
  gender: { type: String, trim: true, maxlength: 60 },
  academicYear: { type: String, trim: true, maxlength: 60 },
  institution: { type: String, trim: true, maxlength: 160 },
  course: { type: String, trim: true, maxlength: 160 },
  skills: [{ type: String, trim: true, maxlength: 80 }],
  hobbies: [{ type: String, trim: true, maxlength: 80 }],
  projects: [{ type: String, trim: true, maxlength: 240 }],
  certificates: [{ type: String, trim: true, maxlength: 240 }],
  aboutMe: { type: String, trim: true, maxlength: 2000 }
}, { timestamps: true, collection: 'portfolios' });

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

const feedbackSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  phone: { type: String, required: true, trim: true, maxlength: 25 },
  feedback: { type: String, required: true, trim: true, maxlength: 2000 }
}, { timestamps: true, collection: 'feedbacks' });

const Feedback = mongoose.model('Feedback', feedbackSchema);

app.use(express.json({ limit: '30kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/portfolios', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'The portfolio database is not connected yet. Please configure MongoDB and try again.' });
  }
  try {
    const { name, email } = req.body;
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Please enter your name.' });
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    const listFields = ['skills', 'hobbies', 'projects', 'certificates'];
    const data = {
      name: name.trim(),
      email: email.trim(),
      location: req.body.location,
      gender: req.body.gender,
      academicYear: req.body.academicYear,
      institution: req.body.institution,
      course: req.body.course,
      aboutMe: req.body.aboutMe
    };
    if (req.body.age !== '' && req.body.age != null) data.age = Number(req.body.age);
    for (const field of listFields) {
      const value = req.body[field];
      data[field] = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
      data[field] = data[field].map(item => String(item).trim()).filter(Boolean);
    }

    const portfolio = await Portfolio.create(data);
    return res.status(201).json({ message: 'Your portfolio details have been saved.', id: portfolio.id });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: 'Please check your entries and try again.' });
    }
    console.error('Could not save portfolio:', error.message);
    return res.status(500).json({ message: 'Could not save your portfolio. Please try again.' });
  }
});

app.get('/api/portfolios/:id', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'The portfolio database is not connected yet.' });
  }
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'That portfolio link is not valid.' });
    }
    const portfolio = await Portfolio.findById(req.params.id).lean();
    if (!portfolio) return res.status(404).json({ message: 'No saved portfolio was found.' });
    return res.json(portfolio);
  } catch (error) {
    console.error('Could not load portfolio:', error.message);
    return res.status(500).json({ message: 'Could not load the saved portfolio.' });
  }
});

app.post('/api/feedback', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'The feedback database is not connected yet. Please try again shortly.' });
  }
  try {
    const { name, email, phone, feedback } = req.body;
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Please enter your name.' });
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }
    if (typeof phone !== 'string' || !/^[+\d()\s.-]{7,25}$/.test(phone.trim())) {
      return res.status(400).json({ message: 'Please enter a valid phone number.' });
    }
    if (typeof feedback !== 'string' || !feedback.trim()) {
      return res.status(400).json({ message: 'Please enter your feedback.' });
    }

    const entry = await Feedback.create({ name, email, phone, feedback });
    return res.status(201).json({ message: 'Thank you — your feedback has been saved.', id: entry.id });
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: 'Please check your entries and try again.' });
    }
    console.error('Could not save feedback:', error.message);
    return res.status(500).json({ message: 'Could not save your feedback. Please try again.' });
  }
});

async function start() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is missing. Copy .env.example to .env and set your MongoDB connection string.');
    process.exit(1);
  }
  app.listen(port, () => console.log(`Portfolio app running at http://localhost:${port}`));
  mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => console.log('Connected to MongoDB.'))
    .catch(error => console.error('Could not connect to MongoDB:', error.message));
}

start();
