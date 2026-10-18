module.exports = function requireAdmin(req, res, next) {
  if (!req.session || !req.session.adminId) {
    return res.status(403).json({ error: 'Admin login required' });
  }
  next();
};