import express from 'express';
import pool from '../db.js'; 

const router = express.Router();

router.post('/create-user', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }
    
    // Generate timestamp-based ID
    const user_id = Date.now();
    
    // SQL INSERT
    const sql = `
      INSERT INTO users (
        user_id,
        username,
        password
      ) VALUES (?, ?, ?)
    `;
    
    const [result] = await pool.query(sql, [
      user_id,
      username,
      password // In production, hash this with bcrypt!
    ]);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user_id: user_id,
      username: username
    });
    
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle duplicate username
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Username already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
});

export default router;