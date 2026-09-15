#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const ACTIVITIES_PATH = path.join(ROOT, "activities.json");

loadDotEnv(path.join(ROOT, ".env"));
loadDotEnv(path.join(ROOT, ".env.local"));

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function parseArgs(argv) {
  const args = { activity: process.env.ACTIVITY || "" };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--activity" && argv[i + 1]) {
      args.activity = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function loadActivities() {
  return JSON.parse(fs.readFileSync(ACTIVITIES_PATH, "utf8"));
}

function selectActivity(activities, { activity }) {
  if (!activity) {
    throw new Error(`Passe --activity ${activities.map((item) => item.id).join("|")}`);
  }

  const match = activities.find((item) => item.id === activity);
  if (!match) {
    throw new Error(`Activité inconnue: ${activity}. Ids: ${activities.map((item) => item.id).join(", ")}`);
  }

  return match;
}

async function postToSlack(activity) {
  const webhookUrl = process.env[activity.webhookEnv];
  if (!webhookUrl) {
    throw new Error(`Secret manquant: ${activity.webhookEnv} (activité ${activity.id})`);
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: activity.message }),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Slack a refusé ${activity.id}: ${response.status} ${body}`);
  }
}

async function sendActivity(activityId) {
  const activity = selectActivity(loadActivities(), { activity: activityId });
  await postToSlack(activity);
  console.log(`Envoyé: ${activity.id} — ${activity.message}`);
  return activity;
}

async function main() {
  await sendActivity(parseArgs(process.argv.slice(2)).activity);
}

module.exports = { sendActivity, postToSlack, loadActivities, selectActivity };

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

