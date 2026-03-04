const supabase = require('../config/supabaseClient');

const authMiddleware = async (req, res, next) => {

  try {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "Authorization header missing"
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "Token missing"
      });
    }

    // Verify token using Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      return res.status(401).json({
        error: "Invalid or expired token"
      });
    }

    // Attach user to request
    req.user = data.user;

    next();

  } catch (err) {

    return res.status(500).json({
      error: "Authentication failed"
    });

  }

};

module.exports = authMiddleware;