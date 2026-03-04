const supabase = require('../config/supabaseClient');

// REGISTER USER
exports.registerUser = async (req, res) => {
  try {
    const { email, password, name, role_id } = req.body;

    // 1️⃣ Validation: All details are mandatory
    if (!email || !password || !name || !role_id) {
      return res.status(400).json({
        error: "All fields are required: Name, email, password, and role_id"
      });
    }

    // 2️⃣ Create user in Supabase Auth
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

    // 3️⃣ Insert profile into 'users' table
    const { error: userInsertError } = await supabase
      .from('users')
      .insert([{ id: userId, name, email }]);

    if (userInsertError) throw userInsertError;

    // 4️⃣ Assign the selected role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert([{ user_id: userId, role_id: role_id }]);

    if (roleError) throw roleError;

    res.status(201).json({
      message: "User registered successfully with selected role",
      user: { id: userId, name, email, role_id }
    });

  } catch (err) {
    console.error("Register Error:", err.message);
    res.status(400).json({ error: err.message });
  }
};

// LOGIN USER (Now returns the user's role)
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // 1️⃣ Auth with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // 2️⃣ Fetch the user's role (Bulletproof 2-step method)
    let roleName = "No role assigned";

    // Step A: Get the role_id for this user
    const { data: userRoleData } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (userRoleData && userRoleData.role_id) {
      // Step B: Get the name for that role_id
      const { data: roleInfo } = await supabase
        .from('roles')
        .select('role_name')
        .eq('id', userRoleData.role_id)
        .maybeSingle();

      if (roleInfo) {
        roleName = roleInfo.role_name;
      }
    }

    // 3️⃣ Send back combined data
    res.json({
      message: "Login successful",
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: roleName
      }
    });



  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(400).json({ error: err.message });
  }
};