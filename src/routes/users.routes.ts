import { Router } from "express";
import { pool } from "../db"; // Asegúrate que este path sea correcto según tu estructura (ej. '../db' o './db')
import { getOrCreateUserByDeviceId } from "../services/user.service"; // Opcional si usas ese servicio, si no, lo quitamos y consultamos directo a DB

const router = Router();

/**
 * Middleware de Caché opcional
 */
router.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Registrar un usuario (o actualiza token Expo si ya existe)
 *     description: Registra un usuario con su deviceId y token de notificaciones. Si el deviceId ya existe, actualiza el token.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceId:
 *                 type: string
 *               expoPushToken:
 *                 type: string
 */
router.post("/register", async (req, res) => {
  const { deviceId, expoPushToken } = req.body;

  if (!deviceId) {
    return res.status(400).json({ error: "Missing deviceId" });
  }

  // Ejecuta el INSERT con ON CONFLICT DO UPDATE como ya lo tenías
  try {
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
  } catch (error) {
    console.error("Error registrando usuario:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtener lista de todos los usuarios registrados
 *     description: Muestra la lista de usuarios únicos asociados a un deviceId (útil para ver historial si cambias dispositivo).
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         required: false
 *         schema:
 *           type: string
 *         description: Si se proporciona, filtra por ese deviceId específico.
 */
router.get("/", async (req, res) => {
  // Puedes adaptar esto para leer de tu DB real o usar el service si lo deseas
  // Aquí un ejemplo genérico que deberás conectar a tu consulta real
  const { deviceId } = req.query;
  
  try {
    // Consulta SQL genérica para listar usuarios (ajustar WHERE según necesidad)
    const query = deviceId 
      ? `SELECT * FROM users WHERE device_id = $1` 
      : `SELECT * FROM users`;
    
    const result = await pool.query(query, deviceId ? [deviceId] : []);

    res.json(result.rows);
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Obtener detalle de un usuario por su ID
 *     description: Devuelve la información completa del usuario con ese ID.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único del usuario.
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error obteniendo usuario:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Eliminar un usuario por su ID
 *     description: Borra al usuario del sistema.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    res.status(204).send(); // Envía respuesta vacía para borrado exitoso
  } catch (error) {
    console.error("Error eliminando usuario:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
