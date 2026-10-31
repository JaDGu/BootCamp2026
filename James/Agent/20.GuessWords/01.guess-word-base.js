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
        { answer: thewords, wrongs: 0, guessed: [getRandomLetter(thewords)], gameanswer: [] }
    );
    const game = games.get(id)
    game.gameanswer = game.answer.split('').filter((x) => x !== game.guessed[0])

    console.log('存进去的:', game);
    console.log(games)

    const text = maskWord(game.answer, game.guessed)
    console.log('text:', text);

    await ctx.reply('让我们愉快的猜单词吧！我已经想好了一个单词，你来猜吧');
    await ctx.reply(name + ": " + text + ` 猜了${game.wrongs}次`)
});

bot.command('stop', (ctx) => {
    const id = ctx.from.id;
    const name = ctx.from.first_name
    const game = games.get(id)
    let shown

    if (games.has(id)) {
        shown = showfullwords(game.answer)
        ctx.reply(name + ": " + shown + ` 很遗憾,您失败了,一共猜错过${game.wrongs}次`)
        console.log(name + ": " + "答案是:" + " " + shown + `很遗憾,失败了,一共用了${game.wrongs}次`)
        games.delete(id)
    } else {
        ctx.reply(name + ",目前并没有您的游戏局,如果想参加请输入 /start ")
    }

})

bot.hears(/^[a-zA-Z]+$/, (ctx) => {
    const id = ctx.from.id
    const name = ctx.from.first_name
    const text = ctx.message.text.toLowerCase().trim()
    const game = games.get(id)
    let shown

    if (games.has(id)) {
        if (text.length === 1) {
            if (game.guessed.includes(text)) {
                shown = maskWord(game.answer, game.guessed)
                ctx.reply(name + ": " + shown + ` 这个字母已经猜过了 已经猜错${game.wrongs}次`)

            } else {
                if (game.answer.includes(text)) {
                    game.guessed.push(text)
                    game.gameanswer = game.gameanswer.filter((x) => x !== text)
                    // console.log(gameanswer)

                    if (game.gameanswer.length === 0) {
                        shown = maskWord(game.answer, game.guessed)
                        ctx.reply(name + ": " + shown + ` 恭喜你,猜对了,一共用了${game.wrongs}次`)
                        console.log(name + ": " + "猜的:" + text + "   " + shown + `恭喜你,猜对了,一共用了${game.wrongs}次`)
                        games.delete(id)

                    } else {


                        shown = maskWord(game.answer, game.guessed)
                        ctx.reply(name + ": " + shown + ` 这个字母对了,已经猜错${game.wrongs}次`)
                        console.log(name + ": " + "猜的:" + text + "   " + shown + `这个字母对了,已经猜错${game.wrongs}次`)
                    }
                } else {
                    game.wrongs++
                    game.guessed.push(text)

                    shown = maskWord(game.answer, game.guessed)
                    ctx.reply(name + ": " + shown + ` 猜错了,已经猜错${game.wrongs}次`)
                    console.log(name + ": " + "猜的:" + text + "   " + shown + ` 猜错了,已经猜错${game.wrongs}次`)
                }
            }

        } else if (text.length === game.answer.length) {
            if (text === game.answer) {
                shown = showfullwords(game.answer)
                ctx.reply(name + ": " + shown + ` 恭喜你,猜对了,一共用了${game.wrongs}次`)
                console.log(name + ": " + "猜的:" + text + "   " + shown + `恭喜你,猜对了,一共用了${game.wrongs}次`)
                games.delete(id)
            } else {
                game.wrongs++

                shown = maskWord(game.answer, game.guessed)
                ctx.reply(name + ": " + shown + ` 猜错了,已经猜错${game.wrongs}次`)
                console.log(name + ": " + "猜的:" + text + "   " + shown + ` 猜错了,已经猜错${game.wrongs}次`)
            }
        } else {
            ctx.reply("你要是想猜整个单词的话也要数数字数啊")
        }

    } else return
})


bot.on('message', (ctx) => {
    const id = ctx.from.id
    const name = ctx.from.first_name
    // 拿出这个人的局信息:
    if (games.has(id)) {
        ctx.reply(name + ",请猜单个字母或纯字母的单词,如果不想玩了请输入 /stop !")
        console.log(name + "发了不合规输入")
    } else return

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

function showfullwords(word) {
    let shown = ''
    for (const ch of word) {
        shown += ch
        shown += ' '
    }
    return shown.trim()
}

function getRandomLetter(word) {
    return word[Math.floor(word.length * Math.random())]
}


run(bot);
console.log('机器人已启动');
