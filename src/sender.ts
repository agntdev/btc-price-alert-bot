import type { Api } from "grammy";
import type { InlineKeyboardMarkup } from "grammy/types";

export async function sendMessage(
  api: Api,
  chatId: string | number,
  text: string,
  opts?: { replyMarkup?: InlineKeyboardMarkup },
): Promise<void> {
  await api.sendMessage(chatId.toString(), text, {
    parse_mode: "HTML",
    reply_markup: opts?.replyMarkup,
  });
}