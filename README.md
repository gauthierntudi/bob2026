# Best of the Best 2026 — votes

Vote du public (40 %) et notation du jury (60 %) pour Vodacom Best of the Best.

## Calcul

- Public : une personne, un vote. La note publique d’un candidat est sa part des votes, de 0 à 100.
- Jury : chaque juré note quatre critères de 0 à 100 %. Les poids indiqués sont 20 / 20 / 20 / 20. Ils sont ramenés à 100 % de la note jury (25 % chacun), puis cette note pèse 60 % du total.
- Note finale = `0,40 × note public + 0,60 × moyenne des fiches jury`.

## Démarrage local

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run dev
```

Renseigne dans `.env` le compte, le jeton API et l’identifiant D1. En local, l’identifiant déjà présent suffit. Avant un déploiement, remplace `CLOUDFLARE_D1_DATABASE_ID` par l’UUID du dashboard : `npm run dev` et les migrations le recopient dans `wrangler.jsonc`.

Mot de passe régie local : `bob-admin` (dans `.env`).

- `/` vote du public
- `/jury` notation, avec le code créé en régie
- `/resultats` classement
- `/admin` candidats, jurés, ouverture des votes

## Base D1

Le binding s’appelle `DB`. En local, Wrangler stocke SQLite dans `.wrangler`.

Avant le premier déploiement :

```bash
npx wrangler d1 create bob-votes
```

Copiez l’identifiant dans `.env` (`CLOUDFLARE_D1_DATABASE_ID`), puis :

```bash
npm run db:migrate:remote
npm run deploy
```

Ajoutez `ADMIN_PASSWORD` et `SESSION_SECRET` comme secrets du Worker :

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
```
