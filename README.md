# Rappels Slack sport

Envoie automatiquement, **heure de Paris** (été / hiver gérés tout seuls) :

- **lundi 17h** : `Yoga demain midi ?`
- **mercredi 17h** : `Escalade demain midi ?`
- **tous les jours 14h** : `Test notif Slack` (webhook dédié, pour valider l’heure réelle)

Planifié avec **Cloud Scheduler** (Firebase Functions), pas GitHub Actions.

## 1. Créer les webhooks Slack

1. Va sur [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**.
2. **Incoming Webhooks** → Active **On**.
3. **Add New Webhook to Workspace** → choisis le channel Yoga → copie l’URL.
4. Répète pour le channel Escalade (une 2e URL).

## 2. Tester en local

```bash
cp .env.example .env.local
# colle les URLs dans .env.local
npm run send:yoga
npm run send:escalade
npm run send:test
```

Utilise **`.env.local`** en local, pas `.env` : Firebase charge `.env` comme variables d’environnement classiques, ce qui entre en conflit avec Secret Manager au deploy.

## 3. Déployer les Cloud Functions

Il faut un projet Firebase en plan **Blaze** (facturation à l’usage). Deux webhooks par semaine restent en pratique à 0 €.

```bash
npm install
firebase use --add   # si le projet n’est pas déjà sélectionné
```

Enregistre les webhooks dans Secret Manager :

```bash
firebase functions:secrets:set SLACK_WEBHOOK_YOGA
firebase functions:secrets:set SLACK_WEBHOOK_ESCALADE
firebase functions:secrets:set SLACK_WEBHOOK_TEST
```

Puis :

```bash
npm run deploy
```

L’heure part de `activities.json` (`hour` / `minute` / `weekday`) avec le fuseau `Europe/Paris`. Pour tester tout de suite sans attendre le cron : **Google Cloud Console → Cloud Scheduler → Run now** sur le job `yoga` ou `escalade`.

## Ajouter un sport

Édite `activities.json` :

```json
{
  "id": "course",
  "weekday": 4,
  "hour": 17,
  "minute": 0,
  "message": "Course demain matin ?",
  "webhookEnv": "SLACK_WEBHOOK_COURSE"
}
```

`weekday` : 0 = dimanche, 1 = lundi, …, 6 = samedi.

Ensuite :

```bash
firebase functions:secrets:set SLACK_WEBHOOK_COURSE
npm run deploy
```
