# Contributing — Etnof Assistant

## Workflow de développement

### Branches

- `main` — branche principale, toujours déployable
- `feature/<nom>` — nouvelles fonctionnalités
- `fix/<nom>` — corrections de bugs
- `chore/<nom>` — maintenance, dépendances, config

### Commits

Format : `type(scope): message`

Types : `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`

```
feat(appointments): add conflict detection on create
fix(auth): handle expired refresh token edge case
chore(deps): bump openai to 4.77.0
docs(readme): update setup instructions
```

### Pull Requests

1. Branche depuis `main`
2. Nommer la PR clairement
3. Vérifier la checklist dans `PROJECT_RULES.md`
4. Pas de merge sans review si travail en équipe

---

## Setup développement

```bash
# Prérequis : Node 20+, pnpm 9+, Docker
pnpm install
docker compose up -d
cd apps/backend && cp .env.example .env && pnpm prisma:migrate
cd apps/frontend && cp .env.example .env
pnpm dev  # depuis la racine
```

---

## Structure d'un nouveau module backend

```bash
# Créer les fichiers
touch apps/backend/src/modules/example/example.module.ts
touch apps/backend/src/modules/example/example.service.ts
touch apps/backend/src/modules/example/example.controller.ts
mkdir apps/backend/src/modules/example/dto

# Enregistrer dans app.module.ts
# imports: [..., ExampleModule]
```

Squelette minimum :

```typescript
// example.module.ts
@Module({
  providers: [ExampleService],
  controllers: [ExampleController],
  exports: [ExampleService],
})
export class ExampleModule {}
```

---

## Ajouter une variable d'environnement

1. Ajouter dans `apps/backend/.env.example` (ou frontend)
2. Ajouter dans le fichier de config correspondant (`src/config/*.config.ts`)
3. Accéder via `ConfigService.get('namespace.key')`
4. Ne jamais utiliser `process.env` directement dans les services

---

## Lancer les tests

```bash
# Backend
cd apps/backend
pnpm test           # unit tests
pnpm test:e2e       # e2e tests
pnpm test:cov       # coverage

# Typecheck global
pnpm typecheck
```

---

## Swagger

La documentation Swagger est accessible en développement sur :
`http://localhost:3001/docs`

Règles :
- Chaque contrôleur doit avoir `@ApiTags()`
- Chaque endpoint doit avoir `@ApiOperation({ summary: '...' })`
- Les endpoints protégés doivent avoir `@ApiBearerAuth('access-token')`
