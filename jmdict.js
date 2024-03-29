var XMLParser = require("fast-xml-parser").XMLParser;
var fs = require("fs");
var yojiRegex = /^[々ヶ〆一-龯]{4}$/
const nomaRegex = /(.)々/g;
function list(obj) {
    return Array.isArray(obj)? obj : [obj];
}
class TopByKanjiIter {
    constructor(limit, innerSet = null) {
        this.limit = limit;
        this.desc = "Top " + this.limit + " kanji" + (innerSet !== null? ", " + innerSet.desc : "");
        this.postfix = "top"+this.limit + (innerSet !== null? innerSet.postfix : "");
        this.innerSet = innerSet;
    }
    parse(words) {
        var max = [[], []];
        for (let i = 0.5; i < 4; i += 0.25) {
            var algo = (k, max, kanjiFreq) => Math.pow(max - kanjiFreq.get(k), i);
            var res = new TopByKanji(this.limit, this.innerSet, algo).parse(words);
            if (res[1].length > max[1].length) {
                max = res;
                var best = i;
            }
        }
        this.desc += best;
        return max;
    }
}

class TopByKanji {
    constructor(limit, innerSet = null, algo = (k, max, kanjiFreq) => max - kanjiFreq.get(k)) {
        this.limit = limit;
        this.desc = "Top " + this.limit + " kanji" + (innerSet !== null? ", " + innerSet.desc : "");
        this.postfix = "top"+this.limit + (innerSet !== null? innerSet.postfix : "");
        this.innerSet = innerSet;
        this.algo = algo;
    }
    parse(words) {
        var kanjiFreq = new Map();
        var wordList;
        if (this.innerSet === null) wordList = words.map(w => w.keb);
        else [, wordList] = this.innerSet.parse(words);
        for (var word of wordList) {
            for (let k of new Set(word)) {
                let count = 0;
                if (kanjiFreq.has(k)) count = kanjiFreq.get(k);
                kanjiFreq.set(k, count+1);
            }
        }
        var max = Math.max(...kanjiFreq.values());
        wordList = wordList.map(w => [w, [...new Set(w)].map(k => this.algo(k, max, kanjiFreq)).reduce((a, b) => a + b)]);
        wordList.sort((a, b) => a[1] - b[1]);
        var kanjiTop = new Set();
        for (let i = 0; kanjiTop.size < this.limit; i++) {
            var remove = [...wordList[i][0]].filter(k => !kanjiTop.has(k));
            if (remove.length > 0) remove.forEach(kanjiTop.add, kanjiTop);
            for(let word of wordList) {
                word[1] -= [...new Set(remove)].filter(k => word[0].includes(k))
                        .map(k => this.algo(k, max, kanjiFreq))
                        .reduce((a, b) => a + b, 0);
            }
            wordList.sort((a, b) => a[1] - b[1]);
        }
        return [[...kanjiTop], wordList.filter(w => w[1] === 0).map(w => w[0])];
    }
}
var yojiFreq = JSON.parse(fs.readFileSync('yoji_freq.json'));
class CommonYoji {
    constructor(common, nf) {
        this.common = common;
        this.nf = common? 1000 : nf;
        this.desc = this.common ? "All common yojijukugo" : "Common yojijukugo (freq > " + this.nf + ")";
        this.postfix = this.common? "common" : "freq"+this.nf;
    }
    parse(words) {
        var commonYoji = words.filter(word => yojiFreq[word.keb] >= this.nf).map(word => word.keb);
        // for (var word of words) {
            // if ("ke_pri" in word && (this.common || list(word.ke_pri).some(ke => ke.startsWith("nf") && Number(ke.substring(2)) <= this.nf))) {
        //         commonYoji.push(word.keb);
        //     }
        // }
        return [[...new Set(commonYoji.flatMap(y => [...y]))], commonYoji];
    }
}
class AllYoji {
    desc = "All Yojijukugo";
    postfix = "full";
    parse(words) {
        return [[...new Set(words.flatMap(y => [...y.keb]))], words.map(y => y.keb)];
    }
}

var file = fs.readFileSync("/home/will/Downloads/JMdict_e/JMdict_e", "utf8");
const parser = new XMLParser();
var obj = parser.parse(file);
var toProcess = [];
var allYoji = [];
var yoji_lenient = [];
for (var ent of obj.JMdict.entry) {
    const words = list(ent.k_ele).filter(w => typeof w !== "undefined" && yojiRegex.test(w.keb));
    var wordsNoma = words.filter(a => !words.some(b => b.keb !== a.keb && b.keb.replaceAll(nomaRegex, "$1$1") === a.keb));
    if (list(ent.sense).some(s => list(s.misc).includes("yojijukugo"))) {
        toProcess.push(...wordsNoma);
        allYoji.push(...words);
    }
    else {
        yoji_lenient.push(...words);
    }
}
var processors = [
    new TopByKanjiIter(200, new CommonYoji(false, 250)),
    new TopByKanjiIter(100, new CommonYoji(false, 250)),
    // new TopByKanjiIter(200),
    // new TopByKanjiIter(100),
    new CommonYoji(false, 10000),
    new CommonYoji(true),
    new AllYoji(),
];
for(var processor of processors) {
    var [kanji, yoji] = processor.parse(toProcess);
    kanji.sort();
    yoji.sort();
    var kanjiFile = "public/kanji_"+processor.postfix+".txt";
    var yojiFile = "public/yoji_"+processor.postfix+".txt";
    processor.totalKanji = kanji.length;
    processor.totalYoji = yoji.length;
    fs.writeFileSync(kanjiFile, kanji.join("\n"));
    fs.writeFileSync(yojiFile, yoji.join("\n"));
}
fs.writeFileSync("public/yoji_lenient.txt", yoji_lenient.map(y => y.keb).join("\n"));
fs.writeFileSync("public/yoji_all.txt", allYoji.map(y => y.keb).join("\n"));
fs.writeFileSync("src/lists.json", JSON.stringify(processors));