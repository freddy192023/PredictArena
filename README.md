# 🏟️ PredictArena

> Plataforma de predicciones competitivas con economía virtual (ArenaCoins)

[![CI — PredictArena](https://img.shields.io/badge/CI-GitHub%20Actions-brightgreen)](https://github.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)](https://supabase.com)
[![Tests](https://img.shields.io/badge/Tests-32%20passed-success)](./frontend/src/test)

---

## 📋 Descripción

**PredictArena** es una aplicación web donde los usuarios compiten realizando predicciones sobre eventos ficticios y deportivos utilizando una moneda virtual llamada **ArenaCoins**. No existe dinero real.

Diseñado para demostrar competencias en:
- ✅ **Seguridad de Software** — RLS en Supabase, headers de seguridad HTTP
- ✅ **Calidad de Software** — 32 pruebas unitarias con Vitest (100% passing)
- ✅ **Gestión de Proyectos** — Metodología Scrum, 7 Sprints planificados
- ✅ **Desarrollo Cloud Native** — Deploy en Vercel, CI/CD con GitHub Actions
- ✅ **Liderazgo y Negocios** — Economía virtual, ranking competitivo

---

## 🏗️ Arquitectura

```
PredictArena/
├── frontend/              # React + Vite + TypeScript + Tailwind
│   ├── src/
│   │   ├── pages/         # LoginPage, RegisterPage, DashboardPage, RankingPage
│   │   ├── components/    # Componentes reutilizables
│   │   ├── services/      # supabase.ts, api.ts (authAPI, eventsAPI, predictionsAPI)
│   │   ├── store/         # authStore.ts (Zustand)
│   │   ├── utils/         # gameLogic.ts (funciones puras testables)
│   │   └── test/          # Suite de pruebas Vitest
│   ├── vercel.json        # Configuración de deploy
│   └── .env.example       # Plantilla de variables de entorno
├── .github/
│   └── workflows/
│       └── ci.yml         # Pipeline CI/CD (TypeScript + Tests + Build)
└── docs/                  # Documentación adicional
```

**Stack tecnológico:**

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS |
| Estado | Zustand (persistido en localStorage) |
| Backend / DB | Supabase (PostgreSQL + Auth + RLS) |
| Testing | Vitest, @testing-library/react |
| Deploy | Vercel (frontend) |
| CI/CD | GitHub Actions |

---

## 🚀 Cómo ejecutar localmente

### Prerequisitos
- Node.js 20+
- Cuenta en [Supabase](https://supabase.com)

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/PredictArena.git
cd PredictArena/frontend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus credenciales de Supabase
```

### 4. Levantar servidor de desarrollo
```bash
npm run dev
# → http://localhost:5173
```

---

## 🧪 Pruebas

```bash
# Ejecutar todas las pruebas
npm test

# Modo watch (re-ejecuta al guardar)
npm run test:watch

# Con reporte de cobertura
npm run test:coverage
```

**Resultado actual:**
```
✓ src/test/gameLogic.test.ts (32 tests) 19ms

Test Files  1 passed (1)
     Tests  32 passed (32)
```

---

## ☁️ Deploy en Vercel

### Deploy manual
1. Instala Vercel CLI: `npm i -g vercel`
2. En la carpeta `frontend/`: `vercel --prod`

### Deploy automático (recomendado)
1. Importa el repositorio en [vercel.com](https://vercel.com)
2. Configura el directorio raíz como `frontend/`
3. Añade las variables de entorno:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Cada push a `main` despliega automáticamente ✅

---

## 🔐 Seguridad

- **RLS (Row Level Security)** habilitado en todas las tablas de Supabase
- Los usuarios solo pueden ver/modificar sus propios datos (`auth.uid() = user_id`)
- Los eventos son de lectura pública (`USING (true)`)
- Headers HTTP de seguridad configurados en `vercel.json`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
- Variables de entorno nunca se exponen en Git (`.env` en `.gitignore`)

---

## 📊 Funcionalidades

| Módulo | Estado |
|--------|--------|
| 🔐 Registro y Login (Supabase Auth) | ✅ |
| 🪙 Economía virtual (ArenaCoins) | ✅ |
| 🎯 Sistema de Predicciones | ✅ |
| 📊 Dashboard con estadísticas reales | ✅ |
| 🏆 Ranking Global (Leaderboard) | ✅ |
| 🏅 Sistema de Logros (7 badges) | ✅ |
| 🧪 Suite de pruebas unitarias (32 tests) | ✅ |
| ☁️ Deploy en Vercel + CI/CD | ✅ |

---

## 👥 Equipo

Proyecto académico desarrollado con metodología **Scrum** en 7 Sprints.
