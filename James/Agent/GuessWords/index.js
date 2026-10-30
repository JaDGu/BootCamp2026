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
        { answer: thewords, tries: 0, guessed: [getRandomLetter(thewords)], gameanswer: [] }
    );
    games.get(id).gameanswer = games.get(id).answer.split('').filter((x) => x !== games.get(id).guessed[0])

    console.log('存进去的:', games.get(id));
    console.log(games)

    const text = maskWord(games.get(id).answer, games.get(id).guessed)
    console.log('text:', text);

    await ctx.reply('让我们愉快的猜单词吧！我已经想好了一个单词，你来猜吧');
    await ctx.reply(name + ": " + text + ` 猜了${games.get(id).tries}次`)
});

bot.hears(/^[a-zA-Z]+$/, (ctx) => {
    const id = ctx.from.id
    const name = ctx.from.first_name
    const text = ctx.message.text.toLowerCase().trim()
    const game = games.get(id)
    let shown

    if (games.has(id)) {
        if (text.length === 1) {
            if (game.guessed.includes(text)) {
                shown = maskWord(games.get(id).answer, games.get(id).guessed)
                ctx.reply(name + ": " + shown + ` 这个字母已经猜过了 已经猜过${game.tries}次`)

            } else {
                if (game.answer.includes(text)) {
                    game.tries++
                    game.guessed.push(text)
                    game.gameanswer = game.gameanswer.filter((x) => x !== text)
                    // console.log(gameanswer)

                    if (game.gameanswer.length === 0) {
                        shown = maskWord(games.get(id).answer, games.get(id).guessed)
                        ctx.reply(name + ": " + shown + ` 恭喜你,猜对了,一共用了${game.tries}次`)
                        console.log(name + ": " + "猜的:" + text + "   " + shown + `恭喜你,猜对了,一共用了${game.tries}次`)
                        games.delete(id)

                    } else {


                        shown = maskWord(games.get(id).answer, games.get(id).guessed)
                        ctx.reply(name + ": " + shown + ` 这个字母对了,已经用了${game.tries}次`)
                        console.log(name + ": " + "猜的:" + text + "   " + shown + `这个字母对了,已经用了${game.tries}次`)
                    }
                } else {
                    game.tries++
                    game.guessed.push(text)

                    shown = maskWord(games.get(id).answer, games.get(id).guessed)
                    ctx.reply(name + ": " + shown + ` 已经用了${game.tries}次`)
                    console.log(name + ": " + "猜的:" + text + "   " + shown + ` 已经用了${game.tries}次`)
                }
            }

        } else return

    } else return
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
