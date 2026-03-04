const supabase = require('../config/supabaseClient');

// GET ALL ROLES
exports.getRoles = async (req, res) => {
  try {

    const { data, error } = await supabase
      .from('roles')
      .select('id, role_name')

    if (error) throw error;

    res.json(data);

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};