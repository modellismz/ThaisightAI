'use client';

import { XCircle, Clock } from 'lucide-react';
import styles from './QuotaFullPage.module.css';

interface QuotaFullPageProps {
    message?: string;
}

export function QuotaFullPage({ message }: QuotaFullPageProps) {
    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.iconWrapper}>
                    <XCircle className={styles.icon} size={64} />
                </div>
                <h1 className={styles.title}>Survey Closed</h1>
                <p className={styles.message}>
                    {message || 'This survey has reached its maximum number of responses and is no longer accepting new submissions.'}
                </p>
                <div className={styles.infoBox}>
                    <Clock size={18} />
                    <span>Thank you for your interest</span>
                </div>
            </div>
        </div>
    );
}
