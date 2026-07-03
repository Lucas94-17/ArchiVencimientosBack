import swaggerJsDoc from 'swagger-jsdoc';

// Configuración limpia y robusta para evitar errores de parsing YAML
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'ArchiVencimientos API',
      description: 'API para gestión de vencimientos y notificaciones.',
      contact: {
        name: 'Soporte ArchiVencimientos',
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
      },
    },
  },
  // Filtramos para que solo lea los archivos especificados abajo (evita leer configs vacías)
  filter: true, 
  
  // Aquí le decimos EXACTAMENTE qué archivos leer para documentar.
  // Asegúrate de que ./src/routes/*.ts exista y tenga los comentarios JSDoc.
  apis: ['./src/routes/*.ts'], 
};

// Generamos el spec directamente sin bloques try/catch innecesarios (más limpio)
const swaggerSpec = swaggerJsDoc(options);

// Exportamos la variable 'swaggerSpec' exactamente como se llama en index.ts
export { swaggerSpec };
