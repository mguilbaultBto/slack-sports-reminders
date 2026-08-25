# Rappels Slack sport

Envoie automatiquement :

- **lundi 17h** (Paris) : `Yoga demain midi ?`
- **mercredi 17h** (Paris) : `Escalade demain`

Pas de serveur : un cron GitHub Actions poste via des Incoming Webhooks Slack.

## 1. Créer les webhooks Slack

1. Va sur [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**.
2. **Incoming Webhooks** → Active **On**.
3. **Add New Webhook to Workspace** → choisis le channel Yoga → copie l’URL.
4. Répète pour le channel Escalade (une 2e URL).

## 2. Tester en local

```bash
cp .env.example .env
# colle les 2 URLs dans .env
npm run send:yoga
npm run send:escalade
```

## 3. Activer le cron GitHub

1. Pousse ce repo sur GitHub.
2. **Settings → Secrets and variables → Actions** :
   - `SLACK_WEBHOOK_YOGA`
   - `SLACK_WEBHOOK_ESCALADE`
3. **Actions → Remind sport → Run workflow** pour tester tout de suite.
4. Le cron tourne lundi et mercredi vers 17h Paris (gère l’heure d’été / hiver).

Le premier run programmé d’un repo peut prendre jusqu’à une heure après le push. Un run manuel (`workflow_dispatch`) marche tout de suite.

## Ajouter un sport

Édite `activities.json` :

```json
{
  "id": "course",
  "weekday": 4,
  "hour": 17,
  "message": "Course demain matin ?",
  "webhookEnv": "SLACK_WEBHOOK_COURSE"
}
```

`weekday` : 0 = dimanche, 1 = lundi, …, 6 = samedi.

Ajoute le secret GitHub correspondant et, si le jour n’est pas lundi/mercredi, élargis le cron dans `.github/workflows/remind.yml`.
