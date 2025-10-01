// routes/things.router.js
import { Router } from "express";
import pool from "../db.js";

const router = Router();

/**
 * POST /things
 * Expects JSON body, e.g. { "name": "motor", "qty": 10 }
 */
function generatePackagePaymentId() {
  // Use only the last 9 digits of timestamp (fits in integer)
  return parseInt(Date.now().toString().slice(-9));
}
router.post("/", async (req, res, next) => {

    try {
        const { package_name, total_amont, installment_month, installment_price } = req.body;

        // Generate timestamp-based ID
        const package_payment_id = generatePackagePaymentId();

        // SQL INSERT with exact column count matching values
        const sql = `
      INSERT INTO package_payment (
        package_payment_id,
        package_name,
        total_amount,
        installment_month,
        installment_price
      ) VALUES (?, ?, ?, ?, ?)
    `;


        const [result] = await pool.query(sql, [
            package_payment_id,
            package_name,
            total_amont,
            installment_month,
            installment_price
        ]);
        res.status(201).json({
            success: true,
            message: 'Package created successfully',
            package_payment_id: package_payment_id,
            data: result
        });
    } catch (err) {
        next(err);
    }
});

export default router;
