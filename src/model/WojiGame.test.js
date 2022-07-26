const WojiGame = require("./WojiGame").WojiGame;
const GuessState = require("./GuessState").GuessState;

const states = [GuessState.Wrong, GuessState.HalfRight, GuessState.Right];
describe('checkWord', () => {
    test.each([
        ["明晰判明", "明々白々", [2, 0, 0, 1]],
        ["明明白白", "明晰判明", [2, 1, 0, 0]],
        ["一体全体", "表裏一体", [1, 0, 0, 2]],
        ["1110", "0001", [1, 0, 0, 1]],
        ["1110", "0010", [0, 0, 2, 2]],
        ["1110", "0100", [0, 2, 0, 2]],
        ["1110", "1000", [2, 0, 0, 2]],
        ["1110", "0101", [1, 2, 0, 1]],
        ["0101", "1110", [1, 2, 0, 1]],
    ])("guess %p, answer %p, returns %p", (word, answer, result) => {
        expect(WojiGame.checkWord(word, answer)).toEqual(result.map(i => states[i]));
    });
});