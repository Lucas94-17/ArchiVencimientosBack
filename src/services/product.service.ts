import { IntegerType } from "typeorm";
import { pool } from "../db";

/**
 * Desactiva un producto específico (dar de baja)
 * Marca al producto como inactivo en lugar de eliminarlo físicamente
 */
export async function darDeBajaProducto(id: number, userId: number): Promise<{ 
  success: boolean; 
  message: string 
}> {
  try {
    // ✅ Validamos que el producto pertenezca al usuario dueño
    const result = await pool.query(
      `UPDATE products SET is_deleted = true WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return { success: false, message: "Producto no encontrado o no pertenece al usuario" };
    }

    return { success: true, message: "Producto dado de baja exitosamente" };
  } catch (error) {
    console.error("Error dando de baja producto:", error);
    return { success: false, message: "Error al procesar la solicitud" };
  }
}

export async function agregarNuevoProducto( userId : number , name : string ,quantity : number , expiry_date: string , notify_at : string) {
   const respuesta  = await pool.query(
      `INSERT INTO products (user_id, name, quantity, expiry_date, notify_at) VALUES ($1, $2, $3, $4::date, ($5::timestamptz AT TIME ZONE 'America/Argentina/Buenos_Aires'))`,
      [userId, name, quantity, expiry_date, notify_at],
    );

    return respuesta;
}  

export async function getProductos(userId:number) {
  const res = await pool.query(
      `SELECT id, user_id, name, quantity, to_char(expiry_date, 'YYYY-MM-DD') AS expiry_date, to_char(notify_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS notify_at, notified_at FROM products WHERE user_id = $1 ORDER BY notify_at`,
      [userId],
    );

    return res;
}

export async function putProducto(name : string , quantity:number , expiry_date : string , notify_at: string , id :string , userId : number ) {
   await pool.query(
      `UPDATE products SET name = $1, quantity = $2, expiry_date = $3::date, notify_at = ($4::timestamptz AT TIME ZONE 'America/Argentina/Buenos_Aires') WHERE id = $5 AND user_id = $6`,
      [name, quantity, expiry_date, notify_at, id, userId],
    );
}

export async function deleteProducto(id :string , userId : number) {
  const res = await pool.query(`DELETE FROM products WHERE id = $1 AND user_id = $2`, [id, userId]);

  return res;
}

export async function ajustarProducto(delta:number , id:string , userId:number) {
    await pool.query(
      `UPDATE products SET quantity = GREATEST(quantity + $1, 0) WHERE id = $2 AND user_id = $3`,
      [delta, id, userId],
    );
}

export async function getProducto(id:string , userId:number) {
  const result = await pool.query(
      `SELECT id, name, quantity, to_char(expiry_date, 'YYYY-MM-DD') AS expiry_date, to_char(notify_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS notify_at FROM products WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    return result;
}

export async function getBajaLogica(userId:number,shouldIncludeDeleted:boolean) {
  let query;
  let params: any[];
    if (shouldIncludeDeleted) {
      // TRAER TODOS los productos desactivados
      query = `SELECT id, user_id, name, quantity, expiry_date, notify_at, notified_at, is_deleted 
                FROM products 
                WHERE user_id = $1 AND is_deleted = true
                ORDER BY notify_at`;
      params = [userId];
    } else {
      // SOLO productos activos (is_deleted = false) - por defecto
      query = `SELECT id, user_id, name, quantity, expiry_date, notify_at, notified_at 
                FROM products 
                WHERE user_id = $1 AND is_deleted = false 
                ORDER BY notify_at`;
      params = [userId];
    }

    const result = await pool.query(query, params);
    // console.log(result)
    return result;
}