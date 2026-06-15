# Threat Model

## Project Overview

CleanPath is a public web application that helps users track addiction recovery progress, cravings, mood, safety plans, and trusted contacts. The production stack is a React/Vite frontend deployed publicly on Replit plus a small Express API server. In the current implementation, the sensitive user journal data is stored in the browser on the user’s device rather than in a remote database.

Production assumptions for this scan:
- `NODE_ENV` is `production` in deployed environments.
- The current deployment is public.
- The mockup sandbox is development-only and should be ignored unless production reachability is demonstrated.

## Assets

- **Recovery journal data** — abstinence history, consumption logs, craving events, mood tracking, safety plans, and trusted contacts. This is highly sensitive health- and behavior-adjacent personal data.
- **Privacy controls** — the optional PIN lock and discrete mode are intended to reduce exposure of the recovery data on a shared or casually accessed device.
- **Exported data files** — JSON exports can contain the full local record set and therefore become a portable copy of the user’s sensitive history.
- **Application/runtime secrets** — standard deployment secrets such as environment variables and database credentials, even though the current shipped functionality barely uses the backend.

## Trust Boundaries

- **Browser to local device storage** — the frontend reads and writes sensitive records directly to `localStorage`. The browser UI is trusted by the user, but local storage is readable and mutable by any script executing on the origin and by anyone with access to the browser profile.
- **Browser to API server** — the deployed site can call the public Express API under `/api`. The browser is untrusted and every exposed route must tolerate arbitrary requests.
- **API server to external environment** — the server has access to runtime secrets and potentially the database package, even though the current public API surface is limited.
- **Public deployment to dev-only artifacts** — `artifacts/mockup-sandbox` is out of production scope unless routing/build configuration proves it is reachable in production.

## Scan Anchors

- Production frontend entry point: `artifacts/cleanpath/src/main.tsx` and `artifacts/cleanpath/src/App.tsx`
- Sensitive client data store: `artifacts/cleanpath/src/store/useAppStore.ts` and `artifacts/cleanpath/src/store/use-local-storage.ts`
- Privacy controls and data export: `artifacts/cleanpath/src/components/PinLock.tsx`, `artifacts/cleanpath/src/pages/SettingsPage.tsx`
- Public API entry point: `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/health.ts`
- Dev-only area to ignore unless proven reachable: `artifacts/mockup-sandbox/**`

## Threat Categories

### Spoofing

The application does not use server-backed user accounts. The closest authentication boundary is the local PIN lock that gates access to the UI on a user’s device. The project must not present a local privacy feature as meaningful access control unless the protected data is actually cryptographically protected or otherwise withheld when the PIN is unknown.

### Tampering

Because the frontend trusts data read from `localStorage`, anyone who can modify the browser profile or run script on the origin can alter records, remove the PIN, or change settings. The system must assume client-side state is attacker-controlled and avoid relying on local values as proof of identity or integrity.

### Information Disclosure

CleanPath handles highly sensitive recovery and mental-health-adjacent information. The project must avoid exposing this data through browser storage, logs, exported files, or UI privacy features that create a false sense of protection. If sensitive records remain on-device, users must not be misled about the strength of the protection boundary.

### Denial of Service

The public server routes must remain safe under arbitrary internet traffic. Any future public endpoints must enforce reasonable request bounds and avoid resource-intensive unauthenticated behavior. The current health endpoint is low risk, but this guarantee matters if the API grows.

### Elevation of Privilege

Any feature that claims to lock access to sensitive records must resist trivial bypass. A local attacker or malicious script must not be able to gain access simply by reading or editing adjacent browser storage values. Future API endpoints must also enforce authorization server-side rather than trusting the client.
