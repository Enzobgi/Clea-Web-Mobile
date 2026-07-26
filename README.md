# CleanPath

CleanPath est une application web d'accompagnement à la prévention, à la réduction des risques, à l'arrêt de consommation et à la prévention des rechutes. Elle ne pose pas de diagnostic et ne remplace ni un professionnel de santé ni les services d'urgence.

## Architecture

- `artifacts/cleanpath`: interface React 19, TypeScript, Vite, Tailwind CSS et composants Radix.
- `artifacts/api-server`: API Express, authentification par cookie sécurisé et distribution du frontend en production.
- `lib/db`: accès PostgreSQL avec Drizzle.
- `artifacts/cleanpath/src/store`: état local, synchronisation par compte et coffre chiffré par PIN.
- `artifacts/cleanpath/src/content`: contenus configurables, dont les parcours guidés.
- `artifacts/cleanpath/src/types`: modèles métier partagés côté interface.

Les données applicatives sont regroupées dans un document JSON par utilisateur. Cette structure permet d'ajouter des catégories sans migration SQL, mais toute nouvelle catégorie doit aussi être déclarée dans le store, le coffre et l'export.

## Navigation

L'expérience principale comporte six sections:

1. Aujourd'hui
2. Journal
3. SOS
4. Parcours
5. Chat
6. Profil

Les anciennes fonctions restent accessibles depuis les hubs Journal et Profil.

## Développement

Prérequis: Node.js et pnpm.

```bash
pnpm install
pnpm run dev:api
pnpm run dev:web
```

L'interface est disponible sur `http://localhost:5173` et l'API sur `http://localhost:5000`.

## Variables d'environnement

Copier `.env.example` et renseigner:

- `DATABASE_URL`: connexion PostgreSQL.
- `APP_ORIGIN`: origine publique de l'application.
- `CORS_ORIGIN`: origine autorisée par l'API.
- `PORT`: port local de l'API.
- `GEMINI_API_KEY`: clé Gemini utilisée par le chat IA.
- `GEMINI_MODEL`: modèle Gemini, par défaut `gemini-2.5-flash`.
- `PASSWORD_RESET_BASE_URL`: base prévue pour les futurs liens de réinitialisation.

Aucun secret ne doit être placé dans le frontend.

## Migrations de données

Les migrations SQL sont idempotentes dans `lib/db/src/index.ts`:

- ajout de `users.email_verified_at`;
- ajout de `auth_sessions.user_agent` et `auth_sessions.last_seen_at`;
- création de `password_reset_tokens`;
- création de `login_attempts`.

Les nouvelles données métier restent dans le document JSON utilisateur:

- `substanceTrackings`;
- `plannedCheckIns`;
- `careAppointments`;
- champs enrichis du journal de consommation.

La réinitialisation de mot de passe dispose des tables et endpoints, mais l'envoi réel d'email reste à brancher sur un fournisseur dédié avant usage public complet.

## Vérification

```bash
pnpm run typecheck
pnpm run build:production
```

Le dépôt ne possède pas encore de configuration de lint ni de suite de tests automatisés complète. Les vérifications disponibles restent le typecheck et le build de production.

## Contenus

Les parcours sont définis dans `artifacts/cleanpath/src/content/programs.ts`. Un parcours contient un identifiant stable, une introduction et des étapes courtes. De nouveaux parcours peuvent être ajoutés dans ce fichier sans modifier les écrans.

## Confidentialité

- synchronisation isolée par compte;
- stockage local de secours;
- coffre AES-GCM protégé par PIN;
- export JSON;
- mémoire du chat désactivée par défaut;
- aucune publicité ciblée ni tracker publicitaire;
- chatbot local structuré, sans envoi à une API d'IA externe.

## PWA

Le manifest et le service worker rendent l'application installable. Le shell, les pages déjà consultées et les outils essentiels peuvent rester disponibles hors connexion. La synchronisation distante reprend lorsque la connexion revient.
