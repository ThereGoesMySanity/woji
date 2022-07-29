import classNames from "classnames";
import React from "react";
import { InputKanji } from "./components/InputKanji";
import { Kanji } from "./components/Kanji";
import ResultsModal from "./components/ResultsModal";
import { Yoji } from "./components/Yoji";

import "./Game.css";
import { GuessState } from "./model/GuessState";
import { WojiGame } from "./model/WojiGame";

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
        this.onSubmit = this.onSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.initialize = this.initialize.bind(this);
    }

    getGuesses() {
        if (this.props.freeplay) return this.state.guesses;
        else return this.props.getDaily();
    }
    addGuess(g) {
        if (this.props.freeplay) this.setState({guesses: [...this.state.guesses, g]});
        else this.props.setDaily([...this.props.getDaily(), g]);
    }

    initialize() {
        let rand;
        if (!this.props.freeplay) {
            rand = require('random-seed').create(new Date().toDateString());
        } else {
            rand = require('random-seed').create();
        }
        this.setState({
            guesses: [],
            currentState: GameState.Standby,
            currentInput: "",
            currentAnswer: this.state.yojiAnswers[rand(this.state.yojiAnswers.length)],
            invalidAnswer: false,
        }, () => {
            var newKanji = Array.from(this.state.kanji);
            newKanji.forEach(k => k.state = GuessState.NotGuessed);
            if (this.props.easymode) {
                var freebie = this.state.currentAnswer.charAt(rand(4));
                newKanji.find(k => k.text === freebie).state = GuessState.HalfRight;
            }
            this.setState({ kanji: newKanji });
            for (let i = 0; i < this.getGuesses().length; i++) {
                //replay saved guesses
                this.applyGuess(this.getGuesses()[i], i);
            }
            console.log(this.state.currentAnswer);
        });
    }

    async componentDidMount() {
        let [kanji, yojiAccepted, yojiLenient, yojiAnswers] = await Promise.all([
            fetch(this.props.kanji).then(k => k.text()),
            fetch("/woji/yoji_all.txt").then(k => k.text()),
            fetch("/woji/yoji_lenient.txt").then(k => k.text()),
            fetch(this.props.yojiAnswers).then(k => k.text()),
        ]);
        this.setState({
            kanji: kanji.split("\n").map(c => {return{text: c, state: GuessState.NotGuessed}}),
            yojiAccepted: new Set(yojiAccepted.split("\n")),
            yojiLenient: new Set(yojiLenient.split("\n")),
            yojiAnswers: yojiAnswers.split("\n"),
        }, this.initialize);
    }
    componentDidUpdate(prevProps) {
        if (this.props.freeplay !== prevProps.freeplay || 
            (this.state.currentState === GameState.Standby && this.props.easymode !== prevProps.easymode)) {
            this.initialize();
        } 
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
            var input = this.state.currentInput.trim();
            var guess = {
                text: input,
                accepted: this.accepted(input),
            };
            if (guess.accepted != null) {
                guess.result = WojiGame.checkWord(input, this.state.currentAnswer);
                var guessCount = this.getGuesses().length;
                this.addGuess(guess);
                this.applyGuess(guess, guessCount);
            } else {
                this.setState({ invalidAnswer: true });
            }
        }
    }
    applyGuess(guess, guessCount) {
        this.setState({
            currentInput: "",
            kanji: this.state.kanji.map(k => Object.assign({}, k,
                {
                    state: [...guess.text].reduce((a, b, i) => (k.text !== b || a === GuessState.Right) ?
                        a : guess.result[i], k.state)
                })),
        })
        if (guess.result.every(r => r === GuessState.Right)) {
            this.setState({ currentState: GameState.Win });
        } else if (guessCount + 1 === this.props.maxGuesses) {
            this.setState({ currentState: GameState.Lose });
        }
    }

    handleChange(e) {
        this.setState({currentInput: e.target.value, invalidAnswer: false});
    }

    render() {
        return (
            <div className='Game'>
                <div className='yoji-list'>
                    {this.getGuesses()
                    .concat(Array(this.props.maxGuesses - this.getGuesses().length).fill({text: "", result: Array(4).fill(""), accepted: ""}))
                    .map((g, i) =>
                        <Yoji key={i} guess={g}/>
                    )}
                </div>
                <div className="input">
                    <input 
                        value={this.state.currentInput} 
                        disabled={this.state.currentState !== GameState.Standby && this.state.currentState !== GameState.Playing}
                        onChange={this.handleChange} 
                        onKeyPress={this.onSubmit}
                        className={classNames("input", {invalid: this.state.invalidAnswer})}
                        />
                    <div className="input-kanji-list">
                        {[...this.state.currentInput].filter(k => WojiGame.isKanji(k)).concat()
                        .map((k, i) => <InputKanji key={i} kanji={this.state.kanji.find(ka => ka.text === k)}/>)}
                    </div>
                </div>
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
                    freeplay={this.props.freeplay}
                    restart={this.initialize}/>
            </div>
        )
    }
}