import { Bot, InlineKeyboard } from "grammy";
import type { BotContext } from "./bot.js";

export function registerCommands(bot: Bot<BotContext>): void {
  bot.command("start", async (ctx) => {
    const chatId = ctx.session.chatId;
    if (chatId) {
      await ctx.reply(
        "BTC Alert Bot is already monitoring. Use /status to view configuration."
      );
      return;
    }

    ctx.session.step = "awaiting_chat_id";
    await ctx.reply(
      "Welcome to BTC Alert Bot! Please provide your Telegram chat ID to receive 10% price movement alerts.",
      { reply_markup: new InlineKeyboard().text("How to find your chat ID", "help_chat_id") }
    );
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(
      `Available commands:
/start - Initialize bot setup
/status - View current configuration
/history - View alert history
/help - Show this help message
/setchat - Manually set Telegram chat ID (admin only)`
    );
  });

  bot.command("setchat", async (ctx) => {
    ctx.session.step = "awaiting_chat_id";
    await ctx.reply(
      "Please provide your Telegram chat ID (e.g., @username or numeric ID).",
      { reply_markup: new InlineKeyboard().text("How to find your chat ID", "help_chat_id") }
    );
  });

  bot.command("status", async (ctx) => {
    const chatId = ctx.session.chatId;
    if (!chatId) {
      await ctx.reply(
        "Not configured yet. Use /start to set up the bot."
      );
      return;
    }

    const refPrice = ctx.session.referencePrice;
    await ctx.reply(
      `Current Configuration:
- Reference Price: ${refPrice ? `$${refPrice}` : "Not set"}
- Chat ID: ${chatId}
- Threshold: 10%
- API: CoinGecko`
    );
  });

  bot.command("history", async (ctx) => {
    await ctx.reply("Alert history will appear here once alerts are triggered. Check back later.");
  });

  bot.callbackQuery("help_chat_id", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(
      `To find your Telegram chat ID:
1. Open Telegram.
2. Go to your profile.
3. Look for your username (e.g., @yourusername) or numeric ID.
4. Enter it here to proceed.`,
      { reply_markup: new InlineKeyboard().text("Back to Setup", "back_to_setup") }
    );
  });

  bot.callbackQuery("back_to_setup", async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.step = "awaiting_chat_id";
    await ctx.reply(
      "Please provide your Telegram chat ID (e.g., @username or numeric ID).",
      { reply_markup: new InlineKeyboard().text("How to find your chat ID", "help_chat_id") }
    );
  });

  bot.on("message:text", async (ctx) => {
    const step = ctx.session.step;
    if (step === "awaiting_chat_id") {
      const text = ctx.message.text.trim();
      let chatId: string;

      if (text.startsWith("@") && text.length > 1) {
        chatId = text;
      } else if (/^-?\d+$/.test(text)) {
        chatId = text;
      } else {
        await ctx.reply(
          "Invalid Telegram chat ID format. Please use @username or numeric ID.",
          { reply_markup: new InlineKeyboard().text("How to find your chat ID", "help_chat_id") }
        );
        return;
      }

      ctx.session.chatId = chatId;
      ctx.session.step = "idle";

      const keyboard = new InlineKeyboard()
        .text("Confirm Chat ID", "confirm_chat")
        .text("How to find your chat ID", "help_chat_id");

      await ctx.reply(
        `You provided chat ID: ${chatId}. Confirm with the button below.`,
        { reply_markup: keyboard }
      );
    }
  });

  bot.callbackQuery("confirm_chat", async (ctx) => {
    await ctx.answerCallbackQuery();
    ctx.session.step = "idle";
    await ctx.reply(
      "Chat ID confirmed! Monitoring started. You will receive alerts when BTC price moves by 10% or more."
    );
  });
}