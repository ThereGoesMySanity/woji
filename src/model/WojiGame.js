import { GuessState } from "./GuessState";
const nomaRegex = /(.)々/g;
const kanjiRegex = /^[々ヶ〆一-龯]$/;
export class WojiGame {
    static isKanji(kanji) {
        return kanjiRegex.test(kanji);
    }

    static replaceNoma(word) {
        return word.replaceAll(nomaRegex, "$1$1");
    }

    static checkWord(word, answer) {
        if (word.length !== answer.length) return null;
        // return [...word].map((k, i) => this.checkKanji(k, word, i, answer));
        var states = [GuessState.Wrong, GuessState.HalfRight, GuessState.Right];
        var ansHasNoma = answer.includes("々");
        var ansNoma = this.replaceNoma(answer);
        var result = new Array(4);
        for (let i = 0; i < word.length; i++) {
            result[i] = states[Math.max(
                    this.checkKanji(i, word, answer), 
                    ansHasNoma? this.checkKanji(i, word, ansNoma) : 0)];
        }
        return result;
    }

    static checkKanji(i, word, answer) {
        // var ans = [...answer];
        // if (ans[position] === kanji) return GuessState.Right;
        // else if ([...word.substring(0, position)].filter(c => c === kanji).length < ans.filter(c => c === kanji).length) return GuessState.HalfRight;
        // else if (ans.includes("々")) return this.checkKanji(kanji, word, position, this.replaceNoma(answer));
        // else return GuessState.Wrong;
        var kanji = word[i];
        if (answer[i] === kanji) return 2;
        var aCount = 0, wCount = 0;
        for (let j = 0; j < answer.length; j++) {
            if (answer[j] === kanji && word[j] === kanji) continue;
            if (j < i && word[j] === kanji) wCount += 1;
            if (answer[j] === kanji) aCount += 1;
        }
        if (aCount > 0 && wCount < aCount) return 1;
        return 0;
    }
}