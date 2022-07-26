import React from 'react';
import './App.css';
import SettingsModal from './components/SettingsModal';
import Game from './Game';
import lists from './lists.json';
import {useState} from 'react';
import update from 'immutability-helper';

import { useLocalStorage } from './useLocalStorage';

export default App;

function App() {
    const [state, setState] = useLocalStorage("state", 
        {
          selectValue: 0,
          lenient: false,
          freeplay: false,
          easymode: false,
          dailyHistory: new Array(lists.length).fill({}),
        });
    const [salt, setSalt] = useState(0);
    const getDaily = () => {
      var date = new Date().toDateString();
      if (!(date in state.dailyHistory[state.selectValue])) {
        state.dailyHistory[state.selectValue][date] = [];
      }
      return state.dailyHistory[state.selectValue][date];
    };
    const setDaily = (g) => {
      var date = new Date().toDateString();
      setState(update(state, {dailyHistory: {[state.selectValue]: {$merge: {[date]: g}}}}));
    };
    return (
      <div className="App">
        <header className="App-header">
            <div style={{justifySelf: 'center', alignSelf: 'center', gridColumn: '1', gridRow: '1'}}>
              ヲ字
            </div>
            <div style={{display: 'flex', justifySelf: 'end', justifyContent: 'right', alignItems: 'center', gridColumn: '1', gridRow: '1'}}>
              <button hidden={!state.freeplay} disabled={!state.freeplay} onClick={() => setSalt(salt + 1)}>Restart</button>
              <SettingsModal lists={lists} settingsState={state} update={(s) => setState(update(state, {$merge: s}))}/>
            </div>
        </header>
        <Game 
          maxGuesses={8}
          key={state.selectValue + salt}
          lenient={state.lenient}
          easymode={state.easymode}
          freeplay={state.freeplay}
          kanji={"/woji/kanji_"+lists[state.selectValue].postfix+".txt"}
          yojiAnswers={"/woji/yoji_"+lists[state.selectValue].postfix+".txt"}
          getDaily={getDaily}
          setDaily={setDaily}
        />
      </div>
    );
}