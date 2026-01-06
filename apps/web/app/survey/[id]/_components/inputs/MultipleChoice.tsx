'use client';

import { useState } from 'react';
import styles from './inputs.module.css';

interface Choice {
    id: string;
    text: string;
}

interface MultipleChoiceProps {
    value: string[];
    onChange: (value: string[]) => void;
    choices: Choice[];
    allowOther?: boolean;
    otherLabel?: string;
}

export function MultipleChoice({
    value,
    onChange,
    choices,
    allowOther,
    otherLabel = 'Other',
}: MultipleChoiceProps) {
    const [otherText, setOtherText] = useState('');
    const otherValue = value.find((v) => v.startsWith('__other:'));
    const isOtherSelected = !!otherValue;

    const toggleChoice = (choiceId: string) => {
        if (value.includes(choiceId)) {
            onChange(value.filter((v) => v !== choiceId));
        } else {
            onChange([...value, choiceId]);
        }
    };

    const toggleOther = () => {
        if (isOtherSelected) {
            onChange(value.filter((v) => !v.startsWith('__other:')));
        } else {
            onChange([...value, `__other:${otherText}`]);
        }
    };

    return (
        <div className={styles.choiceList}>
            {choices.map((choice) => (
                <label key={choice.id} className={styles.choiceItem}>
                    <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={value.includes(choice.id)}
                        onChange={() => toggleChoice(choice.id)}
                    />
                    <span className={styles.choiceText}>{choice.text}</span>
                </label>
            ))}
            {allowOther && (
                <label className={styles.choiceItem}>
                    <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={isOtherSelected}
                        onChange={toggleOther}
                    />
                    <span className={styles.choiceText}>{otherLabel}</span>
                    {isOtherSelected && (
                        <input
                            type="text"
                            className={styles.otherInput}
                            value={otherText}
                            onChange={(e) => {
                                setOtherText(e.target.value);
                                const filtered = value.filter((v) => !v.startsWith('__other:'));
                                onChange([...filtered, `__other:${e.target.value}`]);
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
