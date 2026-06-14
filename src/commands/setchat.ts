import type { Bot } from "grammy";
import { eq } from "drizzle-orm";
import { db as defaultDb, type DbClient } from "../db/index.js";
import { users, telegramChats } from "../db/schema.js";
import type { BotContext } from "../bot.js";

const CHAT_ID_PATTERN = /^(@[A-Za-z0-9_]{5,32}|\-?\d+)$/;

function isValidChatId(input: string): boolean {
  return CHAT_ID_PATTERN.test(input.trim());
}

export function registerSetChatCommand(bot: Bot<BotContext>, db: DbClient = defaultDb) {
  bot.command("setchat", async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.reply("⚠️ Could not identify your Telegram account.");
      return;
    }

    const user = db.select().from(users).where(eq(users.telegramId, telegramId)).get();

    if (!user || !user.isAdmin) {
      await ctx.reply("🚫 You don't have permission to configure this bot.");
      return;
    }

    const arg = ctx.match?.trim() ?? "";

    if (!arg) {
      await ctx.reply(
        "Usage: /setchat <chat_id>\nProvide the Telegram chat ID (e.g., @username or numeric ID).",
      );
      return;
    }

    if (!isValidChatId(arg)) {
      await ctx.reply("❌ Invalid Telegram chat ID format. Please use @username or numeric ID.");
      return;
    }

    const existingChat = db.select().from(telegramChats).where(eq(telegramChats.userId, user.id)).get();

    if (existingChat) {
      db.update(telegramChats).set({ chatId: arg }).where(eq(telegramChats.id, existingChat.id)).run();
    } else {
      db.insert(telegramChats).values({ chatId: arg, userId: user.id }).run();
    }

    ctx.session.chatId = arg;

    await ctx.reply(`✅ Chat ID set to \`${arg}\` for alert delivery.`);
  });
}