import { Router } from "express";
import { pool } from "../db";
import { getOrCreateUserByDeviceId } from "../services/user.service";
const router = Router();
router.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

router.post("/", async (req, res) => {
  const { deviceId, name, quantity, expiry_date, notify_at } = req.body;

  if (!deviceId) {
    return res.status(400).json({ error: "deviceId requerido" });
  }

  const userId = await getOrCreateUserByDeviceId(deviceId);

  await pool.query(
    `INSERT INTO products
   (user_id, name, quantity, expiry_date, notify_at)
   VALUES ($1, $2, $3, $4::date, ($5::timestamptz AT TIME ZONE 'America/Argentina/Buenos_Aires'))`,
    [userId, name, quantity, expiry_date, notify_at],
  );

  res.status(201).json({ ok: true });
});

router.get("/", async (req, res) => {
  const { deviceId } = req.query;

  if (!deviceId) {
    return res.status(400).json({ error: "deviceId requerido" });
  }

  const userId = await getOrCreateUserByDeviceId(deviceId as string);

  const result = await pool.query(
    `SELECT
     id, user_id, name, quantity,
     to_char(expiry_date, 'YYYY-MM-DD') AS expiry_date,
     to_char(notify_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS notify_at,
     notified_at
   FROM products
   WHERE user_id = $1
   ORDER BY notify_at`,
    [userId],
  );

  res.json(result.rows);
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { deviceId, name, quantity, expiry_date, notify_at } = req.body;

  if (!deviceId) {
    return res.status(400).json({ error: "deviceId requerido" });
  }

  const userId = await getOrCreateUserByDeviceId(deviceId);

  await pool.query(
    `UPDATE products
   SET name = $1,
       quantity = $2,
       expiry_date = $3::date,
       notify_at = ($4::timestamptz AT TIME ZONE 'America/Argentina/Buenos_Aires')
   WHERE id = $5 AND user_id = $6`,
    [name, quantity, expiry_date, notify_at, id, userId],
  );

  res.status(200).json({ ok: true });
});
// DELETE /products/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { deviceId } = req.body;

  if (!deviceId) {
    return res.status(400).json({ error: "deviceId requerido" });
  }

  const userId = await getOrCreateUserByDeviceId(deviceId);

  await pool.query(`DELETE FROM products WHERE id = $1 AND user_id = $2`, [
    id,
    userId,
  ]);

  res.status(200).json({ ok: true });
});

// PATCH /products/:id/quantity
router.patch("/:id/quantity", async (req, res) => {
  const { id } = req.params;
  const { deviceId, delta } = req.body;

  if (!deviceId || typeof delta !== "number") {
    return res.status(400).json({ error: "deviceId y delta requeridos" });
  }

  const userId = await getOrCreateUserByDeviceId(deviceId);

  await pool.query(
    `
    UPDATE products
    SET quantity = GREATEST(quantity + $1, 0)
    WHERE id = $2 AND user_id = $3
    `,
    [delta, id, userId],
  );

  res.status(200).json({ ok: true });
});
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { deviceId } = req.query;

  if (!deviceId) {
    return res.status(400).json({ error: "deviceId requerido" });
  }

  const userId = await getOrCreateUserByDeviceId(deviceId as string);

  const result = await pool.query(
    `SELECT
     id, name, quantity,
     to_char(expiry_date, 'YYYY-MM-DD') AS expiry_date,
     to_char(notify_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS notify_at
   FROM products
   WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }

  res.json(result.rows[0]);
});

export default router;
