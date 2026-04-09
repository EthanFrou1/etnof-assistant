# Tech Debt — Etnof Assistant

Liste des choix délibérément temporaires ou des lacunes connues.
Chaque entrée a une priorité et un impact estimé.

---

## Sécurité

### TD-01 — Inscription ouverte sans invitation
**Priorité : HAUTE**
`POST /api/v1/auth/register` est accessible sans authentification. N'importe qui peut créer un compte.
Pour un produit B2B salon, l'inscription devrait être :
- soit réservée au `SUPER_ADMIN` (création manuelle des comptes)
- soit protégée par un token d'invitation

**Fix suggéré :** Ajouter un guard `AdminOnly` ou un système `InviteToken` avant la mise en production.

---

### TD-02 — Pas de rate limiting
**Priorité : HAUTE**
Les endpoints `POST /auth/login` et `POST /auth/refresh` peuvent être brute-forcés.

**Fix suggéré :** Ajouter `@nestjs/throttler` avec des limites par IP sur les routes auth.
```bash
pnpm add @nestjs/throttler
```
Configurer dans `AppModule` : `ThrottlerModule.forRoot([{ ttl: 60, limit: 10 }])`.

---

### TD-03 — Pas de nettoyage des refresh tokens expirés
**Priorité : MOYENNE**
Les `RefreshToken` expirés restent en base indéfiniment. Avec le temps, la table grossit.

**Fix suggéré :** Cron job (ou batch au login) pour `deleteMany({ where: { expiresAt: { lt: new Date() } } })`.

---

## Dates et timezone

### TD-04 — Requêtes de date timezone-naïves
**Priorité : MOYENNE**
Les filtres de date utilisent `new Date('2025-06-10T00:00:00.000Z')` en UTC.
Pour un salon en `Europe/Paris` (UTC+2), les RDV de 00h00 à 01h59 le lendemain matin apparaissent dans la mauvaise journée.

**Fix suggéré :** Utiliser `date-fns-tz` pour convertir les dates dans le timezone du salon avant de construire les filtres Prisma. Nécessite de passer le timezone du salon dans les méthodes de service concernées.

```bash
pnpm add date-fns-tz
```

---

### TD-05 — `StaffAvailability.startTime/endTime` stockées en string `HH:mm`
**Priorité : FAIBLE**
Les créneaux de disponibilité (`09:00`, `18:30`) sont des strings. Comparaison et calcul arithmétique en string sont fragiles.

**Fix suggéré :** Stocker en minutes depuis minuit (Int) ou utiliser un type `Time` si PostgreSQL le supporte bien avec Prisma.

---

## Architecture IA

### TD-06 — Pas de persistance de session de conversation
**Priorité : MOYENNE**
Chaque appel `POST /ai/chat` envoie l'intégralité de l'historique dans le body. Pas de session serveur.
Pour des conversations longues, cela devient coûteux en tokens et fragile côté client.

**Fix suggéré :** Ajouter un modèle `ConversationSession` en DB avec l'historique sérialisé. Générer un `sessionId` côté serveur. Le client n'envoie que `sessionId` + le dernier message.

---

### TD-07 — Validation des arguments des tool calls non typée
**Priorité : FAIBLE**
Les `args` des tool calls sont parsés avec `JSON.parse()` sans validation de schema. L'IA peut théoriquement passer des arguments inattendus.

**Fix suggéré :** Valider les args avec Zod avant de les passer aux services.

---

## Frontend

### TD-08 — `@etnof/shared` non connecté au frontend
**Priorité : FAIBLE**
Le package `packages/shared` contient les types partagés mais le frontend utilise ses propres types dans `src/types/index.ts`. Les deux doivent rester synchronisés manuellement.

**Fix :** Configurer le `tsconfig.json` du frontend pour résoudre `@etnof/shared` via le workspace pnpm, ou ajouter `"@etnof/shared": "workspace:*"` dans les dépendances frontend.

---

### TD-09 — Pas de gestion d'erreur globale frontend
**Priorité : MOYENNE**
Les erreurs API ne sont pas gérées de façon cohérente. Chaque composant gère (ou ignore) ses erreurs de façon ad hoc.

**Fix suggéré :** Ajouter un `ErrorBoundary` React + un `onError` global dans le `QueryClient` pour afficher des toasts d'erreur.

---

### TD-10 — Pas de composant Toast/notification
**Priorité : FAIBLE**
Les actions (créer, annuler un RDV) n'ont pas de feedback visuel de succès ou d'erreur. `@radix-ui/react-toast` est déjà en dépendance mais pas utilisé.

**Fix :** Implémenter un `ToastProvider` et l'utiliser dans les mutations TanStack Query.

---

## Infrastructure

### TD-11 — Docker Compose sans volume nommé pour les données dev
**Priorité : FAIBLE**
Les volumes `postgres_data` et `redis_data` sont nommés mais pas configurés en mode dev persistant. Un `docker compose down -v` efface les données.

**Note :** Comportement voulu pour les resets de dev. À documenter explicitement.

---

### TD-12 — Pas de CI/CD configuré
**Priorité : MOYENNE**
Aucun pipeline GitHub Actions / GitLab CI. Sans CI, les régressions ne sont pas détectées automatiquement.

**Fix suggéré :** Pipeline minimal :
1. `pnpm install`
2. `pnpm typecheck`
3. `pnpm lint`
4. `pnpm test`
5. `pnpm build`

---

## Suivi

| ID | Titre | Priorité | Sprint cible |
|----|-------|----------|-------------|
| TD-01 | Inscription ouverte | HAUTE | Avant prod |
| TD-02 | Rate limiting | HAUTE | Avant prod |
| TD-03 | Cleanup refresh tokens | MOYENNE | Phase 2 |
| TD-04 | Timezone-naïf | MOYENNE | Phase 2 |
| TD-06 | Session IA persistante | MOYENNE | Phase 3 |
| TD-09 | Error handling frontend | MOYENNE | Phase 2 |
| TD-12 | CI/CD | MOYENNE | Phase 1 fin |
| TD-05 | StaffAvailability format | FAIBLE | Phase 3 |
| TD-07 | Tool call validation | FAIBLE | Phase 3 |
| TD-08 | @etnof/shared non branché | FAIBLE | Phase 2 |
| TD-10 | Toast notifications | FAIBLE | Phase 2 |
| TD-11 | Docker volumes | FAIBLE | — |
