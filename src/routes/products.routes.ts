import { Router } from "express";
import { pool } from "../db";
import { getOrCreateUserByDeviceId, getUserId } from "../services/user.service";
import { agregarNuevoProducto, ajustarProducto, deleteProducto, getBajaLogica, getProducto, getProductos,putProducto } from "../services/product.service";
import { darDeBajaProducto } from "../services/product.service";

const router = Router();

// Middleware para caché
router.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Agregar un nuevo vencimiento (product)
 *     description: Crea una entrada en la base de datos usando el deviceId para autenticar al usuario.
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceId:
 *                 type: string
 *               name:
 *                 type: string
 *                 example: "Leche Entera"
 *               quantity:
 *                 type: integer
 *                 example: 5
 *               expiry_date:
 *                 type: string
 *                 format: date
 *                 description: Fecha de vencimiento (YYYY-MM-DD)
 *               notify_at:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora para la notificación
 *     responses:
 *       201:
 *         description: Producto creado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: deviceId o datos inválidos.
 */
router.post("/", async (req, res) => {
  const { deviceId, name, quantity, expiry_date, notify_at } = req.body;

  if (!deviceId) {
    return res.status(400).json({ error: "deviceId requerido" });
  }

  try {
    const userId = await getOrCreateUserByDeviceId(deviceId);
    await agregarNuevoProducto(userId, name, quantity, expiry_date, notify_at);

    res.status(201).json({ 
      ok: true, 
      message: "Producto creado correctamente" 
    });

  } catch (error) {
    console.error("Error creando producto:", error);

    if ((error as any).code === '23505' || (error as any).message?.includes('duplicate')) {
      return res.status(409).json({ error: "Producto con esos datos ya existe" });
    }

    return res.status(500).json({ error: "Error interno del servidor al crear producto" });
  }
});


/**
 * @swagger
 * /products:
 *   get:
 *     summary: Obtener lista de vencimientos del usuario
 *     description: Muestra todos los Products asociados al deviceId proporcionado.
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de productos obtenida.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 */
router.get("/", async (req, res) => {
  const { deviceId } = req.query;

  if (!deviceId) {
    return res.status(400).json({ error: "deviceId requerido" });
  }

  const userId = await getOrCreateUserByDeviceId(deviceId as string);

  try {
    const result = getProductos(userId)
    res.json((await result).rows);
  } catch (error) {
    console.error("Error obteniendo lista:", error);
    return res.status(500).json({ error: "Error al cargar productos" });
  }
});

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Actualizar información de un vencimiento
 *     description: Modifica nombre, cantidad, fechas de este producto.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceId:
 *                 type: string
 *               name:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               expiry_date:
 *                 type: string
 *               notify_at:
 *                 type: string
 *     responses:
 *       200:
 *         description: Producto actualizado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Datos inválidos.
 */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { deviceId, name, quantity, expiry_date, notify_at } = req.body;

  if (!deviceId) {
    return res.status(400).json({ error: "deviceId requerido" });
  }

  const userId = await getOrCreateUserByDeviceId(deviceId);

  try {
   await putProducto(name,quantity,expiry_date,notify_at,id,userId)

    res.status(200).json({ ok: true, message: "Producto actualizado" });
  } catch (error) {
    console.error("Error actualizando producto:", error);
    return res.status(500).json({ error: "Error al actualizar producto" });
  }
});

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Eliminar un vencimiento
 *     description: Borra un producto específico de la lista.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Producto eliminado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: deviceId no proporcionado o inválido.
 *       404:
 *         description: Producto no encontrado.
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  // CORRECCIÓN SEGURA: Verificamos si el deviceId está en el body O en el header (fallback)
  const deviceIdFromBody = req.body?.deviceId; 
  let deviceId = deviceIdFromBody || req.headers["x-device-id"] as string; 

  if (!deviceId) {
    return res.status(400).json({ error: "deviceId requerido (envía en el body o header 'x-device-id')" });
  }

 
  try {
    const userId = await getUserId(deviceId)

    const result = await deleteProducto(id,userId)
  
    if (result.rowCount === 0) {
       return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.status(200).json({ ok: true, message: "Producto eliminado" });
  } catch (error) {
    console.error("Error borrando producto:", error);
    
    // Manejo específico si el producto no existe o id incorrecto
      if ((error as any).code === '23505' || (error as any).message?.includes('does not exist')) { 
      return res.status(404).json({ error: "Producto no encontrado" });
    }


    return res.status(500).json({ error: "Error al eliminar producto" });
  }
});

