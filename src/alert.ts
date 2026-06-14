import { type Api } from "grammy";
import { type DbClient } from "./db/index.js";
import { alerts } from "./db/schema.js";

export function formatAlertMessage(
  directionEmoji: string,
  direction: string,
  absChange: number,
  price: number,
): string {
  const formatted = `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `${directionEmoji} Bitcoin price ${direction}${absChange.toFixed(1)}%! Current price: ${formatted}`;
}

export function saveAlertToDb(
  database: DbClient,
  params: {
    percentageChange: number;
    currentPrice: number;
    priceRecordId: number;
    chatRecordId: number;
  },
): void {
  database.insert(alerts).values({
    percentageChange: params.percentageChange,
    price: params.currentPrice,
    timestamp: new Date().toISOString(),
    priceRecordId: params.priceRecordId,
    chatId: params.chatRecordId,
  }).run();
}

export async function sendAlertMessage(
  api: Api,
  database: DbClient,
  params: {
    percentageChange: number;
    currentPrice: number;
    priceRecordId: number;
    chatRecordId: number;
    chatId: string;
  },
): Promise<void> {
  const isUp = params.percentageChange >= 0;
  const message = formatAlertMessage(
    isUp ? "🚀" : "⚠️",
    isUp ? "increased by +" : "decreased by -",
    Math.abs(params.percentageChange),
    params.currentPrice,
  );

  saveAlertToDb(database, {
    percentageChange: params.percentageChange,
    currentPrice: params.currentPrice,
    priceRecordId: params.priceRecordId,
    chatRecordId: params.chatRecordId,
  });

  await api.sendMessage(params.chatId, message, { parse_mode: "HTML" });
}