const supabase = require('../config/supabaseClient');

// GET ALL USERS
exports.getUsers = async (req, res) => {
  try {

    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) throw error;

    res.json(data);

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};