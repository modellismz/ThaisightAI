'use client';

import styles from './inputs.module.css';

interface DateInputProps {
    value: string;
    onChange: (value: string) => void;
    includeTime?: boolean;
    minDate?: string;
    maxDate?: string;
}

export function DateInput({
    value,
    onChange,
    includeTime,
    minDate,
    maxDate,
}: DateInputProps) {
    return (
        <input
            type={includeTime ? 'datetime-local' : 'date'}
            className={styles.dateInput}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            min={minDate}
            max={maxDate}
        />
    );
}
