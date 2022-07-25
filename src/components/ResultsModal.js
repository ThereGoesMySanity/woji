import React from "react";
import Modal from "react-modal";

import {GameState} from "../Game";

import "./ResultsModal.css";

Modal.setAppElement("#root");

export default class ResultsModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {close: false};
    }

    componentDidUpdate(prevProps) {
        if (this.props.gameState !== prevProps.gameState) {
            this.setState({close: false});
        }
    }
    render() {
        return (
            <Modal className="results" 
                    overlayClassName="results-overlay" 
                    onRequestClose={(e) => this.setState({close:true})}
                    isOpen={!this.state.close && (this.props.gameState === GameState.Lose || this.props.gameState === GameState.Win)}>
                {this.props.gameState === GameState.Win && (
                    <div>
                        You win!
                    </div>
                )}
                {this.props.gameState === GameState.Lose && (
                    <div>
                        You lose<br/>
                        Correct answer: {this.props.answer}
                    </div>
                )}
                <br/>
                <button hidden={!this.props.freeplay} onClick={this.props.restart}>Restart</button>
            </Modal>
        );
    }
}