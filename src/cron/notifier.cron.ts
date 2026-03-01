import cron from "node-cron";
import { pool } from "../db";
import { Expo } from "expo-server-sdk";

const expo = new Expo();

export function startNotifierCron() {
  // corre cada minuto
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
        [now]
      );

      for (const row of result.rows) {
        const token = row.expo_push_token;

        if (!Expo.isExpoPushToken(token)) continue;

        // 🔔 enviar push
        await expo.sendPushNotificationsAsync([
          {
            to: token,
            sound: "default",
            title: "Vencimiento",
            body: `${row.name} está por vencer`,
          },
        ]);

        // ✅ marcar como notificado (ACÁ estaba tu bug antes)
        await pool.query(
          `
          UPDATE products
          SET notified_at = NOW()
          WHERE id = $1
          `,
          [row.id]
        );
      }
    } catch (err) {
      console.error("❌ Error en notifier cron:", err);
    }
  });
}
