# PredictArena 🏟️

> Plataforma de predicciones competitivas con economía virtual (ArenaCoins)

[![Node.js](https://img.shields.io/badge/Node.js-20_LTS-green?logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)](https://postgresql.org)

## ¿Qué es PredictArena?

PredictArena es una plataforma donde los usuarios compiten realizando predicciones sobre eventos reales o ficticios. Ganan o pierden **ArenaCoins** (moneda virtual) según sus aciertos, suben en rankings y desafían a otros jugadores.

## Stack Técnico

| Capa | Tecnología |
|---|---|
| **Backend** | Node.js 20 + Express + TypeScript |
| **Base de datos** | PostgreSQL 15 + Prisma ORM |
| **Autenticación** | JWT + bcrypt |
| **Frontend** | React 18 + Vite + TypeScript |
| **Estilos** | Tailwind CSS |
| **Estado** | Zustand |
| **Contenedores** | Docker + Docker Compose |

## Inicio rápido

### Prerrequisitos
- Node.js 20 LTS
- Docker Desktop
- npm 10+

### 1. Clonar y configurar entorno

```bash
# Clonar repositorio
git clone <repo-url>
cd PredictArena

# Configurar backend
cp backend/.env.example backend/.env

# Editar backend/.env con tus credenciales
```

### 2. Levantar con Docker

```bash
cd docker
docker compose up -d
```

Esto levanta:
- 🐘 **PostgreSQL** en `localhost:5432`
- 🚀 **Backend API** en `http://localhost:3000`
- ⚛️ **Frontend** en `http://localhost:5173`

### 3. Ejecutar migraciones

```bash
cd backend
npm run prisma:migrate
```

### 4. Desarrollo local (sin Docker)

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

## API Endpoints

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| GET | `/health` | No | Health check |
| POST | `/api/auth/register` | No | Registro |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | ✅ | Perfil |
| GET | `/api/events` | No | Listar eventos |
| GET | `/api/events/:id` | No | Detalle evento |
| POST | `/api/events/:id/predict` | ✅ | Crear predicción |

## Estructura del proyecto

```
PredictArena/
├── backend/
│   ├── src/
│   │   ├── controllers/   # Lógica de negocio
│   │   ├── middleware/    # Auth JWT, rate limiting
│   │   ├── routes/        # Definición de endpoints
│   │   └── utils/         # JWT, Prisma client
│   ├── prisma/
│   │   └── schema.prisma  # Modelos de BD
│   └── tests/             # Tests con Jest + Supertest
├── frontend/
│   └── src/
│       ├── pages/         # Login, Register, Dashboard
│       ├── services/      # API client (Axios)
│       ├── store/         # Zustand stores
│       └── components/    # UI components
└── docker/
    └── docker-compose.yml
```

## Tests

```bash
# Backend
cd backend && npm test

# Con cobertura
cd backend && npm test -- --coverage
```

## Roadmap

- [x] Sprint 0: Setup + estructura base
- [x] Sprint 1: Autenticación + JWT
- [ ] Sprint 2: Eventos + predicciones
- [ ] Sprint 3: ArenaCoins + ranking
- [ ] Sprint 4: Seguridad + pruebas
- [ ] Sprint 5: Docker + despliegue
- [ ] Sprint 6: Documentación + pulido

## Licencia

MIT — Desarrollado para demostrar competencias en seguridad, calidad y arquitectura cloud-native.
