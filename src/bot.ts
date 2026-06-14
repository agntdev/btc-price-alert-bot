import { Bot, session, type Context, type SessionFlavor } from "grammy";
import type { DbClient } from "./db/index.js";
import { registerStatusCommand } from "./commands/status.js";
import { registerPriceCommand } from "./commands/price.js";
import { sendMessage } from "./sender.js";

export interface SessionData {
  userId?: number;
  chatId?: string;
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

  bot.command("start", async (ctx) => {
    await ctx.reply(
      "Welcome to BTC Alert Bot! Please provide your Telegram chat ID to receive 10% price movement alerts.",
    );
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(HELP_TEXT, { parse_mode: "HTML" });
  });

  registerStatusCommand(bot, db);
  registerPriceCommand(bot);

  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text;
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
