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

  entities: [User, Product],

  // ✅ esto es lo que “crea tablas automáticamente”
  // ÚSALO SOLO EN DEV
  synchronize: false,

  // logs para entender qué hace
  logging: false,
  ssl: { rejectUnauthorized: false },
});
