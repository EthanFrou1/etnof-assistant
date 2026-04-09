# Frontend — Etnof Assistant

Interface opérateur pour les salons. React + Vite + TypeScript + Tailwind.

## Démarrage rapide

```bash
cp .env.example .env
pnpm install
pnpm dev
```

- App : http://localhost:5173
- Proxy vers le backend sur http://localhost:3001

## Scripts

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Dev avec HMR |
| `pnpm build` | Build production |
| `pnpm typecheck` | Vérification TypeScript |

## Structure

```
src/
├── api/          ← appels HTTP (axios, un fichier par domaine)
├── components/
│   └── ui/       ← composants réutilisables (shadcn/ui)
├── hooks/        ← hooks TanStack Query + logique partagée
├── layout/       ← AppLayout, Sidebar, Header
├── lib/          ← utilitaires (cn, etc.)
├── pages/        ← une page = un fichier, pas de logique métier
├── router/       ← routes React Router
├── store/        ← Zustand (auth uniquement)
└── types/        ← types locaux si non partagés
```

## Pages

| Route | Page |
|-------|------|
| `/login` | Connexion |
| `/dashboard` | Tableau de bord |
| `/agenda` | Vue agenda par jour |
| `/appointments` | Liste des rendez-vous |
| `/clients` | Gestion clients |
| `/services` | Catalogue des services |
| `/staff` | Gestion du staff |
| `/assistant` | Chat IA |
| `/settings` | Paramètres utilisateur |

## Règles

- Pas de logique métier dans les composants
- Pas d'appel API direct dans les composants — utiliser les hooks
- Pas d'appel OpenAI depuis le frontend
- Le state serveur est géré par TanStack Query
- Le state auth est géré par Zustand avec persistence localStorage
