const bcrypt = require('bcryptjs');
const pool = require('./db');

async function fixPasswords() {
  try {
    const [users] = await pool.execute('SELECT * FROM Users');
    for (const user of users) {
      if (!user.password_hash.startsWith('$2a$')) { // not hashed
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(user.password_hash, salt);
        await pool.execute('UPDATE Users SET password_hash = ? WHERE user_id = ?', [hashed, user.user_id]);
        console.log(`Updated password for user: ${user.username}`);
      }
    }
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

fixPasswords();
