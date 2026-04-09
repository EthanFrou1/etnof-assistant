# Architecture — Etnof Assistant

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENTS                            │
│  React App (frontend)  │  FideliteProPlus  │  Mobile    │
└───────────┬────────────┴──────────┬────────┴────────────┘
            │                       │
            │     HTTP REST API     │
            │     JWT Bearer        │
            ▼                       ▼
┌───────────────────────────────────────────────────────┐
│                  NestJS Backend (API)                  │
│                                                       │
│  ┌──────────┐  ┌────────┐  ┌──────────┐  ┌────────┐  │
│  │   Auth   │  │ Salons │  │   Staff  │  │  Appts │  │
│  └──────────┘  └────────┘  └──────────┘  └────────┘  │
│  ┌──────────┐  ┌─────────┐ ┌──────────┐              │
│  │ Services │  │ Clients │ │    AI    │              │
│  └──────────┘  └─────────┘ └──────────┘              │
│                               │                       │
│                    ┌──────────▼─────────┐             │
│                    │  AI Orchestrator   │             │
│                    │  (agentic loop)    │             │
│                    └──────────┬─────────┘             │
│                               │                       │
│              ┌────────────────┼───────────────┐       │
│              ▼                ▼               ▼       │
│       ┌──────────┐    ┌──────────┐    ┌──────────┐   │
│       │ OpenAI   │    │ Google   │    │ Future   │   │
│       │ Provider │    │ Provider │    │ Provider │   │
│       └──────────┘    └──────────┘    └──────────┘   │
└───────────────────────────┬───────────────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  PostgreSQL  │
                    │   (Prisma)   │
                    └──────────────┘
```

---

## Flux d'une requête IA

```
Frontend AssistantPage
    → POST /api/v1/ai/chat { salonId, messages }
        → AiController.chat()
            → AiService.chat()
                → buildSystemPrompt(salonName, currentDate)
                → IAIProvider.complete({ messages, tools: SALON_TOOLS })
                    → OpenAI API
                        ← { toolCalls: [{ name: "getAvailabilities", args: {...} }] }
                → AiService.executeTool("getAvailabilities")
                    → StaffService.getAvailability(staffId, date)
                        → PrismaService (DB)
                → IAIProvider.complete({ messages + tool result })
                    → OpenAI API
                        ← { content: "Voici les disponibilités..." }
        ← { success: true, data: { content: "..." } }
    → Affiche le message dans le chat
```

---

## Multi-tenant

Chaque entité métier est scopée à un `salonId` :

```
Salon ──┬── Users
        ├── Staff ──── StaffAvailability
        │         └── StaffService
        ├── Services
        ├── Clients
        ├── Appointments ──── AppointmentServices
        └── AiConfig
```

**Règle :** Tout appel service qui lit/écrit des données métier doit recevoir un `salonId` et filtrer dessus. Ne jamais retourner des données cross-salon.

---

## Sécurité

- Toutes les routes (sauf `/auth/login`, `/auth/register`, `/health`) sont protégées par `JwtAuthGuard`
- Les routes sensibles (création salon, gestion users) sont en plus protégées par `RolesGuard`
- Les refresh tokens sont en base de données — révocables individuellement
- Les passwords sont hashés avec bcrypt (salt rounds = 10)
- La validation des entrées est assurée par `ValidationPipe` global avec `whitelist: true`

---

## Conventions de modules NestJS

```
modules/example/
├── dto/
│   ├── create-example.dto.ts    ← validation entrante
│   └── update-example.dto.ts
├── example.module.ts            ← imports, providers, exports
├── example.service.ts           ← toute la logique
└── example.controller.ts        ← routing uniquement
```

**Règle :** Jamais de logique dans le contrôleur. Il reçoit, il délègue, il retourne.

---

## Gestion des erreurs

Toutes les erreurs HTTP passent par `HttpExceptionFilter` qui formate :

```json
{
  "success": false,
  "statusCode": 404,
  "timestamp": "2025-06-10T10:00:00.000Z",
  "path": "/api/v1/clients/abc",
  "message": "Client not found"
}
```

Toutes les réponses succès passent par `TransformInterceptor` :

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-06-10T10:00:00.000Z"
}
```

---

## Isolation multi-tenant

Tous les endpoints scoped salon utilisent `resolveSalonId()` (`common/utils/resolve-salon-id.ts`) :

```
Request (JWT user + optional salonId param)
    → resolveSalonId(user, querySalonId)
        SUPER_ADMIN  → utilise querySalonId (obligatoire)
        Autres rôles → utilise user.salonId du JWT
                       si querySalonId ≠ user.salonId → ForbiddenException
```

Cette fonction est appelée dans chaque contrôleur qui liste ou crée des entités scopées salon. Le `salonId` ne vient jamais aveuglément du body/query pour les utilisateurs non-admin.

---

## Ajout d'un provider IA (exemple : Google Gemini)

1. Créer `src/modules/ai/providers/google.provider.ts` :

```typescript
import { Injectable } from '@nestjs/common';
import { IAIProvider, AiCompletionRequest, AiCompletionResponse } from './ai-provider.interface';

@Injectable()
export class GoogleProvider implements IAIProvider {

  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    // Appel API Google Gemini
    // Mapper vers AiCompletionResponse
  }
}
```

2. Enregistrer dans `ai.module.ts` — uniquement dans la factory, sans toucher `AiService` :
```typescript
providers: [
  OpenAIProvider,
  GoogleProvider,
  {
    provide: AI_PROVIDER_TOKEN,
    useFactory: (config, openai, google) => {
      switch (config.get('ai.provider')) {
        case 'google': return google;
        default: return openai;
      }
    },
    inject: [ConfigService, OpenAIProvider, GoogleProvider],
  },
  AiService,
],
```

3. Mettre `.env` :
```
AI_PROVIDER=google
```

`AiService` n'importe aucun provider concret. Il reçoit un `IAIProvider` via `@Inject(AI_PROVIDER_TOKEN)`. C'est la factory dans `ai.module.ts` qui fait la résolution — un seul endroit à modifier.
