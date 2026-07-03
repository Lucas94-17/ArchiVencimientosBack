import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../src/entities.ts/user.entity";
import { Product } from "./entities.ts/product.entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // ssl: { rejectUnauthorized: false },
  entities: [User, Product],
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  // ✅ En DEV: sincroniza automáticamente desde los entities
  // En producción usaría migraciones con el plugin 'migrations'
  synchronize: false,

  // logs para entender qué hace (útil en DEV)
  logging: false,
});

