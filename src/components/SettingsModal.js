import React from "react";
import Modal from "react-modal";

import "./SettingsModal.css";

export default class SettingsModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {open: false};
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(e, prop = "value") {
        this.props.update({[e.target.id]: e.target[prop]});
    }

    render() {
        const freeplay = this.props.settingsState.freeplay;
        const lenient = this.props.settingsState.lenient;
        const easymode = this.props.settingsState.easymode;
        const selectValue = this.props.settingsState.selectValue;
        return (
            <>
                <button onClick={() => this.setState({ open: true })}>Settings</button>
                <Modal className="settings"
                    overlayClassName="settings-overlay" 
                    onRequestClose={() => this.setState({ open: false })}
                    isOpen={this.state.open}>
                    <select onChange={this.handleChange} id="selectValue" value={selectValue}>
                        {this.props.lists.map((l, i) =>
                            <option key={i} value={i}>{l.desc} ({l.totalKanji}字, {l.totalYoji}四字)</option>
                        )}
                    </select>
                    <div style={{ margin: '20px', textAlign: 'left'}}>
                        <input onChange={(e) => this.handleChange(e, "checked")} type="checkbox" id="freeplay" checked={freeplay === true} />Free play<br/>
                        <input onChange={(e) => this.handleChange(e, "checked")} type="checkbox" id="lenient" checked={lenient === true} />Lenient yojijukugo mode (any word with 4 kanji counts)<br />
                        <input onChange={(e) => this.handleChange(e, "checked")} type="checkbox" id="easymode" checked={easymode === true} />Easy(ish) Mode: 1 kanji free
                    </div>
                </Modal>
            </>
        );
    }
}