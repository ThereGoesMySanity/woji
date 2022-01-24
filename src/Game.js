import classNames from "classnames";
import React from "react";
import { Kanji } from "./components/Kanji";
import ResultsModal from "./components/ResultsModal";
import { Yoji } from "./components/Yoji";

import "./Game.css";
import { GuessState } from "./GuessState";

const nomaRegex = /(.)々/g;
export const GameState = {
    Loading: "loading",
    Standby: "standby",
    Playing: "playing",
    Win: "win",
    Lose: "lose",
}

export default class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            kanji: [],
            yojiAnswers: [],
            yojiAccepted: new Set(),
            yojiLenient: new Set(),
            guesses: [],
            currentState: GameState.Loading,
            currentInput: "",
            currentAnswer: "",
            invalidAnswer: false,
        };
        this.checkKanji = this.checkKanji.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.initialize = this.initialize.bind(this);
    }

    initialize() {
        this.setState({
            guesses: [],
            currentState: GameState.Standby,
            currentInput: "",
            currentAnswer: this.state.yojiAnswers[Math.floor(Math.random() * this.state.yojiAnswers.length)],
            invalidAnswer: false,
        });
        var newKanji = Array.from(this.state.kanji);
        newKanji.forEach(k => k.state = GuessState.NotGuessed);
        if (this.props.easymode) {
            var freebie = this.state.currentAnswer.charAt(Math.floor(Math.random() * 4));
            newKanji.find(k => k.text === freebie).state = GuessState.HalfRight;
        }
        this.setState({ kanji: newKanji });
        console.log(this.state.currentAnswer);
    }

    componentDidMount() {
        fetch(this.props.kanji)
            .then(k => k.text())
            .then(k => this.setState({kanji: k.split("\n").map(c => {return{text: c, state: GuessState.NotGuessed}})}));
        fetch("./yoji_all.txt")
            .then(k => k.text())
            .then(k => this.setState({yojiAccepted: new Set(k.split("\n"))}));
        fetch("./yoji_lenient.txt")
            .then(k => k.text())
            .then(k => this.setState({ yojiLenient: new Set(k.split("\n")) }));
        fetch(this.props.yojiAnswers)
            .then(k => k.text())
            .then(k => {
                var answers = k.split("\n");
                this.setState({yojiAnswers: answers});
                this.initialize();
            });
    }
    componentDidUpdate(prevProps) {
        if (this.state.currentState === GameState.Standby && this.props.easymode !== prevProps.easymode) {
            this.initialize();
        } 
    }

    replaceNoma(word) {
        return word.replaceAll(nomaRegex, "$1$1");
    }

    checkWord(word, answer = this.state.currentAnswer) {
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

    checkKanji(i, word, answer = this.state.currentAnswer) {
        // var ans = [...answer];
        // if (ans[position] === kanji) return GuessState.Right;
        // else if ([...word.substring(0, position)].filter(c => c === kanji).length < ans.filter(c => c === kanji).length) return GuessState.HalfRight;
        // else if (ans.includes("々")) return this.checkKanji(kanji, word, position, this.replaceNoma(answer));
        // else return GuessState.Wrong;
        var kanji = word[i];
        if (answer[i] === kanji) return 2;
        var aCount = 0, wCount = 0;
        for (let j = 0; j < answer.length; j++) {
            if (answer[j] === kanji) aCount += 1;
            if (j < i && word[j] === kanji) wCount += 1;
        }
        if (wCount < aCount) return 1;
        return 0;
    }

    kanjiClicked(text) {
        if (this.state.currentState === GameState.Standby || this.state.currentState === GameState.Playing)
        {
            this.setState({currentInput: this.state.currentInput + text});
        }
    }

    accepted(guess) {
        if (guess.length !== 4) return null;
        if (this.state.yojiAccepted.has(guess)) return "accepted";
        if (this.props.lenient && this.state.yojiLenient.has(guess)) return "lenient";
    }


    onSubmit(e) {
        //enter
        if (e.charCode === 13) {
            var guess = {
                text: this.state.currentInput, 
                accepted: this.accepted(this.state.currentInput)
            };
            if (guess.accepted != null) {
                guess.result = this.checkWord(this.state.currentInput);
                var newGuesses = [...this.state.guesses, guess];
                this.setState({
                    currentInput: "", 
                    guesses: newGuesses,
                    kanji: this.state.kanji.map(k => Object.assign({}, k, 
                        {state: [...guess.text].reduce((a, b, i) => (k.text !== b || a === GuessState.Right) ? 
                                    a : guess.result[i], k.state)})),
                })
                if (guess.result.every(r => r === GuessState.Right)) {
                    this.setState({currentState: GameState.Win});
                } else if (newGuesses.length === this.props.maxGuesses) {
                    this.setState({currentState: GameState.Lose});
                }
            } else {
                this.setState({invalidAnswer: true});
            }
        }
    }

    handleChange(e) {
        this.setState({currentInput: e.target.value, invalidAnswer: false});
    }

    render() {
        return (
            <div className='Game'>
                <div className='yoji-list'>
                    {this.state.guesses
                    .concat(Array(this.props.maxGuesses - this.state.guesses.length).fill({text: "", result: Array(4).fill(""), accepted: ""}))
                    .map((g, i) =>
                        <Yoji key={i} guess={g}/>
                    )}
                </div>
                <input 
                    value={this.state.currentInput} 
                    disabled={this.state.currentState !== GameState.Standby && this.state.currentState !== GameState.Playing}
                    onChange={this.handleChange} 
                    onKeyPress={this.onSubmit}
                    className={classNames({invalid: this.state.invalidAnswer})}
                    />
                <div className='kanji-list' 
                    style={{visibility: this.state.currentState !== GameState.Lose && this.state.currentState !== GameState.Win}}>
                {this.state.kanji.map((k, i) =>
                    <button key={i} onClick={this.kanjiClicked.bind(this, k.text)}>
                        <div className={classNames("kanjiList-kanji", k.state)}><Kanji key={i} kanji={k} /></div>
                    </button>
                )}
                </div>
                <ResultsModal 
                    gameState={this.state.currentState}
                    answer={this.state.currentAnswer}
                    restart={this.initialize}/>
            </div>
        )
    }
}