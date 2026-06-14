import { and, eq, gte } from "drizzle-orm";
import { db } from "./db/index.js";
import { alerts } from "./db/schema.js";

export interface AlertHistoryEntry {
  id: number;
  percentageChange: number;
  price: number;
  timestamp: string;
}

export function getRecentAlerts(
  chatId: number,
  days = 7,
): AlertHistoryEntry[] {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString();

  return db
    .select({
      id: alerts.id,
      percentageChange: alerts.percentageChange,
      price: alerts.price,
      timestamp: alerts.timestamp,
    })
    .from(alerts)
    .where(
      and(
        eq(alerts.chatId, chatId),
        gte(alerts.timestamp, sinceIso),
      ),
    )
    .all();
}

function formatChange(percentage: number): string {
  const sign = percentage >= 0 ? "+" : "";
  return `${sign}${percentage.toFixed(1)}%`;
}

export function formatAlertHistory(
  entries: AlertHistoryEntry[],
): string {
  if (entries.length === 0) {
    return "📭 No alerts in the last 7 days.";
  }

  const lines = entries.map((entry, i) => {
    const time = entry.timestamp.replace("T", " ").slice(0, 19);
    const change = formatChange(entry.percentageChange);
    const price = `$${entry.price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    return `${i + 1}. ${time}: ${change} → ${price}`;
  });

  return `🗓️ Alert History (Last 7 Days):\n${lines.join("\n")}`;
}
