var XMLParser = require("fast-xml-parser").XMLParser;
var fs = require("fs");
var yojiRegex = /^[々ヶ〆一-龯]{4}$/
const nomaRegex = /(.)々/g;
function list(obj) {
    return Array.isArray(obj)? obj : [obj];
}

class TopByKanji {
    constructor(limit, innerSet = null) {
        this.limit = limit;
        this.desc = "Top " + this.limit + " kanji" + (innerSet !== null? ", " + innerSet.desc : "");
        this.postfix = "top"+this.limit + (innerSet !== null? innerSet.postfix : "");
        this.innerSet = innerSet;
    }
    parse(words) {
        var kanjiFreq = new Map();
        var wordList;
        if (this.innerSet === null) wordList = words.map(w => w.keb);
        else [, wordList] = this.innerSet.parse(words);
        for (var word of wordList) {
            for (var k of new Set(word)) {
                if (!kanjiFreq.has(k)) kanjiFreq.set(k, 0);
                kanjiFreq.set(k, kanjiFreq.get(k)+1);
            }
        }
        kanjiFreq = [...kanjiFreq.entries()];
        kanjiFreq.sort((a, b) => b[1] - a[1]);
        var kanjiTop = kanjiFreq.slice(0, this.limit).map(a => a[0]);
        return [kanjiTop, wordList.filter(y => [...y].every(c => kanjiTop.includes(c)))];
    }
}
class CommonYoji {
    constructor(common, nf) {
        this.common = common;
        this.nf = nf;
        this.desc = this.common ? "All common yojijukugo" : "Common yojijukugo (nf" + this.nf + ")";
        this.postfix = this.common? "common" : "nf"+this.nf;
    }
    parse(words) {
        var commonYoji = [];
        for (var word of words) {
            if ("ke_pri" in word && (this.common || list(word.ke_pri).some(ke => ke.startsWith("nf") && Number(ke.substring(2)) <= this.nf))) {
                commonYoji.push(word.keb);
            }
        }
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
    var words = list(ent.k_ele).filter(w => typeof w !== "undefined" && yojiRegex.test(w.keb));
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
    new TopByKanji(200),
    new TopByKanji(100),
    new TopByKanji(200, new CommonYoji(true)),
    new TopByKanji(100, new CommonYoji(true)),
    new CommonYoji(false, 32),
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