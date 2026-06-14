import { type Api } from "grammy";
import { fetchBtcPrice, CoinGeckoError } from "./api/coingecko.js";
import { db as defaultDb, type DbClient } from "./db/index.js";
import { priceRecords, users, telegramChats } from "./db/schema.js";
import { desc } from "drizzle-orm";
import { saveAlertToDb, sendAlertMessage } from "./alert.js";

const POLL_INTERVAL_MS = 5 * 60 * 1000;
const ALERT_THRESHOLD_PERCENT = 10;

export interface AlertParams {
  percentageChange: number;
  currentPrice: number;
  referencePrice: number;
  priceRecordId: number;
}

export type AlertCallback = (params: AlertParams) => Promise<void>;

function getOrCreateSystemUser(database: DbClient): { id: number } {
  const [existing] = database.select().from(users).limit(1).all();
  if (existing) return existing;
  database.insert(users).values({ telegramId: 0, isAdmin: true }).run();
  return database.select().from(users).limit(1).all()[0]!;
}

export function startPriceMonitoring(
  api: Api,
  database: DbClient = defaultDb,
  onAlert?: AlertCallback,
) {
  const user = getOrCreateSystemUser(database);

  const poll = async () => {
    try {
      const currentPrice = await fetchBtcPrice();

      const [latestRecord] = database
        .select()
        .from(priceRecords)
        .orderBy(desc(priceRecords.timestamp))
        .limit(1)
        .all();

      const referencePrice = latestRecord?.price ?? currentPrice;
      const percentageChange =
        ((currentPrice - referencePrice) / referencePrice) * 100;

      const now = new Date().toISOString();
      const result = database.insert(priceRecords).values({
        price: currentPrice,
        timestamp: now,
        userId: user.id,
      }).run();

      const priceRecordId = Number(result.lastInsertRowid);

      if (Math.abs(percentageChange) >= ALERT_THRESHOLD_PERCENT) {
        const params: AlertParams = {
          percentageChange,
          currentPrice,
          referencePrice,
          priceRecordId,
        };

        if (onAlert) {
          const [chatRecord] = database
            .select()
            .from(telegramChats)
            .limit(1)
            .all();

          if (chatRecord) {
            saveAlertToDb(database, {
              percentageChange,
              currentPrice,
              priceRecordId,
              chatRecordId: chatRecord.id,
            });
          }
          await onAlert(params);
        } else {
          const [chatRecord] = database
            .select()
            .from(telegramChats)
            .limit(1)
            .all();

          if (chatRecord) {
            await sendAlertMessage(api, database, {
              percentageChange,
              currentPrice,
              priceRecordId,
              chatRecordId: chatRecord.id,
              chatId: chatRecord.chatId,
            });
          }
        }
      }
    } catch (err) {
      if (err instanceof CoinGeckoError) {
        console.error(`[monitor] CoinGecko error (${err.code}):`, err.message);
      } else {
        console.error("[monitor] Unexpected error:", err);
      }
    }
  };

  void poll();

  const timer = setInterval(poll, POLL_INTERVAL_MS);

  return {
    stop: () => clearInterval(timer),
  };
}