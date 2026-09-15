const { initializeApp } = require("firebase-admin/app");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const { sendActivity } = require("../scripts/send");
const activities = require("../activities.json");

initializeApp();

const TIME_ZONE = "Europe/Paris";
const REGION = "europe-west1";

const secretsByName = {};
for (const activity of activities) {
  if (!secretsByName[activity.webhookEnv]) {
    secretsByName[activity.webhookEnv] = defineSecret(activity.webhookEnv);
  }
}

function cronFor(activity) {
  const minute = activity.minute ?? 0;
  const weekday = activity.weekday ?? "*";
  return `${minute} ${activity.hour} * * ${weekday}`;
}

function scheduleActivity(activity) {
  return onSchedule(
    {
      schedule: cronFor(activity),
      timeZone: TIME_ZONE,
      region: REGION,
      secrets: [secretsByName[activity.webhookEnv]],
      retryCount: 0,
      timeoutSeconds: 60,
    },
    async () => {
      await sendActivity(activity.id);
    },
  );
}

for (const activity of activities) {
  exports[activity.id] = scheduleActivity(activity);
}
