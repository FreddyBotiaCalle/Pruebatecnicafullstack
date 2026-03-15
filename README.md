# Prueba Técnica – Imix

## Descripción General

Imix requiere un servicio que permita procesar solicitudes, enriquecer información usando IA y exponer resultados vía API.

---

## Tabla de Contenidos

1. [Arquitectura y Restricciones Técnicas](#1-arquitectura-y-restricciones-técnicas)
   - 1.1 [Esquema de capas de la solución](#11-esquema-de-capas-de-la-solución)
   - 1.2 [Recuperación de datos del usuario](#12-recuperación-de-datos-del-usuario)
   - 1.3 [Servicios sin consciencia de seguridad](#13-servicios-sin-consciencia-de-seguridad)
   - 1.4 [Web y Mobile con diferentes experiencias](#14-web-y-mobile-con-diferentes-experiencias)
   - 1.5 [Manejo de sesión del usuario](#15-manejo-de-sesión-del-usuario)
   - 1.6 [Protección de información sensible](#16-protección-de-información-sensible)
   - 1.7 [Integración con Single Sign On (SSO)](#17-integración-con-single-sign-on-sso)
2. [Parte 1 – Diseño](#parte-1--diseño)
3. [Parte 2 – Backend](#parte-2--backend-nodejs--nestjs)
4. [Parte 3 – Frontend](#parte-3--frontend-angular)

---

## 1. Arquitectura y Restricciones Técnicas

### 1.1 Esquema de capas de la solución

La solución se diseña siguiendo una **arquitectura en capas** que permite separar responsabilidades, mejorar la seguridad y facilitar la escalabilidad.

```
┌─────────────────────────────────────┐
│        Capa de Presentación         │  Angular (Web)
│   Formularios · Resultados · Estado │
└────────────────┬────────────────────┘
                 │ HTTP / REST
┌────────────────▼────────────────────┐
│       Capa de API / Controladores   │  NestJS Controllers
│   Auth · Validación · Autorización  │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│      Capa de Aplicación             │  Services
│   Lógica de negocio · Orquestación  │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│       Capa de Infraestructura       │  MongoDB · AI Client
│   Repositorios · Integraciones      │
└─────────────────────────────────────┘
```

#### Descripción de capas

| Capa | Responsabilidad | Componentes clave |
|---|---|---|
| **Presentación** | Interacción con el usuario | Angular, formularios, visualización de resultados |
| **API / Controladores** | Exponer endpoints REST, validar y autorizar | `RequestController`, `AuthGuard` |
| **Aplicación (Servicios)** | Lógica de negocio, orquestación | `RequestService`, `AIProcessingService` |
| **Infraestructura** | Persistencia e integraciones externas | `RequestRepository`, `MongoConnection`, `AIClientMock` |

#### Endpoints expuestos

```
POST   /requests        → Crear una nueva solicitud
GET    /requests/:id    → Consultar una solicitud por ID
```

#### Seguridad en la arquitectura

La arquitectura protege la información privada mediante:

- **Separación** entre autenticación y lógica de negocio
- **Tokens JWT** para identificar al usuario sin exponer credenciales
- **Validación de datos** en los controladores (DTOs + class-validator)
- **Sanitización** antes de enviar respuestas al frontend
- Los servicios internos nunca reciben ni exponen datos sensibles directamente

---

### 1.2 Recuperación de datos del usuario

Cuando el procesamiento requiere datos del usuario, estos se recuperan **una sola vez al inicio del flujo** y se mantienen en contexto.

```
1. Usuario inicia sesión → SSO emite Access Token + ID Token
2. Frontend almacena el token de forma segura (memoria / secure storage)
3. Frontend envía solicitud al backend con:
       Authorization: Bearer <token>
4. AuthGuard valida el token
5. Los datos del usuario se extraen del payload del token
6. El contexto del usuario se propaga a los servicios sin nueva consulta a la BD
```

**Ventajas:**
- Se evita consultar la base de datos en cada petición
- Se mantiene un contexto de usuario coherente durante todo el procesamiento
- Compatible con múltiples etapas/acciones derivadas de la interfaz

---

### 1.3 Servicios sin consciencia de seguridad

En una arquitectura limpia, los **servicios de negocio no conocen quién hace la solicitud**. La responsabilidad de autenticación y autorización recae en la capa de API.

```
Usuario
   │
   ▼
API Gateway / Auth Guard   ◄── Responsable de autenticación y autorización
   │
   ▼
Controlador                ◄── Valida permisos, construye contexto
   │
   ▼
Servicios de negocio       ◄── Solo reciben datos procesados, sin contexto de seguridad
   │
   ▼
Repositorio / Infraestructura
```

**Responsabilidades del Auth Guard:**
- Validar el token JWT
- Verificar permisos y roles
- Rechazar solicitudes no autorizadas antes de que lleguen a los servicios

**Beneficios:**
- Los servicios son **reutilizables**, **testeables** y **desacoplados**
- La lógica de negocio no necesita cambiar si cambia el mecanismo de autenticación

---

### 1.4 Web y Mobile con diferentes experiencias

Para soportar una interfaz web y una móvil con estilos y look & feel diferentes, se adopta un enfoque de **API-first con clientes independientes**.

```
          ┌─────────────────┐     ┌──────────────────────┐
          │   Web (Angular) │     │ Mobile (Ionic/RN)    │
          │   Look & feel   │     │ Experiencia nativa   │
          │   corporativo   │     │ táctil / gestos      │
          └────────┬────────┘     └──────────┬───────────┘
                   │                         │
                   └──────────┬──────────────┘
                              │  HTTP / REST
                   ┌──────────▼──────────────┐
                   │     Backend NestJS       │
                   │   API unificada          │
                   └──────────┬──────────────┘
                              │
                   ┌──────────▼──────────────┐
                   │   Servicios / MongoDB    │
                   └─────────────────────────┘
```

| Cliente | Tecnología | Estrategia de UI |
|---|---|---|
| **Web** | Angular + Angular Material / Tailwind | Diseño responsive, branding corporativo |
| **Mobile** | Ionic + Angular | Componentes nativos iOS/Android, gestos, animaciones nativas |
| **Alternativa Mobile** | React Native | Máxima cercanía a UI nativa con componentes del SO |

**Ambos clientes consumen la misma API REST**, lo que permite:
- Reutilizar el backend al 100%
- Escalar clientes de forma independiente
- Mantener una fuente única de verdad para la lógica de negocio

---

### 1.5 Manejo de sesión del usuario

El manejo de sesión es **stateless** y se implementa mediante **tokens JWT**.

```
1. Usuario inicia sesión → SSO / Identity Provider
2. Se genera: Access Token (corta duración) + Refresh Token (larga duración)
3. Frontend almacena tokens en memoria o secure storage (no localStorage)
4. Cada petición incluye:
       Authorization: Bearer <access_token>
5. NestJS valida el token mediante AuthGuard (JwtStrategy)
6. Al expirar el Access Token → se usa el Refresh Token para renovarlo
7. Al cerrar sesión → tokens son revocados / eliminados del cliente
```

**Ventajas del enfoque stateless:**

| Característica | Beneficio |
|---|---|
| Stateless | No requiere sesiones en el servidor |
| Escalable | Funciona con múltiples instancias del backend |
| Compatible | Con microservicios y API Gateway |
| Seguro | Expiración automática de tokens |

---

### 1.6 Protección de información sensible

Para evitar que información sensible llegue al frontend y evitar consultas repetidas a la base de datos, se aplican las siguientes estrategias:

#### 1. DTOs de respuesta filtrados

Los controladores retornan únicamente los campos necesarios al cliente.

```
UserEntity (base de datos)       UserResponseDTO (response al frontend)
─────────────────────────        ──────────────────────────────────────
id                      →        id
email                   →        email
password                ✗        (no se expone)
ssn / datos sensibles   ✗        (no se expone)
roles / permisos        ✗        (no se expone)
```

#### 2. Contexto de usuario en backend (sin consultar la BD por petición)

Los datos del usuario se almacenan en:

- **Payload del JWT**: datos no sensibles necesarios para el procesamiento
- **Cache (Redis)**: datos que se recuperan una vez y se mantienen disponibles
- **Contexto de request**: se propaga entre capas sin re-consultar la BD

#### 3. Procesamiento interno seguro

```
Frontend  →  envía solicitud (sin datos sensibles)
Backend   →  extrae datos del token / cache
Backend   →  utiliza datos sensibles internamente para el procesamiento
Backend   →  devuelve solo el resultado procesado (DTO filtrado)
Frontend  →  recibe únicamente el resultado
```

---

### 1.7 Integración con Single Sign On (SSO)

Para evitar capturar credenciales en múltiples aplicaciones, se implementa **SSO basado en OAuth 2.0 / OpenID Connect (OIDC)**.

#### Arquitectura SSO

```
Usuario
   │
   ▼
┌──────────────────────────┐
│   Identity Provider      │  ← Keycloak / Auth0 / Azure AD
│   (SSO propio)           │     (implementado por nosotros)
└──────────┬───────────────┘
           │  Access Token + ID Token
           ▼
┌──────────────────────────┐
│   Frontend (Angular)     │
└──────────┬───────────────┘
           │  Authorization: Bearer <token>
           ▼
┌──────────────────────────┐
│   Backend API (NestJS)   │
│   Valida token con       │
│   clave pública del IDP  │
└──────────────────────────┘
```

#### Flujo de autenticación

```
1. Usuario accede a la aplicación (web o móvil)
2. La app redirige al Identity Provider (SSO)
3. El usuario se autentica una sola vez en el IDP
4. El IDP retorna: Access Token + ID Token + Refresh Token
5. El frontend usa el Access Token para consumir la API
6. El backend valida el token con las claves públicas del IDP (JWKS endpoint)
7. Si el token es válido → se procesa la solicitud
8. Si el token expira → el frontend solicita renovación con el Refresh Token
```

#### Tecnologías para implementar el SSO propio

| Opción | Descripción |
|---|---|
| **Keycloak** | Open source, robusto, soporta OIDC/SAML, auto-hosteable |
| **Auth0** | SaaS, rápida integración, con plan gratuito |
| **Azure AD B2C** | Ideal si el proyecto ya usa infraestructura Azure |

#### Integración en NestJS

```typescript
// Validación del token JWT emitido por el IDP
JwtStrategy → jwks-rsa → verifica firma con clave pública del SSO
PassportModule → JwtAuthGuard → protege los endpoints
```

---

## Parte 1 – Diseño

### Componentes

| Componente | Tecnología | Responsabilidad |
|---|---|---|
| Frontend | Angular 17 (standalone) | Interfaz de usuario |
| Backend | NestJS 10 | API REST + lógica de negocio |
| Base de datos | MongoDB (Mongoose) | Persistencia de solicitudes |
| AI Mock | Servicio interno NestJS | Simula procesamiento de IA |

### Flujo de la solicitud

```
Usuario (Angular)
      │
      │  POST /requests { text }
      ▼
RequestsController
      │  valida DTO (class-validator)
      ▼
RequestsService
      │  llama a AIService.process(text)
      ▼
AIService (mock)
      │  retorna resultado simulado
      ▼
RequestsService
      │  guarda en MongoDB
      ▼
MongoDB
      │
      ▼
RequestsService  →  retorna documento guardado
      │
      ▼
RequestsController  →  HTTP 201 + JSON
      │
      ▼
Angular muestra resultado
```

### Manejo de errores

- **Validación de entrada**: `ValidationPipe` global rechaza DTOs inválidos (HTTP 400)
- **Not Found**: `NotFoundException` cuando el ID no existe (HTTP 404)
- **Errores internos**: `InternalServerErrorException` captura fallos de IA/DB (HTTP 500)
- **Frontend**: maneja el observable `error` y muestra mensaje al usuario

### Escalabilidad

- Backend stateless → escalable horizontalmente con múltiples instancias
- MongoDB admite réplicas y sharding para alta disponibilidad
- El `AIService` puede reemplazarse por HTTP real a OpenAI/Claude sin cambiar el resto del sistema
- Los módulos NestJS permiten dividir la aplicación en microservicios en el futuro

---

## Parte 2 – Backend (Node.js / NestJS)

### Estructura del proyecto

```
backend/
├── nest-cli.json
├── tsconfig.json
├── package.json
└── src/
    ├── main.ts                          ← Bootstrap + CORS + ValidationPipe
    ├── app.module.ts                    ← Conexión MongoDB + importa RequestsModule
    └── requests/
        ├── requests.module.ts
        ├── controller/
        │   └── requests.controller.ts  ← POST /requests  GET /requests  GET /requests/:id
        ├── service/
        │   ├── requests.service.ts     ← Lógica de negocio
        │   └── ai.service.ts           ← Mock de IA con delay simulado
        ├── dto/
        │   └── create-request.dto.ts   ← Validación con class-validator
        └── schemas/
            └── request.schema.ts       ← Modelo Mongoose
```

### Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/auth/mock-login` | Genera token JWT de prueba para autenticación |
| `POST` | `/requests` | Crea solicitud, llama a IA, guarda en MongoDB |
| `GET` | `/requests` | Lista todas las solicitudes |
| `GET` | `/requests/:id` | Obtiene una solicitud por ID |

> Los endpoints `/requests` estan protegidos con `JwtAuthGuard` y requieren header:
> `Authorization: Bearer <access_token>`

### Ejemplo de uso

**Request:**
```json
POST /auth/mock-login
{
      "email": "demo@imix.com"
}
```

```json
POST /requests
Authorization: Bearer <access_token>
{
  "text": "Analizar este texto"
}
```

**Response (201):**
```json
{
      "id": "65f1a2b3c4d5e6f7a8b9c0d1",
  "text": "Analizar este texto",
  "result": "IA procesó el texto: \"Analizar este texto\" — Resultado simulado con confianza del 95%.",
  "status": "completed",
  "createdAt": "2026-03-15T10:00:00.000Z"
}
```

### Variables de entorno backend

```env
PORT=3000
FRONTEND_ORIGIN=http://localhost:4200
MONGODB_URI=mongodb://localhost:27017/imix
JWT_SECRET=imix-dev-secret
JWT_EXPIRES_IN=1h
```

### Cómo ejecutar el backend

```bash
# Requiere MongoDB corriendo en localhost:27017
cd backend
npm install
npm run start:dev
```

---

## Parte 3 – Frontend (Angular)

### Estructura del proyecto

```
frontend/
└── src/
    └── app/
        ├── app.component.ts             ← Root component (standalone)
        ├── app.config.ts                ← HttpClient provider
        ├── services/
        │   └── api.service.ts           ← Comunicación con el backend
        └── components/
            └── request/
                ├── request.component.ts   ← Lógica del formulario
                ├── request.component.html ← Vista con estados: idle / loading / result / error
                └── request.component.css  ← Estilos
```

### Funcionalidades de la vista

- **Textarea** para ingresar el texto a procesar
- **Autenticacion previa**: la app obtiene JWT desde `/auth/mock-login` antes de enviar solicitudes
- **Botón Enviar** (deshabilitado si el campo está vacío o mientras carga)
- **Indicador de carga** con spinner animado durante el procesamiento
- **Tarjeta de resultado** que muestra: estado, texto enviado, respuesta IA, ID y fecha
- **Manejo de errores** con mensaje visible al usuario
- **Botón Limpiar** para resetear el formulario

### Cómo ejecutar el frontend

```bash
cd frontend
npm install
npm start
# Abre http://localhost:4200
```

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend Web | Angular |
| Frontend Mobile | Ionic + Angular |
| Backend | NestJS (Node.js) |
| Base de datos | MongoDB |
| Autenticación | JWT / OAuth2 / OIDC |
| SSO | Keycloak (auto-hosteable) |
| Cache | Redis (opcional) |
