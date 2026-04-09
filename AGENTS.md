# AGENTS.md — Guide permanent pour les agents IA

Ce fichier est le point d'entrée obligatoire pour toute IA de développement intervenant sur ce repo.
Lire entièrement avant d'écrire la moindre ligne de code.

---

## Ce que tu construis

Un assistant IA pour salons de coiffure, barbiers et instituts.
Les utilisateurs sont les coiffeurs et la réception — pas les clients finaux du salon.

**Cas d'usage typiques :**
- "Qui est disponible demain à 14h ?"
- "Ajoute une coupe homme pour Julien à 15h30"
- "Combien de temps dure un balayage ?"
- "Annule le RDV de Marie"
- "Montre les rendez-vous de Sarah aujourd'hui"

**Ce produit a vocation à :**
1. Fonctionner en standalone pour 1 salon
2. Passer en multi-salon (multi-tenant) — l'architecture l'anticipe déjà
3. S'intégrer comme backend de FideliteProPlus (app SaaS existante) via API REST

---

## Structure du repo

```
etnof-assistant/
├── apps/
│   ├── backend/          NestJS — API REST + couche IA
│   └── frontend/         React + Vite — interface opérateur salon
├── packages/
│   └── shared/           Types TypeScript partagés backend/frontend
├── AGENTS.md             ← ce fichier
├── ARCHITECTURE.md       Diagrammes, flux, patterns techniques
├── PROJECT_RULES.md      Règles non-négociables avec exemples de code
├── TECH_DEBT.md          Choix temporaires documentés avec priorités
└── CONTRIBUTING.md       Workflow git, setup, conventions de commits
```

Lire `ARCHITECTURE.md` pour les diagrammes.
Lire `PROJECT_RULES.md` pour les règles avec exemples de code.
Lire `TECH_DEBT.md` avant de "corriger" quelque chose qui est peut-être intentionnel.

---

## Principe directeur unique

**Le backend est le cerveau. Le frontend est l'écran.**

Tout ce qui ressemble à de la logique appartient au backend.
Le frontend appelle l'API, affiche les données, gère l'état local d'UI.
C'est tout.

---

## Règles backend — NestJS

### Structure d'un module

```
modules/feature/
├── dto/
│   └── create-feature.dto.ts   ← class-validator, @ApiProperty()
├── feature.module.ts           ← imports, providers, exports
├── feature.service.ts          ← toute la logique métier
└── feature.controller.ts       ← routing seulement
```

Ne jamais créer un module sans ces quatre éléments.
Ne jamais créer un fichier `feature.utils.ts` ou `feature.helpers.ts` — si tu as besoin d'un helper partagé, il va dans `src/common/`.

### Contrôleurs

Un contrôleur ne fait que trois choses : recevoir, déléguer, retourner.

```typescript
// CORRECT
@Get(':id')
findOne(@Param('id') id: string) {
  return this.featureService.findOne(id);
}

// INTERDIT — logique dans le contrôleur
@Get(':id')
async findOne(@Param('id') id: string) {
  const item = await this.prisma.feature.findUnique({ where: { id } });
  if (!item) throw new NotFoundException();
  return item;
}
```

### Services

- Un service = une entité métier. Pas de service "fourre-tout".
- `PrismaService` s'injecte dans les services, jamais dans les contrôleurs.
- Les erreurs HTTP (`NotFoundException`, `ConflictException`...) sont lancées depuis le service.
- Les méthodes retournent les données directement — le `TransformInterceptor` emballe dans `{ success, data, timestamp }` automatiquement.

### DTOs

- Chaque endpoint POST/PUT/PATCH a son DTO avec `class-validator`.
- Toujours décorer avec `@ApiProperty()` pour que Swagger soit utile.
- `ValidationPipe` global applique `whitelist: true` — les propriétés non déclarées sont silencieusement ignorées.

### Isolation multi-tenant (critique)

Le `salonId` ne vient **jamais** aveuglément du body ou des query params.

Utiliser `resolveSalonId(user, requestedSalonId)` depuis `common/utils/resolve-salon-id.ts` :
- SUPER_ADMIN → peut passer n'importe quel `salonId`
- Autres rôles → `salonId` forcé depuis le JWT, tout autre valeur lève `ForbiddenException`

