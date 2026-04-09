# Backend — Etnof Assistant

API NestJS. Le cerveau du produit.

## Démarrage rapide

```bash
cp .env.example .env
# Remplir les valeurs dans .env

pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev
```

- API : http://localhost:3001/api/v1
- Swagger : http://localhost:3001/docs

## Scripts

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Dev avec hot reload |
| `pnpm build` | Build production |
| `pnpm start:prod` | Lancer le build |
| `pnpm test` | Tests unitaires |
| `pnpm test:cov` | Couverture |
| `pnpm prisma:generate` | Générer le client Prisma |
| `pnpm prisma:migrate` | Appliquer les migrations |
| `pnpm prisma:studio` | UI Prisma Studio |

## Endpoints principaux

```
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me

GET    /api/v1/appointments?salonId=&date=&staffId=
POST   /api/v1/appointments
PATCH  /api/v1/appointments/:id/cancel

GET    /api/v1/clients?salonId=&search=
POST   /api/v1/clients

GET    /api/v1/services?salonId=
POST   /api/v1/services

GET    /api/v1/staff?salonId=
GET    /api/v1/staff/:id/availability?date=

POST   /api/v1/ai/chat

GET    /api/v1/health
```

## Variables d'environnement

Voir [.env.example](.env.example).

## Schéma base de données

Voir [prisma/schema.prisma](prisma/schema.prisma).

Modèles principaux :
- `Salon` — le tenant
- `User` — utilisateurs de l'application
- `Staff` — coiffeurs / employés
- `Service` — prestations
- `Client` — clients du salon
- `Appointment` — rendez-vous
- `AiConfig` — configuration IA par salon
