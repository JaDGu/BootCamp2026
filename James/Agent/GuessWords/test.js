const games = new Map();   // 当前正在进行的局

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
console.log(getRandomLetter('apple'));
