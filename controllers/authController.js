const supabase = require('../config/supabaseClient');

// REGISTER USER
exports.registerUser = async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      role_id,
      dob,
      gender,
      mobile_primary,
      mobile_alternate,
      location, // Should be { country, state, district, city_town_village, pincode }
      terms_accepted,
      data_accuracy_confirmed
    } = req.body;

    // 1️⃣ Mandatory Field Validation
    if (!name || !dob || !gender || !mobile_primary || !role_id || !terms_accepted || !data_accuracy_confirmed) {
      return res.status(400).json({
        error: "All mandatory fields must be provided, including legal consents."
      });
    }

    // Validation for Location hierarchy
    if (!location || !location.state || !location.district || !location.city_town_village) {
      return res.status(400).json({
        error: "State, District, and City/Town/Village are mandatory in location."
      });
    }

    // 2️⃣ Create user in Supabase Auth
    // Use phone as the primary identifier if possible, otherwise email.
    // If email is provided, use it. If not, Supabase requires one or we configure Phone-only login.
    // For now, let's assume email is still used for auth login but phone is stored for identifier.
    const { data, error } = await supabase.auth.signUp({
      email: email, // Optional but recommended
      password: password,
      options: {
        data: {
          full_name: name,
          phone: mobile_primary
        }
      }
    });

    if (error) throw error;
    const user = data.user;

    if (!user) {
      return res.status(400).json({ error: "User creation failed" });
    }

    const userId = user.id;

    // 3️⃣ Insert detailed profile into 'users' table
    const { error: userInsertError } = await supabase
      .from('users')
      .insert([{
        id: userId,
        full_name: name,
        email: email,
        dob: dob,
        gender: gender,
        mobile_primary: mobile_primary,
        mobile_alternate: mobile_alternate || null,
        country: location.country || 'India',
        state: location.state,
        district: location.district,
        city_town_village: location.city_town_village,
        pincode: location.pincode || null,
        terms_accepted: terms_accepted,
        data_accuracy_confirmed: data_accuracy_confirmed
      }]);

    if (userInsertError) throw userInsertError;

    // 4️⃣ Assign the selected role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert([{ user_id: userId, role_id: role_id }]);

    if (roleError) throw roleError;

    res.status(201).json({
      message: "User registered successfully (Level 1 Complete)",
      user: {
        id: userId,
        name: name,
        status: "Registered & Profile Created"
      }
    });

  } catch (err) {
    console.error("Register Error:", err.message);
    res.status(400).json({ error: err.message });
  }
};

// LOGIN USER (Now returns the user's role and basic profile)
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

    // 2️⃣ Fetch user profile and role
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('full_name, mobile_primary, is_mobile_verified')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.warn("Profile not found for user:", profileError.message);
    }

    let roleName = "No role assigned";
    const { data: userRoleData } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (userRoleData && userRoleData.role_id) {
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
        name: profile ? profile.full_name : null,
        role: roleName,
        is_verified: profile ? profile.is_mobile_verified : false
      }
    });

  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(400).json({ error: err.message });
  }
};

// 1. GENERATE & SEND OTP (Mock)
exports.sendOTP = async (req, res) => {
  try {
    const { mobile_number } = req.body;
    if (!mobile_number) return res.status(400).json({ error: "Mobile number required" });

    // Generate 6-digit code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in DB
    const { error } = await supabase
      .from('otp_verifications')
      .insert([{ mobile_number, otp_code: otp }]);

    if (error) throw error;

    // MOCK LOGGING: In a real app, this goes via SMS API
    console.log(`\n-----------------------------------`);
    console.log(`[MOCK SMS] To: ${mobile_number}`);
    console.log(`[MOCK SMS] Your Cine OTP is: ${otp}`);
    console.log(`-----------------------------------\n`);

    res.json({ message: "OTP sent to your terminal log!" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 2. VERIFY OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { mobile_number, otp_code } = req.body;

    const { data: verification, error } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('mobile_number', mobile_number)
      .eq('otp_code', otp_code)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !verification) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Mark user as verified
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_mobile_verified: true })
      .eq('mobile_primary', mobile_number);

    if (updateError) throw updateError;

    // Clean up used OTP
    await supabase.from('otp_verifications').delete().eq('id', verification.id);

    res.json({ message: "Mobile number verified successfully!" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};