'use client';

import styles from './inputs.module.css';

interface SliderInputProps {
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step: number;
    minLabel?: string;
    maxLabel?: string;
    showValue?: boolean;
}

export function SliderInput({
    value,
    onChange,
    min,
    max,
    step,
    minLabel,
    maxLabel,
    showValue = true,
}: SliderInputProps) {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className={styles.sliderContainer}>
            {showValue && (
                <div className={styles.sliderValue}>{value}</div>
            )}
            <input
                type="range"
                className={styles.slider}
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                style={{
                    background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${percentage}%, var(--gray-200) ${percentage}%, var(--gray-200) 100%)`,
                }}
            />
            <div className={styles.sliderLabels}>
                <span>{minLabel || min}</span>
                <span>{maxLabel || max}</span>
            </div>
        </div>
    );
}
