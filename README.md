# Etnof Assistant

Assistant IA pour salons de coiffure, barbiers et instituts. Permet à la réception et aux coiffeurs de gérer les rendez-vous, les clients et les services via une interface conversationnelle.

---

## Vision produit

- Parler à une IA pour demander les disponibilités, créer/modifier/annuler des rendez-vous
- Consulter les services, les durées, les clients
- Préparer le terrain pour la voix temps réel
- S'intégrer à terme au produit FideliteProPlus via API

---

## Architecture

```
etnof-assistant/                 ← monorepo root (pnpm workspaces + Turborepo)
├── apps/
│   ├── backend/                 ← NestJS API (le cerveau du produit)
│   └── frontend/                ← React + Vite (interface opérateur)
└── packages/
    └── shared/                  ← Types TypeScript partagés
```

**Pourquoi un monorepo ?**
Types partagés entre backend et frontend sans duplication. Le backend reste un service API indépendant consommable par n'importe quel client (FideliteProPlus, app mobile, voix...).

**Séparation des responsabilités :**
- Le backend porte toute la logique métier
- Le frontend ne fait qu'afficher et appeler l'API
- L'IA est une couche dans le backend, pas dans le frontend

---

## Stack

| Couche | Technologie |
|--------|------------|
| Backend | NestJS + TypeScript |
| ORM | Prisma |
| Base de données | PostgreSQL |
| Auth | JWT access (15min) + refresh token (7j) |
| Validation | class-validator + class-transformer |
| API docs | Swagger/OpenAPI |
| Frontend | React 18 + Vite + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| State | Zustand (auth) + TanStack Query (server state) |
| AI | Couche abstraite — OpenAI aujourd'hui, swappable |
| Monorepo | pnpm workspaces + Turborepo |
| Infra locale | Docker Compose (PostgreSQL + Redis) |

---

## Lancer le projet

### Prérequis

- Node.js >= 20
- pnpm >= 9
- Docker Desktop (pour PostgreSQL)

### 1. Cloner et installer

```bash
git clone <repo>
cd etnof-assistant
pnpm install
```

### 2. Démarrer la base de données

```bash
docker compose up -d
```

### 3. Configurer le backend

```bash
cd apps/backend
cp .env.example .env
# Éditer .env avec vos valeurs (OpenAI key, etc.)
pnpm prisma:generate
pnpm prisma:migrate
```

### 4. Configurer le frontend

```bash
cd apps/frontend
cp .env.example .env
```

### 5. Lancer en développement

Depuis la racine :
```bash
pnpm dev
```

- Backend : http://localhost:3001
- Frontend : http://localhost:5173
- Swagger : http://localhost:3001/docs

---

## Modules backend

| Module | Responsabilité |
|--------|---------------|
| `auth` | Login, register, JWT, refresh token |
| `users` | Gestion des utilisateurs et rôles |
| `salons` | Gestion des salons (multi-tenant) |
| `staff` | Coiffeurs, disponibilités, services assignés |
| `services` | Catalogue des prestations (durée, prix) |
| `appointments` | Rendez-vous, statuts, conflits |
| `clients` | Fiches clients, historique |
| `ai` | Assistant IA, orchestration, tools/actions |
| `health` | Health check de l'application |
| `prisma` | Accès base de données (module global) |

---

## Couche IA — Architecture

```
modules/ai/
├── providers/
│   ├── ai-provider.interface.ts   ← contrat abstrait IAIProvider
│   └── openai.provider.ts         ← implémentation OpenAI
├── tools/
│   └── salon-tools.ts             ← définitions des actions (getAvailabilities, etc.)
├── prompts/
│   └── system.prompt.ts           ← prompt système dynamique
├── dto/
│   └── chat.dto.ts
├── ai.service.ts                  ← orchestration + agentic loop
├── ai.controller.ts               ← endpoint POST /ai/chat
└── ai.module.ts
```

**Changer de provider IA :**
1. Créer `providers/google.provider.ts` qui implémente `IAIProvider`
2. L'enregistrer dans `ai.module.ts`
3. Changer `AI_PROVIDER=google` dans `.env`
4. Ajouter le case dans `resolveProvider()` dans `ai.service.ts`

Aucune autre modification nécessaire.

---

## Roadmap technique

