const jwt = require('jsonwebtoken');

// Ganti dengan password rahasia Anda (bebas, panjang lebih baik)
const JWT_SECRET = 'gampang-toko-rahasia-2026-super-aman';

// Username & Password Admin (nanti bisa diubah)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'gampangtoko123'; // Ganti dengan password Anda!

// Middleware untuk proteksi route
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token tidak ada' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Token tidak valid' });
  }
}

// Endpoint Login
function login(req, res) {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign(
      { username: ADMIN_USERNAME, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' } // Token berlaku 24 jam
    );
    return res.json({ success: true, token });
  } else {
    return res.status(401).json({ success: false, message: 'Username atau password salah' });
  }
}

module.exports = { authenticate, login, JWT_SECRET };