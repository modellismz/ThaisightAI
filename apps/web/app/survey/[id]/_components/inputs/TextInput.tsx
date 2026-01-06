'use client';

import styles from './inputs.module.css';

interface TextInputProps {
    value: string;
    onChange: (value: string) => void;
    multiline?: boolean;
    rows?: number;
    placeholder?: string;
}

export function TextInput({ value, onChange, multiline, rows = 3, placeholder }: TextInputProps) {
    if (multiline) {
        return (
            <textarea
                className={styles.textarea}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={rows}
                placeholder={placeholder || 'Enter your answer...'}
            />
        );
    }

    return (
        <input
            type="text"
            className={styles.textInput}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || 'Enter your answer...'}
        />
    );
}
