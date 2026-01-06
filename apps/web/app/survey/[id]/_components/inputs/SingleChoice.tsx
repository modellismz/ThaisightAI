'use client';

import { useState } from 'react';
import styles from './inputs.module.css';

interface Choice {
    id: string;
    text: string;
}

interface SingleChoiceProps {
    value: string;
    onChange: (value: string) => void;
    choices: Choice[];
    displayStyle: 'radio' | 'dropdown';
    allowOther?: boolean;
    otherLabel?: string;
}

export function SingleChoice({
    value,
    onChange,
    choices,
    displayStyle,
    allowOther,
    otherLabel = 'Other',
}: SingleChoiceProps) {
    const [otherText, setOtherText] = useState('');
    const isOtherSelected = value?.startsWith('__other:');

    if (displayStyle === 'dropdown') {
        return (
            <select
                className={styles.select}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="">Select an option...</option>
                {choices.map((choice) => (
                    <option key={choice.id} value={choice.id}>
                        {choice.text}
                    </option>
                ))}
                {allowOther && (
                    <option value="__other:">{otherLabel}</option>
                )}
            </select>
        );
    }

    return (
        <div className={styles.choiceList}>
            {choices.map((choice) => (
                <label key={choice.id} className={styles.choiceItem}>
                    <input
                        type="radio"
                        name="single-choice"
                        className={styles.radio}
                        checked={value === choice.id}
                        onChange={() => onChange(choice.id)}
                    />
                    <span className={styles.choiceText}>{choice.text}</span>
                </label>
            ))}
            {allowOther && (
                <label className={styles.choiceItem}>
                    <input
                        type="radio"
                        name="single-choice"
                        className={styles.radio}
                        checked={isOtherSelected}
                        onChange={() => onChange(`__other:${otherText}`)}
                    />
                    <span className={styles.choiceText}>{otherLabel}</span>
                    {isOtherSelected && (
                        <input
                            type="text"
                            className={styles.otherInput}
                            value={otherText}
                            onChange={(e) => {
                                setOtherText(e.target.value);
                                onChange(`__other:${e.target.value}`);
                            }}
                            placeholder="Please specify..."
                            autoFocus
                        />
                    )}
                </label>
            )}
        </div>
    );
}
