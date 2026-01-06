'use client';

import styles from './inputs.module.css';

interface NPSInputProps {
    value: number | null;
    onChange: (value: number) => void;
    minLabel?: string;
    maxLabel?: string;
}

export function NPSInput({
    value,
    onChange,
    minLabel = 'Not at all likely',
    maxLabel = 'Extremely likely',
}: NPSInputProps) {
    return (
        <div className={styles.npsContainer}>
            <div className={styles.npsScale}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <button
                        key={n}
                        type="button"
                        className={`${styles.npsButton} ${value === n ? styles.npsSelected : ''} ${getNPSClass(n)}`}
                        onClick={() => onChange(n)}
                    >
                        {n}
                    </button>
                ))}
            </div>
            <div className={styles.npsLabels}>
                <span>{minLabel}</span>
                <span>{maxLabel}</span>
            </div>
        </div>
    );
}

function getNPSClass(n: number): string {
    if (n <= 6) return styles.npsDetractor;
    if (n <= 8) return styles.npsPassive;
    return styles.npsPromoter;
}
