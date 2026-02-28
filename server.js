const express = require('express');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/userroutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', userRoutes);

// Test Route
app.get('/', (req, res) => {
  res.send('Supabase Backend API Running 🚀');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});