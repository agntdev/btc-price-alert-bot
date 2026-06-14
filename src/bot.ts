import { Bot, session, type Context, type SessionFlavor } from "grammy";
import type { DbClient } from "./db/index.js";
import { registerStartCommand, isValidChatId, buildChatSetupKeyboard } from "./commands/start.js";
import { registerStatusCommand } from "./commands/status.js";
import { registerPriceCommand } from "./commands/price.js";
import { registerSetChatCommand } from "./commands/setchat.js";
import { sendMessage } from "./sender.js";

export interface SessionData {
  userId?: number;
  chatId?: string;
  state?: "idle" | "awaiting_chat_id";
  pendingChatId?: string;
}

export type BotContext = Context & SessionFlavor<SessionData>;

const HELP_TEXT = [
  "<b>Available commands:</b>",
  "/start – Initialize bot setup",
  "/status – View current configuration",
  "/history – View alert history",
  "/help – Show this help message",
  "/setchat – Set Telegram chat ID (admin)",
  "/price – Fetch current BTC price",
].join("\n");

export function createBot(token: string, db: DbClient) {
  const bot = new Bot<BotContext>(token);

  bot.use(
    session({
      initial: (): SessionData => ({}),
    }),
  );

  bot.command("help", async (ctx) => {
    await ctx.reply(HELP_TEXT, { parse_mode: "HTML" });
  });

  registerStartCommand(bot, db);
  registerStatusCommand(bot, db);
  registerPriceCommand(bot);
  registerSetChatCommand(bot, db);

  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text;

    if (ctx.session.state === "awaiting_chat_id") {
      const trimmed = text.trim();
      if (isValidChatId(trimmed)) {
        ctx.session.pendingChatId = trimmed;
        await ctx.reply(`Chat ID: <code>${trimmed}</code>`, {
          parse_mode: "HTML",
          reply_markup: buildChatSetupKeyboard(),
        });
      } else {
        await ctx.reply(
          "❌ Invalid Telegram chat ID format. Please use @username or numeric ID.",
        );
      }
      return;
    }

    if (text.startsWith("/")) {
      await ctx.reply("❓ Unknown command. Use /help to see available options.");
    }
  });

  bot.catch((err) => {
    console.error("Bot error:", err.error);
  });

  return bot;
}

export { sendMessage };
