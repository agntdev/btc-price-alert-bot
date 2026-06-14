import type { Bot } from "grammy";
import { InlineKeyboard } from "grammy";
import { fetchBtcPrice, formatBtcPrice, CoinGeckoError } from "../api/coingecko.js";
import { withRetry } from "../api/retry.js";
import type { BotContext } from "../bot.js";

function buildPriceKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("🔄 Refresh Price", "price:refresh");
}

export function registerPriceCommand(bot: Bot<BotContext>) {
  const handler = async (ctx: BotContext) => {
    try {
      const price = await withRetry(() => fetchBtcPrice(), {
        maxRetries: 2,
        onRetry: (attempt, err) => {
          const msg =
            err instanceof CoinGeckoError
              ? `${err.message}`
              : `Unexpected error`;
          console.error(`[price] Retry ${attempt}/2:`, msg);
        },
      });
      const formatted = formatBtcPrice(price);
      await ctx.reply(`₿ Bitcoin: ${formatted}`, {
        reply_markup: buildPriceKeyboard(),
      });
    } catch (err) {
      if (err instanceof CoinGeckoError && err.code === "RATE_LIMITED") {
        await ctx.reply(`⏳ ${err.message}`);
        return;
      }
      console.error("Price fetch error:", err);
      await ctx.reply(
        "⚠️ Failed to fetch Bitcoin price. Please try again later.",
        {
          reply_markup: new InlineKeyboard()
            .text("🔁 Retry", "price:refresh"),
        },
      );
    }
  };

  bot.command("price", handler);
  bot.callbackQuery("price:refresh", handler);
}