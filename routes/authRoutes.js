const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');

// 🔹 REGISTER USER
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    const user = data.user;

    // Insert into profiles table
    if (user) {
      await supabase.from('profiles').insert([
        {
          id: user.id,
          name,
          email,
        },
      ]);
    }

    res.json({
      message: 'User registered successfully',
      user: data.user,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 🔹 LOGIN USER
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    res.json({
      message: 'Login successful',
      session: data.session,
      user: data.user,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;