/**
 * @swagger
 * /products/{id}/quantity:
 *   patch:
 *     summary: Ajustar la cantidad (Stock)
 *     description: Suma o resta un delta a la cantidad actual. Mantiene mínimo 0.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceId:
 *                 type: string
 *               delta:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cantidad ajustada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Datos inválidos (delta no numérico o deviceId faltante).
 */
router.patch("/:id/quantity", async (req, res) => {
  const { id } = req.params;
  const { deviceId, delta } = req.body;

  if (!deviceId || typeof delta !== "number") {
    return res.status(400).json({ error: "deviceId y delta requeridos" });
  }

  const userId = await getOrCreateUserByDeviceId(deviceId);

  try {
    await ajustarProducto(delta , id , userId)

    res.status(200).json({ ok: true, message: "Cantidad ajustada" });
  } catch (error) {
    console.error("Error ajustando cantidad:", error);
    return res.status(500).json({ error: "Error al ajustar cantidad" });
  }
});

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Obtener detalle de un vencimiento específico
 *     description: Devuelve la información completa de un producto por su ID.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle del producto encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *       404:
 *         description: Producto no encontrado.
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  // En este endpoint específico, el deviceId suele venir en query params según tu lógica anterior
  const { deviceId } = req.query;

  if (!deviceId) {
    return res.status(400).json({ error: "deviceId requerido" });
  }

  const userId = await getOrCreateUserByDeviceId(deviceId as string);

  try {
    const result = await getProducto(id,userId)

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error obteniendo detalle:", error);
    return res.status(500).json({ error: "Error al cargar producto" });
  }
});
/**
 * @swagger
 * /products/detail/low-logic:
 *   get:
 *     summary: Obtener lista de productos (con opción de baja lógica)
 *     description: Devuelve la lista completa de productos del usuario. Incluye o no los productos con baja lógica ('deleted'/'expired').
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID único del dispositivo para autenticación.
 *       - in: query
 *         name: includeDeleted
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Si es 'true', incluye productos en baja lógica (vencidos/archivados). Si no existe o es 'false', solo devuelve activos.
 *     responses:
 *       200:
 *         description: Lista de productos obtenida con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: integer }
 *                   name: { type: string }
 *       400:
 *         description: Falta el parámetro deviceId requerido.
 */

router.get("/detail/low-logic", async (req, res) => {
  
  const deviceId = req.query.deviceId as string; 
  const includeDeletedParam = req.query.includeDeleted === "true"; // CORRECCIÓN: Chequear "true"

  if (!deviceId) {
    return res.status(400).json({ error: "deviceId requerido" });
  }

  try {
    const userId = await getOrCreateUserByDeviceId(deviceId);
    const result = await getBajaLogica(userId, includeDeletedParam);

    console.log("✅ Respuesta recibida:", JSON.stringify(result.rows.slice(0, 2))); // Muestra los primeros 2 para debug

    res.json(result.rows);

  } catch (error) {
    console.error("❌ Error obteniendo lista:", error);
    return res.status(500).json({ error: "Error al cargar productos" });
  }
});

/**
 * @swagger
 * /products/:id/soft-delete:
 *   put:
 *     summary: Dar de baja lógica a un producto (Soft Delete)
 *     description: Marca el producto como eliminado lógicamente (is_deleted = true). 
 *       El producto se mantiene en la base de datos pero no aparece en las listas normales.
 *       Solo visible si se consulta con `?includeDeleted=true`.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único del producto a dar de baja.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceId:
 *                 type: string
 *                 description: Identificador del dispositivo para autenticación del usuario dueño.
 *     responses:
 *       200:
 *         description: Producto dado de baja exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *       404:
 *         description: Producto no encontrado o no pertenece al usuario autenticado.
 */
router.put("/:id/soft-delete", async (req, res) => {
  const { id } = req.params; // ← viene como "string" desde URL
  
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: "ID del producto inválido" });
  }

  const { deviceId } = req.body;

  if (!deviceId) {
    return res.status(400).json({ error: "deviceId requerido en el body" });
  }

  const userId = await getOrCreateUserByDeviceId(deviceId);

  try {
    // ✅ Convertir string a number antes de pasar al servicio
    const result = await darDeBajaProducto(Number(id),userId);

    if (result.success) {
      res.status(200).json({ 
        ok: true, 
        message: result.message,
        is_deleted: true 
      });
    } else {
      return res.status(404).json({ error: result.message || "Producto no encontrado" });
    }

  } catch (error) {
    console.error("Error dando de baja producto:", error);
    return res.status(500).json({ error: "Error al procesar la baja lógica del producto" });
  }
});
export default router;
