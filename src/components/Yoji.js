import classNames from 'classnames';
import React from 'react';
import { Kanji } from './Kanji';
import './Yoji.css';
export const Yoji = (props) => (
    <div className={classNames("yoji", props.guess.accepted)}>
        {[...props.guess.text]
            .concat(Array(4 - props.guess.text.length).fill(""))
            .map((k, i) => <Kanji key={i} kanji={{text:k, state:props.guess.result[i]}}>{k}</Kanji>)}
    </div>
);