```typescript
// CORRECT
@Get()
findAll(@CurrentUser() user: any, @Query('salonId') salonId?: string) {
  const resolvedSalonId = resolveSalonId(user, salonId);
  return this.featureService.findAll(resolvedSalonId);
}

// INTERDIT — n'importe qui peut passer le salonId d'un autre salon
@Get()
findAll(@Query('salonId') salonId: string) {
  return this.featureService.findAll(salonId);
}
```

### Prisma

- Toujours utiliser les types Prisma générés pour les `where` : `Prisma.AppointmentWhereInput`, pas `Record<string, unknown>`.
- Toute nouvelle entité métier doit avoir `salonId String` + relation `Salon`.
- Toute modification du schéma → `pnpm prisma:migrate` obligatoire. Jamais de modification manuelle en DB.
- Ajouter des index sur les colonnes utilisées en filtre fréquent (notamment les foreign keys).

### Auth et sécurité

- Toutes les routes sauf `/auth/login`, `/auth/register`, `/health` sont derrière `JwtAuthGuard`.
- Les routes admin (création salon, gestion users) ont en plus `RolesGuard` + `@Roles(UserRole.SUPER_ADMIN)`.
- Jamais de secret, clé API ou password dans le code source. Toujours `ConfigService`.
- Les secrets se lisent via les namespaces de config : `configService.get('jwt.accessSecret')`, pas `process.env.JWT_ACCESS_SECRET`.

---

## Règles frontend — React

### Structure d'une feature frontend

```
src/
├── api/feature.api.ts       ← appels HTTP axios, pas de logique
├── hooks/useFeature.ts      ← TanStack Query, logique de requête
├── pages/FeaturePage.tsx    ← page = layout + composition, pas de logique
└── components/feature/      ← si des composants réutilisables émergent
```

### Pages

- Une page reçoit des données via un hook, les affiche, gère les actions utilisateur.
- Pas de `fetch`, pas de `axios.get`, pas de `useState` pour des données serveur.
- Pas de calculs métier dans le JSX.

```typescript
// CORRECT
export function ClientsPage() {
  const { data: clients, isLoading } = useClients();
  return <ClientList clients={clients} isLoading={isLoading} />;
}

// INTERDIT — logique dans la page
export function ClientsPage() {
  const [clients, setClients] = useState([]);
  useEffect(() => {
    axios.get('/api/v1/clients').then(r => setClients(r.data.data));
  }, []);
  const sortedClients = clients.sort((a, b) => a.lastName.localeCompare(b.lastName));
  // ...
}
```

### Hooks

- Les hooks dans `hooks/` encapsulent TanStack Query (`useQuery`, `useMutation`).
- `useApi.ts` contient les hooks génériques réutilisables.
- Un hook par domaine si la logique grandit.

### API layer

- `api/client.ts` est le seul endroit où Axios est configuré (intercepteurs, base URL, refresh token).
- `api/feature.api.ts` expose des fonctions pures : `featureApi.list(params)`, `featureApi.create(payload)`.
- Ces fonctions ne gèrent pas les erreurs — TanStack Query s'en charge.

### State management

| Type de state | Outil |
|---------------|-------|
| Auth (tokens, user courant) | Zustand — `store/auth.store.ts` |
| Données serveur (RDV, clients...) | TanStack Query |
| UI local (modal ouvert, tab actif) | `useState` dans le composant |

Ne jamais mettre des données serveur dans Zustand.
Ne jamais mettre l'auth dans TanStack Query.

### Types

- Les types domaine sont dans `src/types/index.ts`.
- Ne jamais utiliser `Record<string, unknown>` pour typer des données API retournées.
- Quand un type existe des deux côtés (backend + frontend), il doit migrer vers `packages/shared/src/types/`.

---

## Règles couche IA — backend

### Principe central

L'IA ne répond jamais depuis ses paramètres internes. Elle appelle des outils qui lisent la base de données réelle, et formule sa réponse à partir des résultats réels.

### Ajouter un tool (action IA)

1. Déclarer le tool dans `modules/ai/tools/salon-tools.ts` (nom, description, paramètres JSON Schema).
2. Ajouter le `case` correspondant dans `AiService.executeTool()`.
3. `executeTool` appelle un service existant (`AppointmentsService`, `ClientsService`...). Il ne contient pas de logique métier propre.

