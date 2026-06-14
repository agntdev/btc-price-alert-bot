import { Bot, Context, session, type SessionFlavor } from "grammy";

export interface SessionData {
  chatId: string | null;
  referencePrice: number | null;
  step: "idle" | "awaiting_chat_id";
}

export type BotContext = Context & SessionFlavor<SessionData>;

export function createBot(token: string): Bot<BotContext> {
  const bot = new Bot<BotContext>(token);

  function getInitialSession(): SessionData {
    return { chatId: null, referencePrice: null, step: "idle" };
  }

  bot.use(session({ initial: getInitialSession }));

  bot.catch((err) => {
    console.error("Bot error:", err.error);
  });

  return bot;
}