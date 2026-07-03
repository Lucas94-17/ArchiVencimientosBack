import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import usersRoutes from "./routes/users.routes"; // Rutas relativas desde index.ts (que está en src/)
import productsRoutes from "./routes/products.routes";
import { startNotifierCron } from "./cron/notifier.cron";
import { AppDataSource } from "./data-source";
// IMPORTAR SWAGGER UI AQUÍ
import swaggerUI from 'swagger-ui-express'; 
// IMPORTAR Y EXPORTAR CORRECTAMENTE
import { swaggerSpec } from "./swaggerSpec"; 

dotenv.config();

const app = express();
app.use(cors({
    origin: "*", // " "* significa permitir cualquier origen (cualquier IP, cualquir URL de tu app)
    credentials: true, // Permite enviar cookies/headers si los necesitas
}));
app.use(express.json());


// Configuración Swagger (ahora sin errores)
app.use('/api-docs', express.static('dist/swagger-ui'));
app.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec)); // Ya no dará error

app.get('/api-docs.json', (_, res) => {
  res.setHeader('Content-type', 'application/json');
  res.send(swaggerSpec as any); 
});

app.use("/users", usersRoutes);
app.use("/products", productsRoutes);

app.get("/health", (_, res) => res.json({ status: "OK" })); // Respuesta de salud JSON más limpia
app.disable("etag");


startNotifierCron();


async function basededatos() {
  try {
    await AppDataSource.initialize();
    console.log("✅ DB conectada y entities sincronizadas");

    const PORT = parseInt(process.env.PORT || "3000", 10); // Convertimos a número explícito
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
    });
  } catch (err: any) {
    console.error("❌ Error bootstrap:", err);
    process.exit(1);
  }
}

basededatos().catch((err: any) => {
  console.error("❌ Error crítico en arranque:", err);
  process.exit(1);
});
