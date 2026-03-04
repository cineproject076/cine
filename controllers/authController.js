const supabase = require('../config/supabaseClient');


// REGISTER USER
exports.registerUser = async (req, res) => {
  try {

    const { email, password, name, role_id } = req.body;

    // Basic validation
    if (!email || !password || !name) {
      return res.status(400).json({
        error: "Name, email and password are required"
      });
    }

    // 1️⃣ Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) throw error;

    const user = data.user;

    if (!user) {
      return res.status(400).json({
        error: "User creation failed"
      });
    }

    const userId = user.id;

    // 2️⃣ Insert into users table
    const { error: userInsertError } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          name,
          email
        }
      ]);

    if (userInsertError) throw userInsertError;


    // 3️⃣ Assign role (if selected)
    if (role_id) {

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([
          {
            user_id: userId,
            role_id: role_id
          }
        ]);

      if (roleError) throw roleError;
    }

    res.status(201).json({
      message: "User registered successfully",
      user
    });

  } catch (err) {

    console.error("Register Error:", err.message);

    res.status(400).json({
      error: err.message
    });
  }
};



// LOGIN USER
exports.loginUser = async (req, res) => {
  try {

    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

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

    console.error("Login Error:", err.message);

    res.status(400).json({
      error: err.message
    });
  }
};