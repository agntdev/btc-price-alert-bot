import { Bot, session, type Context, type SessionFlavor } from "grammy";
import type { DbClient } from "./db/index.js";
import { registerStatusCommand } from "./commands/status.js";

export interface SessionData {
  userId?: number;
  chatId?: string;
}

export type BotContext = Context & SessionFlavor<SessionData>;

export function createBot(token: string, db: DbClient) {
  const bot = new Bot<BotContext>(token);

  bot.use(
    session({
      initial: (): SessionData => ({}),
    }),
  );

  registerStatusCommand(bot, db);

  bot.catch((err) => {
    console.error("Bot error:", err.error);
  });

  return bot;
}
