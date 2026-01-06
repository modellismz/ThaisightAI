'use client';

import styles from './ProgressBar.module.css';

interface ProgressBarProps {
    progress: number;
    position: 'top' | 'bottom';
}

export function ProgressBar({ progress, position }: ProgressBarProps) {
    return (
        <div className={`${styles.container} ${styles[position]}`}>
            <div className={styles.track}>
                <div
                    className={styles.fill}
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
            </div>
            <span className={styles.label}>{Math.round(progress)}% complete</span>
        </div>
    );
}
