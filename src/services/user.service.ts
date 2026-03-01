import { pool } from "../db";

export async function getOrCreateUserByDeviceId(
  deviceId: string,
): Promise<number> {
  const existing = await pool.query(
    "SELECT id FROM users WHERE device_id = $1",
    [deviceId],
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const created = await pool.query(
    "INSERT INTO users (device_id) VALUES ($1) RETURNING id",
    [deviceId],
  );

  return created.rows[0].id;
}
