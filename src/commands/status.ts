import type { Bot } from "grammy";
import { InlineKeyboard } from "grammy";
import { db as defaultDb, type DbClient } from "../db/index.js";
import { priceRecords, telegramChats } from "../db/schema.js";
import { desc } from "drizzle-orm";
import type { BotContext } from "../bot.js";

function buildStatusKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("🔄 Refresh Status", "status:refresh")
    .row()
    .text("⚙️ Reconfigure Chat", "status:reconfigure")
    .row()
    .text("📜 View Alert History", "status:history");
}

function formatStatusMessage(params: {
  referencePrice: number | null;
  chatId: string | null;
}): string {
  const refPrice = params.referencePrice !== null
    ? `$${params.referencePrice.toLocaleString("en-US")}`
    : "N/A";
  const chat = params.chatId ?? "Not configured";
  return [
    "📊 Current Configuration:",
    `- Reference Price: ${refPrice}`,
    `- Chat ID: ${chat}`,
    "- Threshold: 10%",
    "- API: CoinGecko (active)",
  ].join("\n");
}

export function registerStatusCommand(bot: Bot<BotContext>, db: DbClient = defaultDb) {
  bot.command("status", async (ctx) => {
    const [latestPrice] = await db
      .select()
      .from(priceRecords)
      .orderBy(desc(priceRecords.timestamp))
      .limit(1);

    const [chat] = await db
      .select()
      .from(telegramChats)
      .limit(1);

    const message = formatStatusMessage({
      referencePrice: latestPrice?.price ?? null,
      chatId: chat?.chatId ?? null,
    });

    await ctx.reply(message, {
      reply_markup: buildStatusKeyboard(),
    });
  });
}
