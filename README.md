# Plannia — Frontend

Plataforma de gestión de tareas y equipos con asignación inteligente de tareas según habilidades, experiencia e intereses de cada miembro.

## Stack

- React + TypeScript + Vite
- Backend: Spring Boot (Java) desplegado en Azure
- Autenticación: JWT Bearer Token

## Estructura del proyecto

    src/
      app/
        components/       # Pantallas y componentes de UI
        context/           # AuthContext (sesión, token, usuario)
        services/          # Llamadas al backend (API)

## Configuración

La URL base del backend está definida en src/app/services/api.ts:

    https://plannia-eabkf7dna7g7dqhc.eastus-01.azurewebsites.net/api/v1

## Instalación y ejecución

    npm i
    npm run dev

## Roles

- LEADER: crea el equipo, gestiona categorías, tareas y asigna miembros.
- MEMBER: se une con un código de equipo, gestiona su perfil (habilidades, horas disponibles) y sus tareas asignadas.

## Servicios principales (/services)

| Archivo | Responsabilidad |
|---|---|
| authService.ts | Sign-up, sign-in, creación de equipo |
| profileService.ts | Perfil de usuario (GET, crear/actualizar member-profile) |
| categoryService.ts | CRUD de categorías y miembros por categoría |
| teamService.ts | Obtener datos del equipo |
| taskService.ts | Obtener tareas por equipo |
| dashboardService.ts | Datos del dashboard |

## Documentación de la API

Ver documentación completa del backend en DOCUMENTACION_API_PLANNIA.md (incluida en el repo) o en /v3/api-docs del servidor desplegado.

## Equipo

- Project Manager: Natalia Roman
- Technical Lead: Jorge Yum
- Business Analyst / UX: Marllely Arias
- Developer: Diego Mucha