```typescript
// CORRECT — executeTool délègue à un service
case 'findClient':
  return this.clientsService.findAll(salonId, args.query);

// INTERDIT — logique métier dans executeTool
case 'findClient':
  return this.prisma.client.findMany({ where: { salonId, firstName: { contains: args.query } } });
```

### Ajouter un provider IA

1. Créer `providers/nom-provider.provider.ts` qui implémente `IAIProvider` (une seule méthode : `complete()`).
2. L'enregistrer dans `ai.module.ts` dans la factory du token `AI_PROVIDER_TOKEN`.
3. Ajouter le case dans le switch de la factory.
4. Changer `AI_PROVIDER=nom` dans `.env`.

`AiService` n'importe jamais de provider concret. Il reçoit `IAIProvider` via injection.

### Prompt système

- Le prompt par défaut est dans `modules/ai/prompts/system.prompt.ts`.
- Chaque salon peut avoir un prompt personnalisé dans `AiConfig.systemPrompt` (table DB).
- `AiService.chat()` lit `AiConfig` en DB et utilise le prompt salon s'il existe, sinon le défaut.
- Les instructions d'IA sensibles (ce que l'IA peut/ne peut pas faire) restent côté backend, jamais dans le frontend.

---

## Ce qu'il ne faut jamais faire

### Jamais — niveau architecture

- **Ne jamais appeler l'API OpenAI depuis le frontend.** La clé API ne doit jamais être exposée au navigateur.
- **Ne jamais importer un provider IA concret dans `AiService`.** Passer par `AI_PROVIDER_TOKEN`.
- **Ne jamais lire `salonId` depuis le body/query sans `resolveSalonId()`.** Faille multi-tenant.
- **Ne jamais mettre de logique métier dans un contrôleur NestJS.** Même une seule condition.
- **Ne jamais mettre de logique métier dans un composant React.** Même un `sort()` ou un `filter()`.
- **Ne jamais modifier la DB sans migration Prisma.** `pnpm prisma:migrate` est obligatoire.

### Jamais — niveau code

- **Ne jamais hardcoder un secret, clé API ou URL de production dans le code.**
- **Ne jamais utiliser `process.env` directement dans les services NestJS.** Utiliser `ConfigService`.
- **Ne jamais typer des données API avec `Record<string, unknown>` ou `any` dans les pages et hooks.** Utiliser les types de `src/types/index.ts`.
- **Ne jamais créer une migration Prisma en production sans la tester en dev d'abord.**
- **Ne jamais bypass `JwtAuthGuard` sur une route qui accède à des données métier.**

### Jamais — niveau structure

- **Ne jamais créer un fichier `utils.ts` ou `helpers.ts` fourre-tout.** Chaque helper a un nom précis dans `common/`.
- **Ne jamais créer un service qui couvre deux entités métier différentes.** `AppointmentsClientsService` n'existe pas.
- **Ne jamais mettre de state serveur dans Zustand.** Zustand = auth uniquement.
- **Ne jamais ajouter une dépendance sans vérifier qu'elle n'est pas déjà couverte** par les packages existants.
- **Ne jamais créer une nouvelle entité métier sans `salonId`.** Multi-tenant par design.

---

## Comment développer une nouvelle feature

### Workflow complet (exemple : feature "Congés du staff")

**Étape 1 — Schéma**
```prisma
// apps/backend/prisma/schema.prisma
model StaffLeave {
  id        String   @id @default(uuid())
  staffId   String
  staff     Staff    @relation(fields: [staffId], references: [id], onDelete: Cascade)
  salonId   String                          // ← toujours scoper au salon
  salon     Salon    @relation(fields: [salonId], references: [id])
  startDate DateTime
  endDate   DateTime
  reason    String?
  createdAt DateTime @default(now())

  @@index([staffId])
  @@index([salonId])
  @@map("staff_leaves")
}
```
Puis : `pnpm prisma:migrate --name add-staff-leave`

**Étape 2 — Backend**

Créer dans `apps/backend/src/modules/staff/` :
- `dto/create-leave.dto.ts` — DTO avec class-validator + @ApiProperty
- Méthodes dans `staff.service.ts` : `createLeave`, `getLeaves`, `deleteLeave`
- Endpoints dans `staff.controller.ts` avec guards + `resolveSalonId`

**Étape 3 — Type partagé (si utilisé des deux côtés)**
```typescript
// packages/shared/src/types/api.types.ts
export interface StaffLeave {
  id: string;
  staffId: string;
  salonId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}
```

