import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import usersRoutes from "../src/routes/users.routes";
import productsRoutes from "../src/routes/products.routes";
import { startNotifierCron } from "./cron/notifier.cron";
import { AppDataSource } from "./data-soruce";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/users", usersRoutes);
app.use("/products", productsRoutes);

app.get("/health", (_, res) => res.send("OK"));
app.disable("etag");

startNotifierCron();

async function basededatos() {
  await AppDataSource.initialize();
  console.log("✅ DB conectada y entities sincronizadas");

  const PORT = process.env.PORT || 3000;
app.listen(3000,'0.0.0.0', () =>
  console.log("🚀 Backend corriendo en", PORT)
);
}
basededatos().catch((err) => {
  console.error("❌ Error bootstrap:", err);
  process.exit(1);
});