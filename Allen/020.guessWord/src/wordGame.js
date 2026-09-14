import { ACHIEVEMENTS } from "./achievements.js";
import { getAchievements } from "./database.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export class WordGame {
  constructor() {
    this.length = 5;
    this.isWaitingForLength = false;
    this.pendingLength = null;

    this.difficulty = 1;
    this.isWaitingForDifficulty = false;

    this.word = "";
    this.guessedLetters = new Set();
    this.guessedTimes = 0;

    this.userId = null;
    this.chatId = null;
    this.userName = null;
    this.first_name = null;
  }

  setLength(length) {
    if (!Number.isInteger(length) || length < 3 || length > 10) {
      throw new RangeError("Length must be an integer from 3 to 10.");
    }
    this.length = length;
  }

  setWaitingForLength(isWaiting) {
    this.isWaitingForLength = isWaiting;
  }

  setDifficulty(difficulty) {
    if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) {
      throw new RangeError("Difficulty must be an integer from 1 to 5.");
    }
    this.difficulty = difficulty;
  }

  setWaitingForDifficulty(isWaiting) {
    this.isWaitingForDifficulty = isWaiting;
  }

  setUserInfo(userId, chatId, userName, first_name) {
    this.userId = userId;
    this.chatId = chatId;
    this.userName = userName;
    this.first_name = first_name;
  }

  async getWord() {
    const URL = `https://random-word-api.herokuapp.com/word?length=${this.length}&diff=${this.difficulty}`;
    const response = await fetch(URL);
    if (!response.ok) {
      throw new Error(`Word request failed: ${response.status}`);
    }
    const words = await response.json();
    if (
      !Array.isArray(words) ||
      typeof words[0] !== "string" ||
      !/^[a-z]+$/i.test(words[0]) ||
      words[0].length !== this.length
    ) {
      throw new Error("No valid word returned for these settings.");
    }
    return words;
  }

  isGameWon() {
    return [...this.word].every((letter) => this.guessedLetters.has(letter));
  }

  getDisplayedLetters() {
    return [...this.word]
      .map((letter) => (this.guessedLetters.has(letter) ? letter : "_"))
      .join(" ");
  }

  handleGuess(letter) {
    this.guessedTimes++;
    if (letter.length > 1 && letter.length === this.word.length) {
      if (letter === this.word) {
        for (const letter of this.word) {
          this.guessedLetters.add(letter);
        }
        return true;
      }
    }

    if (this.word.includes(letter)) {
      this.guessedLetters.add(letter);
      return true;
    }

    return false;
  }

  async reset() {
    const result = await this.getWord();

    this.word = result[0].toLowerCase();
    this.guessedTimes = 0;
    this.guessedLetters.clear();

    const randomIndex = Math.floor(Math.random() * this.word.length);

    const randomLetter = this.word[randomIndex];

    this.guessedLetters.add(randomLetter);

    console.log(
      `-----\nUser id: ${this.userId} \nChat id: ${this.chatId} \nUser name: ${this.userName} (${this.first_name}) \nWord: ${this.word} \nRandom letter: ${randomLetter}\n-----`,
    );
    console.log(this.guessedLetters);
    console.log(this.getDisplayedLetters());
  }

  getWinMessage() {
    const tries = this.guessedTimes;
    const word = this.word.toUpperCase();

    if (tries === 1) {
      return `
🏆 <b>INCREDIBLE!</b>

You guessed <b>${word}</b>
in just <b>ONE TRY!</b>

🥇 你打败了 <b>99.99%</b> 的玩家！

`;
    }

    if (tries <= 3) {
      return `
🔥 <b>IMPRESSIVE!</b>

You guessed <b>${word}</b>
in just <b>${tries} tries!</b>

🧠 看来你是真的在猜，不是在碰运气。

`;
    }

    if (tries <= 7) {
      return `
🎉 <b>WELL DONE!</b>

You guessed <b>${word}</b>
in <b>${tries} tries!</b>

👍 不错，至少看起来知道自己在干什么。
`;
    }

    if (tries <= 15) {
      return `
✅ <b>YOU GOT IT!</b>

The word was <b>${word}</b>.

🎯 Attempts: <b>${tries}</b>

😅 花了点时间，不过最终还是猜出来了。
`;
    }

    if (tries < 25) {
      return `
😮‍💨 <b>FINALLY!</b>

Yes... the word was <b>${word}</b>.

🎯 Attempts: <b>${tries}</b>

你确实猜出来了。

至于用了多少次……
我们就不要太在意细节了。🙈
`;
    }
    if (tries === 25) {
      return `
🤨 <b>SERIOUSLY?</b>

The word was <b>${word}</b>.

🎯 Attempts: <b>${tries}</b>

你这已经不能叫“猜单词”了。

你是不是从：

<b>A → B → C → D → E...</b>

一个一个试过来的？ 💀

`;
    }
    return `
💀 <b>WHAT DID I JUST WITNESS?</b>

The word was <b>${word}</b>.

🎯 Attempts: <b>${tries}</b>

━━━━━━━━━━━━━━

兄弟……

这已经不能叫 <b>猜单词</b> 了。

你是不是打开了英文字母表，然后：

<code>A → B → C → D → E → F → G...</code>

一个一个往里塞？ 😭

英语一共就 <b>26 个字母</b>，
你用了 <b>${tries} 次</b> 才把这个词干出来。

这不是 Guess the Word。

这是：

<b>BRUTE FORCE THE WORD™</b> 💀

━━━━━━━━━━━━━━

📊 <b>Performance Report</b>

🧠 Strategy: <b>Unknown</b>
🎯 Accuracy: <b>Questionable</b>
⌨️ Keyboard durability: <b>Excellent</b>
🐒 Algorithm: <b>Try everything until it works</b>

━━━━━━━━━━━━━━

🏆 Congratulations.

You didn't guess the word.

<b>You sucks!</b> 💀
`;
  }

  getGuessMessage(guess, isCorrect) {
    const title = isCorrect
      ? "✅ <b>GOOD GUESS!</b>"
      : "❌ <b>NOT IN THE WORD</b>";
    const result = isCorrect
      ? `<code>${guess.toUpperCase()}</code> was a great guess.`
      : `<code>${guess.toUpperCase()}</code> isn't in this word.`;
    const attempts = this.guessedTimes === 1 ? "attempt" : "attempts";

    return `${title}

${result}

🧩 <b>Current word:</b>
<blockquote>✨ ${this.getDisplayedLetters()} ✨</blockquote>

🎯 <b>${this.guessedTimes}</b> ${attempts}`;
  }

  getAchievementsSection() {
    const unlockedIds = new Set(
      getAchievements(this.userId).map(({ achievement_id }) => achievement_id),
    );
    const unlockedAchievements = ACHIEVEMENTS.filter(({ id }) =>
      unlockedIds.has(id),
    );

    if (unlockedAchievements.length === 0) {
      return "🏆 <b>Achievements:</b> <i>None yet — keep guessing!</i>";
    }

    const details = unlockedAchievements
      .map(
        ({ icon, name, description }) =>
          `${icon} <b>${name}</b> — ${description}`,
      )
      .join("\n");

    return `🏆 <b>ACHIEVEMENTS (${unlockedAchievements.length}/${ACHIEVEMENTS.length})</b>\n${details}`;
  }

  /**
   * Returns the start message for the game.
   * @returns {string} The start message.
   */
  getStartMessage() {
    return `
🎮 <b>WORD GUESSING GAME</b>
━━━━━━━━━━━━━━

👤 Player: <b>${escapeHtml(this.first_name || this.userName || "Player")}</b>

🧩 <b>Your word:</b>

<blockquote>✨ ${this.getDisplayedLetters()} ✨</blockquote>

🎯 Guess a <b>letter</b> or the <b>whole word</b>.

Examples:
<code>a</code>
<code>apple</code>

━━━━━━━━━━━━━━
${this.getAchievementsSection()}

━━━━━━━━━━━━━━
🔥 Let's see how few tries you need!
`;
  }
}
