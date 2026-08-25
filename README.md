# Rappels Slack sport

Envoie automatiquement :

- **lundi 17h** (Paris) : `Yoga demain midi ?`
- **mercredi 17h** (Paris) : `Escalade demain`

Pas de serveur : **2 workflows séparés** (un par sport).

- **Yoga (lundi 17h)** → uniquement le message yoga
- **Escalade (mercredi 17h)** → uniquement le message escalade

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
3. **Actions** : lance **Yoga (lundi 17h)** ou **Escalade (mercredi 17h)** à la main pour tester (un seul message à la fois).
4. Ensuite le cron envoie yoga chaque lundi 17h, escalade chaque mercredi 17h (heure de Paris).

Le premier run programmé d’un repo peut prendre jusqu’à une heure après le push. Un run manuel marche tout de suite.

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

Ajoute le secret GitHub correspondant et un workflow (copie `yoga.yml` ou `escalade.yml`) avec le bon jour cron (`1` = lundi, `3` = mercredi, `4` = jeudi).
