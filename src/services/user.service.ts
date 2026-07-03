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

export async function getUserId(deviceId:string) : Promise<number>{
  const result = await pool.query(
    "SELECT id FROM users WHERE device_id = $1",[deviceId]
  );

  if(result.rows.length === 0){
     throw new Error("AUTH_MISSING_DEVICE: El deviceId no está registrado en el sistema.");
  }
  return result.rows[0].id;
}