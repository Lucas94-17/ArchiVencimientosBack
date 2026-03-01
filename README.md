# ArchiVencimientosBack

Backend REST API para **ArchiVencimientos**, aplicación destinada a la
gestión de productos con fecha de vencimiento y notificaciones
programadas.

------------------------------------------------------------------------

## 🚀 Descripción

ArchiVencimientosBack es el servidor que gestiona:

-   Creación de productos
-   Edición de productos
-   Eliminación de productos
-   Actualización de cantidades
-   Gestión de fechas de vencimiento
-   Programación de notificaciones
-   Identificación de usuarios mediante deviceId

------------------------------------------------------------------------

## 📋 Requisitos

-   Node.js (LTS recomendado)
-   PostgreSQL
-   npm

Verificar instalación:

``` bash
node -v
npm -v
psql --version
```

------------------------------------------------------------------------

## ⚙️ Instalación

Clonar repositorio:

``` bash
git clone <URL_DEL_REPOSITORIO>
cd ArchiVencimientosBack
```

Instalar dependencias:

``` bash
npm install
```

------------------------------------------------------------------------

## 🔧 Configuración

Crear archivo `.env`:

``` env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=tu_password
DB_NAME=archivencimientos

TZ=America/Argentina/Buenos_Aires
```

------------------------------------------------------------------------

## 🗄️ Crear Base de Datos

La Base de datos se crea por si sola , en el data-source con synchronize: true , sin embargo ,
si el administrador avisa que hay migraciones , se las corre de las siguiente manera : 

``` bash
npm run migration:run
```

Con eso ya se corren las migraciones.

------------------------------------------------------------------------

## ▶️ Ejecutar Servidor

Modo desarrollo:

``` bash
npm run dev
```

Modo producción:

``` bash
npm run build
npm run start
```

Servidor disponible en:

http://localhost:3000

------------------------------------------------------------------------

## 🛠️ Tecnologías

-   Node.js
-   Express
-   TypeScript
-   PostgreSQL
-   TypeORM

------------------------------------------------------------------------

## 👨‍💻 Autor

Lucas Arteaga

------------------------------------------------------------------------

## 📄 Licencia

MIT
