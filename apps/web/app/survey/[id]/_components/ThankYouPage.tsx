'use client';

import { CheckCircle2 } from 'lucide-react';
import styles from './ThankYouPage.module.css';

interface ThankYouPageProps {
    message: string;
    redirectUrl?: string;
}

export function ThankYouPage({ message, redirectUrl }: ThankYouPageProps) {
    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.iconWrapper}>
                    <CheckCircle2 size={64} className={styles.icon} />
                </div>
                <h1 className={styles.title}>Survey Complete!</h1>
                <p className={styles.message}>{message}</p>
                {redirectUrl && (
                    <a href={redirectUrl} className={styles.link}>
                        Continue →
                    </a>
                )}
            </div>
        </div>
    );
}
