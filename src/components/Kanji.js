import classNames from "classnames";
import React from "react";

export const Kanji = (props) => (
    <span lang="jp" className={classNames("kanji", props.kanji.state)}>{props.kanji.text}</span>
);