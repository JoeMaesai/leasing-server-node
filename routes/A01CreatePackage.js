// routes/things.router.js
import { Router } from "express";
import pool from "../db.js";

const router = Router();

/**
 * POST /things
 * Expects JSON body, e.g. { "name": "motor", "qty": 10 }
 */

router.post("/", async (req, res, next) => {
    const { packageName, totalAmount, installmentMonth, installmentPrice } = req.body ?? {};
    try {
        const [result] = await pool.query(
            "INSERT INTO package_payment (package_name, total_amont, installment_month,installment_price ) VALUES (?, ?, ?, ?)",
            [packageName, totalAmount, installmentMonth, installmentPrice]
        );
        return res.json({ staus: "OKAY" });
    } catch (err) {
        next(err);
    }
});

export default router;
