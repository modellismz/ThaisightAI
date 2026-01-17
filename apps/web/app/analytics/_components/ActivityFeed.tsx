'use client';

import Link from 'next/link';
import { Clock, CheckCircle2 } from 'lucide-react';
import styles from '../analytics.module.css';

interface ActivityItem {
    id: string;
    completedAt: string;
    surveyTitle: string;
    surveyId: string;
}

interface ActivityFeedProps {
    activities: ActivityItem[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
    if (!activities || activities.length === 0) return (
        <div className={styles.emptyFeed}>No recent activity</div>
    );

    return (
        <div className={styles.feedContainer}>
            {activities.map((activity) => (
                <div key={activity.id} className={styles.feedItem}>
                    <div className={styles.feedIcon}>
                        <CheckCircle2 size={16} />
                    </div>
                    <div className={styles.feedContent}>
                        <div className={styles.feedTitle}>
                            New response for <span className={styles.highlight}>{activity.surveyTitle}</span>
                        </div>
                        <div className={styles.feedTime}>
                            <Clock size={12} />
                            {new Date(activity.completedAt).toLocaleString()}
                        </div>
                    </div>
                    <Link href={`/surveys/${activity.surveyId}/analytics`} className={styles.feedLink}>
                        View
                    </Link>
                </div>
            ))}
        </div>
    );
}
