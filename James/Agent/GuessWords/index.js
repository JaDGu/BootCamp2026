import 'dotenv/config';
import { Bot } from 'node-telegram-bot-api';
import { run } from 'node-telegram-bot-api/node';

const bot = new Bot(process.env.BOT_TOKEN);


const games = new Map();   // 当前正在进行的局


bot.command('start', async (ctx) => {
    const id = ctx.from.id;
    const name = ctx.from.first_name
    const thewords = await fetchRandomWord()

    games.set(id,
        { answer: thewords, tries: 0, guessed: [getRandomLetter(thewords)] }
    );
    console.log('存进去的:', games.get(id));
    console.log(games)

    const text = maskWord(games.get(id).answer, games.get(id).guessed)
    console.log('text:', text);

    ctx.reply('让我们愉快的猜单词吧！我已经想好了一个单词，你来猜吧');
    ctx.reply(name + ": " + text + ` 猜了${games.get(id).tries}次`)
});

bot.hears(/^[a-zA-Z]+$/, (ctx) => {
    const id = ctx.from.id
    const name = ctx.from.first_name
    const text = ctx.message.text
    const game = games.get(id)
    if (games.has(id)) {
        if (text.length === 1) {
            game.tries++
            game.guessed.push(text)

            const shown = maskWord(games.get(id).answer, games.get(id).guessed)
            ctx.reply(name + ": " + shown + ` 猜了${game.tries}次`)
            console.log(name + ": " + "猜的:" + text + "   " + shown + ` 猜了${game.tries}次`)
        } else return

    } else {
        return
    }
})


bot.on('message', (ctx) => {
    // 拿出这个人的局信息:

    const smessage = ctx.message.text
    console.log('发来消息:', smessage)
    console.log(ctx.message === ctx.update.message);

});



async function fetchRandomWord() {
    try {
        const res = await fetch('https://random-word-api.herokuapp.com/word');
        const data = await res.json();
        return data[0];            // 从数组里取出单词
    } catch (err) {
        console.log('获取单词失败：', err.message);
        return 'apple';            // 请求失败时返回一个备用词，比如 'apple' 
    }
}

function maskWord(word, guseeset) {
    let shown = ''
    for (const ch of word) {
        if (guseeset.includes(ch)) {
            shown += ch
            shown += ' '
        } else {
            shown += '_ '
        }
    }

    return shown.trim()

}

function getRandomLetter(word) {
    return word[Math.floor(word.length * Math.random())]
}


run(bot);
console.log('机器人已启动');
