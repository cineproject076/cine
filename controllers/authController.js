const supabase = require('../config/supabaseClient');

// REGISTER USER
exports.registerUser = async (req, res) => {
  try {

    const { email, password, name, role_id } = req.body;

    // Create Supabase auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) throw error;

    const user = data.user;

    if (!user) {
      return res.status(400).json({ error: "User creation failed" });
    }

    const userId = user.id;

    // Insert user profile
    await supabase.from('users').insert([
      {
        id: userId,
        name,
        email
      }
    ]);

    // Assign role
    if (role_id) {
      await supabase.from('user_roles').insert([
        {
          user_id: userId,
          role_id: role_id
        }
      ]);
    }

    res.json({
      message: "User registered successfully",
      user
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// LOGIN USER
exports.loginUser = async (req, res) => {
  try {

    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    res.json({
      message: "Login successful",
      session: data.session,
      user: data.user
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};