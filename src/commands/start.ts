import { InlineKeyboard, type Bot } from "grammy";
import { eq } from "drizzle-orm";
import { db as defaultDb, type DbClient } from "../db/index.js";
import { users, telegramChats } from "../db/schema.js";
import type { BotContext } from "../bot.js";

const CHAT_ID_PATTERN = /^(@[A-Za-z0-9_]{5,32}|\-?\d+)$/;

export function isValidChatId(input: string): boolean {
  return CHAT_ID_PATTERN.test(input.trim());
}

export function buildChatSetupKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("✅ Confirm Chat ID", "chat:confirm")
    .row()
    .text("ℹ️ How to find your chat ID", "chat:help");
}

function buildChatHelpKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("⬅️ Back to Setup", "chat:back");
}

const CHAT_HELP_TEXT = [
  "To find your Telegram chat ID:",
  "1. Open Telegram.",
  "2. Go to your profile.",
  "3. Look for your username (e.g., @yourusername) or numeric ID.",
  "4. Enter it here to proceed.",
].join("\n");

const SETUP_PROMPT = "Please provide your Telegram chat ID (e.g., @username or numeric ID).";

const ALREADY_CONFIGURED = "✅ BTC Alert Bot is already configured and monitoring! Use /status to view your configuration or /help to see available commands.";

export function registerStartCommand(bot: Bot<BotContext>, db: DbClient = defaultDb) {
  bot.command("start", async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.reply("⚠️ Could not identify your Telegram account.");
      return;
    }

    let user = db.select().from(users).where(eq(users.telegramId, telegramId)).get();

    if (!user) {
      db.insert(users).values({ telegramId, isAdmin: false }).run();
      user = db.select().from(users).where(eq(users.telegramId, telegramId)).get();
    }

    if (!user) {
      await ctx.reply("⚠️ Failed to initialize your account. Please try again.");
      return;
    }

    ctx.session.userId = user.id;

    const chat = db.select().from(telegramChats).where(eq(telegramChats.userId, user.id)).get();

    if (chat) {
      ctx.session.chatId = chat.chatId;
      ctx.session.state = "idle";
      await ctx.reply(ALREADY_CONFIGURED);
      return;
    }

    ctx.session.state = "awaiting_chat_id";
    await ctx.reply(SETUP_PROMPT);
  });

  bot.callbackQuery("chat:confirm", async (ctx) => {
    const pendingId = ctx.session.pendingChatId;
    const userId = ctx.session.userId;

    if (!pendingId || !userId) {
      await ctx.answerCallbackQuery({ text: "❌ No chat ID to confirm. Use /start to begin setup." });
      return;
    }

    if (!isValidChatId(pendingId)) {
      await ctx.answerCallbackQuery({ text: "❌ Invalid chat ID format. Please try again." });
      return;
    }

    const existing = db.select().from(telegramChats).where(eq(telegramChats.userId, userId)).get();
    if (existing) {
      db.update(telegramChats).set({ chatId: pendingId }).where(eq(telegramChats.id, existing.id)).run();
    } else {
      db.insert(telegramChats).values({ chatId: pendingId, userId }).run();
    }

    ctx.session.chatId = pendingId;
    ctx.session.pendingChatId = undefined;
    ctx.session.state = "idle";

    await ctx.answerCallbackQuery({ text: "✅ Chat ID configured successfully!" });
    await ctx.reply("✅ Chat ID configured! Monitoring is now active.\nUse /status to view your configuration.");
  });

  bot.callbackQuery("chat:help", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(CHAT_HELP_TEXT, {
      reply_markup: buildChatHelpKeyboard(),
    });
  });

  bot.callbackQuery("chat:back", async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.state = "awaiting_chat_id";
    await ctx.reply(SETUP_PROMPT);
  });
}