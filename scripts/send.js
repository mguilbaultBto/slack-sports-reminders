#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const ACTIVITIES_PATH = path.join(ROOT, "activities.json");
const TIMEZONE = "Europe/Paris";

loadDotEnv(path.join(ROOT, ".env"));

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

function parisNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);

  const weekdayLabel = parts.find((part) => part.type === "weekday")?.value;
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  return { weekday: weekdayMap[weekdayLabel], hour };
}

function loadActivities() {
  return JSON.parse(fs.readFileSync(ACTIVITIES_PATH, "utf8"));
}

function selectActivities(activities, { activity }) {
  if (activity) {
    const match = activities.find((item) => item.id === activity);
    if (!match) {
      throw new Error(`Activité inconnue: ${activity}. Ids: ${activities.map((item) => item.id).join(", ")}`);
    }
    return [match];
  }

  if (process.env.GITHUB_EVENT_NAME === "workflow_dispatch") {
    return activities;
  }

  const now = parisNow();
  return activities.filter((item) => item.weekday === now.weekday && item.hour === now.hour);
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

async function main() {
  const activities = selectActivities(loadActivities(), parseArgs(process.argv.slice(2)));

  if (activities.length === 0) {
    const now = parisNow();
    console.log(`Rien à envoyer (Paris: jour=${now.weekday}, heure=${now.hour}).`);
    return;
  }

  for (const activity of activities) {
    await postToSlack(activity);
    console.log(`Envoyé: ${activity.id} — ${activity.message}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
