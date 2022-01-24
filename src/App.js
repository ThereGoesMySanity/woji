import React from 'react';
import './App.css';
import Game from './Game';
import lists from './lists.json';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.restart = this.restart.bind(this);
    this.state = {selectValue: 0, lenient: false, easymode: false, salt: 0};
  }
  handleChange(e) {
    this.setState({[e.target.id]: e.target.value});
  }
  restart() {
    this.setState({salt: this.state.salt + 1});
  }
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <select onChange={this.handleChange} id="selectValue">
            {lists.map((l, i) =>
              <option key={i} value={i}>{l.desc} ({l.totalKanji}字, {l.totalYoji}四字)</option>
            )}
          </select>
          <div style={{margin: '20px'}}>
            <input onChange={this.handleChange} type="checkbox" id="lenient" value={this.state.lenient}/>Lenient yojijukugo mode (any word with 4 kanji counts)<br/>
            <input onChange={this.handleChange} type="checkbox" id="easymode" value={this.state.lenient}/>Easy(ish) Mode: 1 kanji free
          </div>
          <button onClick={this.restart}>Restart</button>
        </header>
        <Game 
          maxGuesses={8}
          key={this.state.selectValue + this.state.salt}
          lenient={this.state.lenient}
          easymode={this.state.easymode}
          kanji={"./kanji_"+lists[this.state.selectValue].postfix+".txt"}
          yojiAnswers={"./yoji_"+lists[this.state.selectValue].postfix+".txt"}/>
      </div>
    );
  }
}
