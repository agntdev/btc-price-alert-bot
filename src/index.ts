import { createBot } from "./bot.js";
import { registerCommands } from "./commands.js";

const token = process.env.BOT_TOKEN;

if (!token) {
  console.error("BOT_TOKEN environment variable is required");
  process.exit(1);
}

const bot = createBot(token);
registerCommands(bot);

bot.start({
  onStart: (botInfo) => {
    console.log(`Bot @${botInfo.username} started`);
  },
});