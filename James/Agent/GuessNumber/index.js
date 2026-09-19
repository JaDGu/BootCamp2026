import 'dotenv/config';
import { Bot } from 'node-telegram-bot-api';
import { run } from 'node-telegram-bot-api/node';

const bot = new Bot(process.env.BOT_TOKEN);



// const stats = new Map();
const games = new Map();   // 当前正在进行的局

bot.command('hello', (ctx) => {
    const id = ctx.from.id;

    games.set(id, { answer: getNumber(), tries: 0 });

    // if (!stats.has(id)) {
    //     stats.set(id, { played: 0, won: 0, average: 0, best: null });
    // }
    // stats.get(id).played++;

    ctx.reply('我想好了一个 0~63 的数，猜吧');
});

bot.hears(/./, (ctx) => {
    const id = ctx.from.id;
    const game = games.get(id);

    if (!game) {
        ctx.reply('先发 /hello 开始游戏');
        return;
    }

    game.tries++;

    const response = checkGuess(ctx.message.text, game.answer);
    console.log(`${ctx.from.first_name} 第 ${game.tries} 次猜 ${ctx.message.text}: ${response}`);

    if (Number(ctx.message.text) === game.answer) {
        ctx.reply(`你猜对了！🎉 你一共猜了 ${game.tries} 次`);

        games.delete(id);
    }

    ctx.reply(response);
});

run(bot);
console.log('机器人已启动');


function getNumber() {
    const a = Math.floor(Math.random() * 64);
    console.log(`答案是: ${a}`);
    return a;
}

function checkGuess(input, answer) {

    const guess = Number(input)
    if (!Number.isInteger(guess) || guess < 0 || guess > 63) {
        return '请输入一个 0~63 的正整数';
    }
    if (guess > answer) {
        return '大了';

    } else if (guess < answer) {
        return '小了';
    } else {
        return '猜对了!!';
    }
}