import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET all packages for dropdown
router.get('/packages', async (req, res) => {
  try {
    const sql = `
      SELECT 
        package_payment_id,
        package_name,
        total_amount,
        installment_month,
        installment_price
      FROM package_payment
      ORDER BY package_name
    `;
    
    const [packages] = await pool.query(sql);
    
    res.json({
      success: true,
      data: packages
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching packages',
      error: error.message
    });
  }
});

// POST create new customer
router.post('/create-customer', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      first_name,
      last_name,
      tel,
      brand,
      plate,
      email,
      package_payment_id
    } = req.body;
    
    // Validation
    if (!first_name || !last_name || !tel || !package_payment_id) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: first_name, last_name, tel, package_payment_id'
      });
    }
    
    // Get package details
    const [packageData] = await connection.query(
      'SELECT total_amount, installment_month, installment_price FROM package_payment WHERE package_payment_id = ?',
      [package_payment_id]
    );
    
    if (packageData.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }
    
    const packageInfo = packageData[0];
    const customer_id = Date.now();
    const creating_date = new Date();
    const total_amount = packageInfo.total_amount;
    const balance = total_amount;
    const status = 'active';
    
    // Calculate first due date (30 days from now)
    const next_due = new Date();
    next_due.setDate(next_due.getDate() + 30);
    
    // Insert customer
    const customerSql = `
      INSERT INTO customer (
        customer_id,
        first_name,
        last_name,
        tel,
        brand,
        plate,
        email,
        package_payment_id,
        creating_date,
        total_amount,
        balance,
        status,
        next_due
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await connection.query(customerSql, [
      customer_id,
      first_name,
      last_name,
      tel,
      brand || null,
      plate || null,
      email || null,
      package_payment_id,
      creating_date,
      total_amount,
      balance,
      status,
      next_due
    ]);
    
    // Create package details (installment schedule)
    const installment_month = packageInfo.installment_month;
    const installment_price = packageInfo.installment_price;
    
    for (let i = 1; i <= installment_month; i++) {
      const package_detail_id = Date.now() + i;
      const due_date = new Date(creating_date);
      due_date.setDate(due_date.getDate() + (30 * i));
      
      const remaining_balance = balance - (installment_price * (i - 1));
      
      const detailSql = `
        INSERT INTO package_detail (
          package_detail_id,
          customer_id,
          installment,
          due_date,
          amount,
          balance,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      await connection.query(detailSql, [
        package_detail_id,
        customer_id,
        i,
        due_date,
        installment_price,
        remaining_balance,
        'pending'
      ]);
      
      // Small delay to ensure unique IDs
      await new Promise(resolve => setTimeout(resolve, 2));
    }
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer_id: customer_id,
      data: {
        customer_id,
        first_name,
        last_name,
        total_amount,
        installments: installment_month
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error creating customer:', error);
    
    // Handle duplicate phone number
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Customer with this phone number already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating customer',
      error: error.message
    });
  } finally {
    connection.release();
  }
});

export default router;