**Étape 4 — Frontend**

Dans `apps/frontend/src/` :
- `api/staff.api.ts` — ajouter `staffApi.getLeaves()`, `staffApi.createLeave()`
- `hooks/useApi.ts` — ajouter `useStaffLeaves(staffId)`
- Mettre à jour `pages/StaffPage.tsx` — appel via hook, affichage uniquement

**Étape 5 — IA (si besoin)**

Si l'IA doit connaître les congés :
- Ajouter un tool `getStaffLeaves` dans `modules/ai/tools/salon-tools.ts`
- Ajouter le case dans `AiService.executeTool()` qui appelle `staffService.getLeaves()`

---

## Checklist avant toute PR ou gros changement

### Sécurité
- [ ] Aucun secret, clé API, password dans le code ou les logs
- [ ] Les nouvelles routes protégées ont `JwtAuthGuard`
- [ ] Les routes admin ont `RolesGuard` + `@Roles()`
- [ ] Les endpoints listant des données salon utilisent `resolveSalonId()`
- [ ] Toute nouvelle entité a un `salonId`

### Backend
- [ ] DTOs créés pour chaque endpoint POST/PUT/PATCH avec `@ApiProperty()` sur chaque champ
- [ ] Migration Prisma créée si le schéma a changé (`pnpm prisma:migrate`)
- [ ] Index Prisma ajoutés sur les colonnes filtrées fréquemment
- [ ] Aucune logique dans les contrôleurs
- [ ] Aucun import `PrismaService` dans un contrôleur ou un guard
- [ ] Les erreurs lancées depuis les services, pas les contrôleurs
- [ ] Les services modifiés sont bien exportés dans leur module si d'autres modules en ont besoin

### Frontend
- [ ] Aucune donnée serveur dans Zustand
- [ ] Aucun appel API direct dans les composants (tout passe par les hooks)
- [ ] Types propres utilisés (pas de `Record<string, unknown>` ou `as any`)
- [ ] Aucun appel OpenAI depuis le frontend

### Couche IA
- [ ] Aucun provider concret importé dans `AiService`
- [ ] Les nouveaux tools dans `salon-tools.ts` délèguent à un service existant dans `executeTool()`
- [ ] Le prompt système ne contient pas d'informations métier hardcodées (tarifs, noms de staff, etc.)

### Général
- [ ] Pas de `console.log` oubliés
- [ ] Pas de code commenté laissé en place
- [ ] Les types partagés backend/frontend sont dans `packages/shared/`
- [ ] `TECH_DEBT.md` mis à jour si un choix temporaire a été fait consciemment

---

## Contexte FideliteProPlus

FideliteProPlus est un produit SaaS existant. Ce backend a vocation à devenir son API de gestion de salon.

**Conséquences architecturales :**
- Le backend doit rester 100% agnostique du frontend. Aucune logique de rendu, aucune dépendance à React ou à une UI spécifique.
- Les endpoints doivent être stables et versionnés. Breaking changes → `/api/v2/`.
- L'auth JWT Bearer est le seul mécanisme d'auth supporté — FideliteProPlus pourra s'y connecter en obtenant un token via `POST /auth/login`.
- Le schéma multi-tenant (`salonId` partout) est ce qui permet à FideliteProPlus de gérer plusieurs salons clients depuis un seul backend.

**Ce que tu ne dois pas faire en pensant "c'est pour ce frontend" :**
- Coupler un endpoint à la structure d'une page React
- Retourner des données formatées pour un composant spécifique
- Ajouter des endpoints "de commodité UI" qui mélangent plusieurs entités sans raison métier

---

## Références

| Document | Quand le lire |
|----------|--------------|
| `ARCHITECTURE.md` | Comprendre les flux, diagrammes, patterns |
| `PROJECT_RULES.md` | Exemples de code correct vs interdit |
| `TECH_DEBT.md` | Avant de "corriger" quelque chose d'existant |
| `CONTRIBUTING.md` | Setup dev, workflow git, conventions de commits |
| `apps/backend/prisma/schema.prisma` | Source de vérité du modèle de données |
| `apps/backend/src/modules/ai/` | Architecture complète de la couche IA |
| `apps/frontend/src/types/index.ts` | Types domaine frontend |
