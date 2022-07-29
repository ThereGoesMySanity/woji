import classNames from "classnames";
import { GuessState } from "../model/GuessState";

export const InputKanji = (props) => (
    <div className={classNames("inputKanji", props.kanji?.state ?? GuessState.Wrong)} style={{width: "1.02em"}}/>
);