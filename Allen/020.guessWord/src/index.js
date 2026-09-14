import { Bot } from "node-telegram-bot-api";
import { run } from "node-telegram-bot-api/node";
import "dotenv/config";
import { unlockAchievement } from "./database.js";
import {
  findUnlockedAchievements,
  getAchievementMessage,
} from "./achievements.js";
import { WordGame } from "./wordGame.js";

const bot = new Bot(process.env.BOT_TOKEN);

const games = new Map();

await bot.api.setMyCommands({
  commands: [
    { command: "start", description: "Start a new game" },
    { command: "settings", description: "Adjust game settings" },
  ],
  scope: {
    type: "all_private_chats",
  },
});

bot.command("start", async (ctx) => {
  const chatId = ctx.message.chat.id;
  const game = games.get(chatId) ?? new WordGame();
  game.isWaitingForLength = false;
  game.isWaitingForDifficulty = false;
  game.pendingLength = null;
  game.setUserInfo(
    ctx.message.from?.id,
    chatId,
    ctx.message.from?.username,
    ctx.message.from?.first_name,
  );
  await game.reset();
  games.set(chatId, game);

  await ctx.reply(game.getStartMessage(), {
    parse_mode: "HTML",
  });
});

bot.command("settings", async (ctx) => {
  const chatId = ctx.message.chat.id;
  const game = games.get(chatId);

  if (!game) {
    await ctx.reply("Please start a new game by sending /start.");
    return;
  }

  game.setWaitingForLength(true);
  game.setWaitingForDifficulty(false);
  game.pendingLength = null;

  await ctx.reply(
    `
<b>猜单词游戏设置向导</b>

当前配置：
- 单词长度: ${game.length} 个字母
- 词汇难度: ${game.difficulty} / 5

请输入 <b>3–10</b> 之间的整数来设置单词长度，例如 <code>7</code>。
  `,
    { parse_mode: "HTML" },
  );
});

bot.on("message", async (ctx) => {
  const chatId = ctx.message.chat.id;
  const game = games.get(chatId);

  if (!game) {
    await ctx.reply("Please start a new game by sending /start.");
    return;
  }

  const text = ctx.message.text?.trim() ?? "";

  if (game.isWaitingForLength) {
    const length = Number(text);
    if (
      !/^\d+$/.test(text) ||
      !Number.isInteger(length) ||
      length < 3 ||
      length > 10
    ) {
      await ctx.reply("请输入 3–10 之间的整数，例如 7。");
      return;
    }

    game.pendingLength = length;
    game.setWaitingForLength(false);
    game.setWaitingForDifficulty(true);

    await ctx.reply(
      `单词长度选择为 ${length} 个字母。\n\n` +
      "请输入词汇难度（1–5）：\n" +
      '1 = Easy — 非常常见（如 water、house）\n' +
      "2 = Medium-Easy — 常见词\n" +
      "3 = Medium — 中等常见程度\n" +
      "4 = Medium-Hard — 不常见词\n" +
      "5 = Hard — 罕见词（如 defenestration）\n\n" +
      "完成设置后将重新开局；发送 /start 可取消设置并重新开局。"
    );
    return;
  }

  if (game.isWaitingForDifficulty) {
    const difficulty = Number(text);
    if (!/^[1-5]$/.test(text)) {
      await ctx.reply("请输入 1–5 之间的整数，例如 1。");
      return;
    }

    const previousLength = game.length;
    const previousDifficulty = game.difficulty;
    game.setLength(game.pendingLength);
    game.setDifficulty(difficulty);

    try {
      await game.reset();
    } catch (error) {
      game.setLength(previousLength);
      game.setDifficulty(previousDifficulty);
      console.error("Failed to apply game settings:", error);
      await ctx.reply("无法获取该长度和难度的单词，请重新输入难度（1–5），或发送 /settings 重新选择长度。");
      return;
    }

    game.setWaitingForDifficulty(false);
    game.pendingLength = null;

    await ctx.reply(`单词长度已设置为 ${game.length} 个字母，词汇难度为 ${game.difficulty} / 5，已重新开局。`, {
      parse_mode: "HTML",
    });
    await ctx.reply(game.getStartMessage(), {
      parse_mode: "HTML",
    });
    return;
  }

  const letter = text.toLowerCase();

  if (!/^[a-z]+$/.test(letter) || letter.length > game.word.length) {
    await ctx.reply("Please enter a letter, a word or a valid guess.");
    return;
  }

  if (game.guessedLetters.has(letter)) {
    await ctx.reply(
      `You've already guessed the letter "${letter}". ${game.getDisplayedLetters()} (Tries: ${game.guessedTimes})`,
    );
    return;
  }

  const isCorrect = game.handleGuess(letter);

  await ctx.reply(game.getGuessMessage(letter, isCorrect), {
    parse_mode: "HTML",
  });

  if (game.isGameWon()) {
    await ctx.reply(game.getWinMessage(), {
      parse_mode: "HTML",
    });

    const unlockedAchievements = findUnlockedAchievements({
      tries: game.guessedTimes,
      word: game.word,
    }).filter((achievement) => unlockAchievement(game.userId, achievement.id));
    const achievementMessage = getAchievementMessage(unlockedAchievements);

    if (achievementMessage) {
      await ctx.reply(achievementMessage, {
        parse_mode: "HTML",
      });
    }

    await game.reset();

    await ctx.reply(game.getStartMessage(), {
      parse_mode: "HTML",
    });
  }
});

await run(bot);
