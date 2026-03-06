const express = require('express');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/userroutes');
const authRoutes = require('./routes/authRoutes');
const roleRoutes = require('./routes/roleRoutes');
const performerRoutes = require('./routes/performerRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/performer', performerRoutes);


// Test Route
app.get('/', (req, res) => {
  res.send('Supabase Backend API Running 🚀');
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});