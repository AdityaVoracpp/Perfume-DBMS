const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { generateToken } = require('../middleware/auth');

const SALT_ROUNDS = 10;

async function register({ username, email, password, age, gender }) {
  // Validate
  if (!username || !email || !password) {
    const err = new Error('username, email, and password are required');
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const [result] = await pool.execute(
    'INSERT INTO `User` (username, email, password_hash, age, gender) VALUES (?, ?, ?, ?, ?)',
    [username, email, passwordHash, age || null, gender || null]
  );

  const user = { user_id: result.insertId, username, email };
  const token = generateToken(user);
  return { user, token };
}

async function login({ email, password }) {
  if (!email || !password) {
    const err = new Error('email and password are required');
    err.status = 400;
    throw err;
  }

  const [rows] = await pool.execute(
    'SELECT user_id, username, email, password_hash, age, gender, created_at FROM `User` WHERE email = ?',
    [email]
  );

  if (rows.length === 0) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const token = generateToken(user);
  const { password_hash, ...safeUser } = user;
  return { user: safeUser, token };
}

async function getProfile(userId) {
  const [rows] = await pool.execute(
    'SELECT user_id, username, email, age, gender, created_at FROM `User` WHERE user_id = ?',
    [userId]
  );
  return rows[0] || null;
}

module.exports = { register, login, getProfile };
