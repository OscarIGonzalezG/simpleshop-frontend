# 🛍️ SimpleShop - Frontend (SaaS Multi-Tenant)

Frontend moderno y escalable para la plataforma **SimpleShop**, un SaaS diseñado para la **gestión de inventario** y **tiendas online**.  
Construido con **Angular 18+ (Standalone)** y estilizado con **Tailwind CSS v4**, siguiendo una identidad visual **"Noir Industrial"**.

---

## 🚀 Características Principales

### 🎨 UI/UX & Diseño
- **Tema Personalizado:** Estética *Noir Industrial* (fondos oscuros, acentos ámbar/dorado, glassmorphism).
- **Diseño Responsivo:** Totalmente adaptable a móviles, tablets y escritorio.
- **Landing Page:** Optimizada para conversión con animaciones CSS nativas.

---

### 🔐 Autenticación & Seguridad
- **Multi-Tenant Real:** Registro automático de tiendas con creación de *slug* único  
  (ej: `simpleshop.com/store/mi-tienda`).
- **Roles y Permisos:** Redirección automática según tipo de usuario (`OWNER`, `SUPER_ADMIN`).
- **Interceptors:** Inserción automática del Token JWT en cada petición HTTP.
- **Guards:** Protección de rutas privadas a nivel de módulo y vista.

---

### 👑 Módulo “Platform” (Super Admin)
- **Panel Global:** Métricas de ingresos, usuarios y tiendas activas.
- **Gestión de Tenants:** Listado completo con funcionalidad de **Kill Switch** (baneo/desactivación remota).
- **Protección de Integridad:** Bloqueo de auto-desactivación del tenant principal.

---

### 📦 Módulo “Admin” (Tenants)
- **Dashboard:** Resumen de estadísticas internas de cada tienda.
- **Inventario:** (En desarrollo) Gestión de productos y control de stock.
- **Layout Dedicado:** Menú lateral con estética ámbar e identidad del usuario.

---

## 🛠️ Stack Tecnológico

- **Framework:** Angular 18+  
- **Arquitectura:** Standalone Components (sin NgModules)  
- **Estado:** Angular Signals (`signal()`, `computed()`)  
- **Control de Flujo:** Nueva sintaxis (`@if`, `@for`)  
- **Estilos:** Tailwind CSS v4  
- **Variables:** CSS nativas (`--color-brand-primary`)  
- **Utilidades Tailwind:** `bg-linear-to-r`, opacidades simplificadas (`bg-black/50`)  
- **Lenguaje:** TypeScript 5.x  

---

## 📂 Estructura del Proyecto (Clean Architecture)

```bash
src/app/
├── core/               # Lógica de negocio (Singleton)
│   ├── interceptors/   # AuthInterceptor (Tokens)
│   ├── models/         # Interfaces (User, Tenant, Auth, Platform)
│   └── services/       # API Services (AuthService, PlatformService)
├── features/           # Módulos funcionales
│   ├── auth/           # Login, Register
│   ├── admin/          # Dashboard, Products
│   ├── platform/       # Super Admin Panel
│   └── landing/        # Landing pública
├── layout/             # Estructuras visuales
│   ├── admin-layout/   # Layout Ámbar
│   └── platform-layout/# Layout Dorado/Negro
└── shared/             # Componentes UI reutilizables
```

---

## ⚙️ Instalación y Configuración

### 1. Prerrequisitos
- Node.js v18+  
- Angular CLI  
```bash
npm install -g @angular/cli
```

### 2. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/simpleshop-frontend.git
cd simpleshop-frontend
```

### 3. Instalar dependencias
```bash
npm install
```

### 4. Configurar variables de entorno
Editar `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

---

## ▶️ Ejecución

### Servidor de Desarrollo
```bash
ng serve
```
Accede en:  
**http://localhost:4200/**

### Build de Producción
```bash
ng build
```

---

## 🧪 Credenciales de Prueba (Dev Mode)

Si usas la base de datos local con *seeders* cargados:

| Rol            | Email               | Password | Panel |
|----------------|---------------------|----------|--------|
| Super Admin    | admin@admin.cl      | 123456   | `/platform` (Layout Dorado) |
| Tenant Owner   | tienda1@tienda.cl   | 123456   | `/admin` (Layout Ámbar) |

---

## 📝 Notas para Desarrolladores

- **Tailwind v4:** Si VS Code muestra advertencias, actualiza la extensión *Tailwind IntelliSense*.  
- **Kill Switch:** Al desactivar un tenant, el acceso del usuario se bloquea inmediatamente (retorna 401).  

---

© 2025 **SimpleShop SaaS** — Frontend Multi-Tenant
