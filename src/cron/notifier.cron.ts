import cron from "node-cron";
import { pool } from "../db";
import { Expo } from "expo-server-sdk";

const expo = new Expo();

export function startNotifierCron() {
  // corre cada minuto — notificaciones push
  cron.schedule("* * * * *", async () => {
    const now = new Date();

    try {
      const result = await pool.query(
        `
        SELECT
          p.id,
          p.name,
          u.expo_push_token
        FROM products p
        JOIN users u ON u.id = p.user_id
        WHERE p.notify_at <= $1
          AND p.notified_at IS NULL
          AND u.expo_push_token IS NOT NULL
        `,
        [now],
      );

      for (const row of result.rows) {
        const token = row.expo_push_token;

        if (!Expo.isExpoPushToken(token)) continue;

        await expo.sendPushNotificationsAsync([
          {
            to: token,
            sound: "default",
            title: "Vencimiento",
            body: `${row.name} está por vencer`,
          },
        ]);

        await pool.query(
          `
          UPDATE products
          SET notified_at = NOW()
          WHERE id = $1
          `,
          [row.id],
        );
      }
    } catch (err) {
      console.error("❌ Error en notifier cron:", err);
    }
  });

  // corre todos los días a las 00:05 — baja lógica automática de vencidos
  cron.schedule(
    "0 7 * * *",
    async () => {
      console.log("🕐 Ejecutando job de baja lógica automática...");
      await darDeBajaProductosVencidos();
    },
    {
      timezone: "America/Argentina/Buenos_Aires",
    },
  );

  // se ejecuta también una vez al arrancar el server,
  // por si estuvo caído justo cuando debía correr a las 00:05
  darDeBajaProductosVencidos();
}

async function darDeBajaProductosVencidos() {
  try {
    const result = await pool.query(
      `UPDATE products 
       SET is_deleted = true 
       WHERE expiry_date < CURRENT_DATE AND is_deleted = false`,
    );

    if (result.rowCount && result.rowCount > 0) {
      console.log(
        `✅ ${result.rowCount} producto(s) dado(s) de baja automáticamente por vencimiento`,
      );
    }
  } catch (error) {
    console.error("❌ Error dando de baja productos vencidos:", error);
  }
}