### Phase 1 — Base (actuel)
- [x] Architecture monorepo
- [x] Backend NestJS complet
- [x] Schéma Prisma multi-tenant
- [x] Auth JWT + refresh
- [x] Modules métier : salons, staff, services, appointments, clients
- [x] Couche IA avec abstraction provider
- [x] Frontend React avec toutes les pages
- [x] Documentation Swagger

### Phase 2 — Fonctionnalités
- [ ] Disponibilités calculées (créneaux libres)
- [ ] Notifications (rappels RDV)
- [ ] Historique et logs d'actions
- [ ] Gestion des horaires d'ouverture du salon
- [ ] Webhook sortants

### Phase 3 — IA avancée
- [ ] Streaming des réponses IA
- [ ] Support voix (WebRTC / Whisper)
- [ ] Mémoire de conversation persistante
- [ ] Multi-salon dans une même session

### Phase 4 — Intégration FideliteProPlus
- [ ] Endpoints dédiés pour FideliteProPlus
- [ ] Authentification inter-services
- [ ] Synchronisation des données

---

## Documentation complémentaire

| Fichier | Contenu |
|---------|---------|
| [AGENTS.md](AGENTS.md) | Guide pour les agents IA intervenant sur ce repo |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Diagrammes, flux IA, patterns d'erreur |
| [PROJECT_RULES.md](PROJECT_RULES.md) | Règles non-négociables avec exemples |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Workflow, commits, setup dev |
| [TECH_DEBT.md](TECH_DEBT.md) | Choix temporaires, lacunes connues, priorités |

---

## Principes de développement

1. **Backend = cerveau.** Toute logique métier vit dans les services NestJS.
2. **Frontend = vue.** Les composants React n'ont pas de logique métier.
3. **API first.** Chaque feature doit exposer un endpoint avant d'avoir une UI.
4. **Types partagés.** Utiliser `@etnof/shared` pour les types communs.
5. **Un module = une responsabilité.** Ne pas mélanger appointments et clients dans le même service.
6. **Pas de logique dans les contrôleurs.** Les contrôleurs ne font que router vers les services.
7. **Validation aux entrées.** DTOs avec class-validator sur tous les endpoints.

---

## Conventions de code

- Fichiers : `kebab-case.ts`
- Classes : `PascalCase`
- Variables/fonctions : `camelCase`
- Constantes : `UPPER_SNAKE_CASE`
- Modules NestJS : toujours `module.ts`, `service.ts`, `controller.ts` dans le même dossier
- Toujours exporter les services pour que d'autres modules puissent les importer

---

## Ajouter une feature (exemple : ajouter les congés du staff)

1. Ajouter le modèle `StaffLeave` dans `prisma/schema.prisma`
2. Lancer `pnpm prisma:migrate`
3. Créer `src/modules/staff/dto/create-leave.dto.ts`
4. Ajouter les méthodes dans `staff.service.ts`
5. Ajouter les endpoints dans `staff.controller.ts`
6. Ajouter le type dans `packages/shared/src/types/api.types.ts`
7. Ajouter le call API dans `apps/frontend/src/api/staff.api.ts`
8. Créer le hook dans `useApi.ts` si nécessaire
9. Mettre à jour la page `StaffPage.tsx`

---

## Règles pour ne pas casser l'architecture

- Ne jamais importer `PrismaService` directement dans un contrôleur
- Ne jamais faire d'appels HTTP dans les services NestJS (utiliser des modules dédiés)
- Ne jamais appeler l'API OpenAI directement depuis le frontend
- Ne jamais mettre de secrets dans le code — toujours via `.env`
- Ne jamais modifier le schéma Prisma sans créer une migration
- Ne jamais bypass les guards `JwtAuthGuard` sauf sur les routes publiques explicites

---

## Intégration FideliteProPlus

Le backend est une API REST versionnée (`/api/v1/...`).
Pour brancher FideliteProPlus :
1. Créer un utilisateur de type `SUPER_ADMIN` ou `SALON_OWNER` via l'API
2. Authentifier via `POST /api/v1/auth/login`
3. Utiliser le token JWT dans les headers `Authorization: Bearer <token>`
4. Consommer les endpoints existants (appointments, clients, staff, ai/chat...)

Aucune modification backend nécessaire pour un nouveau client frontend.