import { Router } from "express";
import { pool } from "../db";

const router = Router();

router.post("/register", async (req, res) => {
  const { deviceId, expoPushToken } = req.body;

  if (!deviceId) {
    return res.status(400).json({ error: "Missing deviceId" });
  }

  const result = await pool.query(
    `
    INSERT INTO users (device_id, expo_push_token)
    VALUES ($1, $2)
    ON CONFLICT (device_id)
    DO UPDATE SET
      expo_push_token = COALESCE(EXCLUDED.expo_push_token, users.expo_push_token)
    RETURNING id
    `,
    [deviceId, expoPushToken ?? null]
  );

  res.json({ userId: result.rows[0].id });
});


export default router;
