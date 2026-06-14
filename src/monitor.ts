import { type Api } from "grammy";
import { fetchBtcPrice, CoinGeckoError } from "./api/coingecko.js";
import { withRetry, createCooldownState, recordSuccess, recordFailure } from "./api/retry.js";
import { db as defaultDb, type DbClient } from "./db/index.js";
import { priceRecords, users, telegramChats } from "./db/schema.js";
import { desc } from "drizzle-orm";
import { saveAlertToDb, sendAlertMessage } from "./alert.js";

const POLL_INTERVAL_MS = 5 * 60 * 1000;
const MAX_POLL_INTERVAL_MS = 30 * 60 * 1000;
const ALERT_THRESHOLD_PERCENT = 10;
const MAX_RETRIES = 3;

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
  const cooldown = createCooldownState(POLL_INTERVAL_MS, MAX_POLL_INTERVAL_MS);

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const poll = async () => {
    try {
      const currentPrice = await withRetry(() => fetchBtcPrice(), {
        maxRetries: MAX_RETRIES,
        onRetry: (attempt, err) => {
          const msg =
            err instanceof CoinGeckoError
              ? `CoinGecko error (${err.code}): ${err.message}`
              : `Unexpected error: ${err}`;
          console.error(`[monitor] Retry ${attempt}/${MAX_RETRIES}:`, msg);
        },
      });

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

      recordSuccess(cooldown);
    } catch (err) {
      const newInterval = recordFailure(cooldown);
      if (err instanceof CoinGeckoError) {
        console.error(
          `[monitor] CoinGecko error (${err.code}) after ${MAX_RETRIES} retries:`,
          err.message,
        );
      } else {
        console.error("[monitor] Unexpected error after retries:", err);
      }
      console.error(
        `[monitor] ${cooldown.consecutiveFailures} consecutive failure(s). Next poll in ${Math.round(newInterval / 1000)}s.`,
      );
    }

    timeoutId = setTimeout(poll, cooldown.currentIntervalMs);
  };

  void poll();

  return {
    stop: () => {
      if (timeoutId) clearTimeout(timeoutId);
    },
  };
}