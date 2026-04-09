# Project Rules — Etnof Assistant

Ces règles sont non-négociables. Elles protègent l'architecture à mesure que le projet grandit.

---

## Règles backend

### R1 — Pas de logique dans les contrôleurs
Les contrôleurs NestJS ne font que :
- Récupérer les paramètres/body/query
- Appeler le service correspondant
- Retourner le résultat

```typescript
// CORRECT
@Get(':id')
findOne(@Param('id') id: string) {
  return this.clientsService.findOne(id);
}

// INTERDIT
@Get(':id')
async findOne(@Param('id') id: string) {
  const client = await this.prisma.client.findUnique({ where: { id } }); // ← NON
  if (!client) throw new NotFoundException(); // ← logique dans le contrôleur
  return client;
}
```

### R2 — Pas d'accès Prisma direct hors des services
`PrismaService` ne doit être injecté que dans les services (`*.service.ts`), jamais dans les contrôleurs ou les guards.

### R3 — Chaque entité métier est scopée à un salonId
Toute requête Prisma sur une entité métier doit filtrer par `salonId`. Pas d'exception.

### R4 — Les secrets vivent dans .env
Pas de clés API, passwords ou secrets hardcodés dans le code. Utiliser `ConfigService`.

### R5 — Validation des entrées obligatoire
Tous les body de requête doivent avoir un DTO avec `class-validator`. Le `ValidationPipe` global rejette automatiquement les propriétés non déclarées (`whitelist: true`).

### R6 — Pas d'appel HTTP direct dans les services
Les services NestJS ne font pas d'appels HTTP vers des APIs externes directement. L'accès aux providers IA passe par la couche `ai/providers/`.

### R7 — Migrations Prisma obligatoires
Toute modification du schéma `schema.prisma` nécessite une migration : `pnpm prisma:migrate`. Ne jamais modifier la DB manuellement en production.

---

## Règles frontend

### R8 — Pas de logique métier dans les composants React
Les composants affichent. La logique vit dans les hooks (`hooks/`) et les appels API (`api/`).

### R9 — Pas d'appel API direct dans les composants
Utiliser les hooks `useQuery`/`useMutation` de TanStack Query. Les appels API bruts sont dans `src/api/`.

### R10 — Pas d'appel OpenAI depuis le frontend
L'assistant IA passe obligatoirement par `POST /api/v1/ai/chat`. Jamais d'appel direct à l'API OpenAI depuis le navigateur (expose la clé API).

### R11 — State management clair
- **Auth state** (tokens, user) → Zustand (`store/auth.store.ts`)
- **Server state** (données API) → TanStack Query
- **Local UI state** (modals, tabs...) → `useState` local dans le composant

### R12 — Types partagés via @etnof/shared
Si un type existe côté backend ET est utilisé côté frontend, il doit être dans `packages/shared/src/types/`.

---

## Règles d'architecture globale

### R13 — API versionnée
Tous les endpoints sont sous `/api/v1/`. Pour une breaking change, créer `/api/v2/` sans supprimer `/api/v1/`.

### R14 — Pas de couplage fort avec OpenAI
L'interface `IAIProvider` est le seul contrat que le code utilise. Aucun import direct de `openai` en dehors de `openai.provider.ts`.

### R15 — Multi-tenant par design
Dès qu'on ajoute une entité métier, elle doit avoir un `salonId`. Pas d'exception pour "on n'a qu'un salon pour l'instant".

---

## Checklist avant de merger une PR

- [ ] Pas de `console.log` oubliés
- [ ] DTOs créés pour les nouveaux endpoints
- [ ] Guards appropriés sur les nouvelles routes
- [ ] Migration Prisma si modification de schema
- [ ] Types ajoutés dans `@etnof/shared` si partagés
- [ ] Pas de secret dans le code
- [ ] Pas de logique métier côté frontend
