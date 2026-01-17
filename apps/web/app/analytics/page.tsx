'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { Loader2, ArrowLeft, BarChart2, Calendar, FileText, Activity, Users, CheckCircle2 } from 'lucide-react';
import { UserProfileDropdown } from '../components/UserProfileDropdown';
import { TrafficChart } from './_components/TrafficChart';
import { ActivityFeed } from './_components/ActivityFeed';
import styles from './analytics.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface SurveyStats {
    id: string;
    title: string;
    status: 'draft' | 'published' | 'closed';
    createdAt: string;
    responseCount: number;
    lastResponseAt?: string;
}

interface DashboardData {
    globalStats: any;
    surveys: SurveyStats[];
    dailyTrends: { date: string; count: number }[];
    recentActivity: any[];
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1, 
        transition: { staggerChildren: 0.1 } 
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export default function AnalyticsDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const res = await fetch(`${API_BASE}/api/analytics/dashboard`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (error) {
                console.error('Failed to load dashboard:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 className={styles.spinner} size={32} />
                <p>Loading global analytics...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Link href="/surveys" className={styles.backBtn}>
                <ArrowLeft size={16} /> Back to Surveys
            </Link>

            <div className={styles.ambientGlow} />

            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Analytics Dashboard</h1>
                    <p className={styles.subtitle}>Overview of all survey performance and insights</p>
                </div>
                <UserProfileDropdown />
            </header>

            <motion.div 
                className={styles.bentoGrid}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Global Stats Row */}
                <motion.div className={`${styles.card} ${styles.colSpan3} ${styles.statCard}`} variants={itemVariants}>
                    <div className={`${styles.iconBase} ${styles.iconPurple}`}>
                        <FileText size={20} />
                    </div>
                    <div>
                        <div className={styles.statValue}>{data?.globalStats.totalSurveys || 0}</div>
                        <div className={styles.statLabel}>Total Surveys</div>
                    </div>
                </motion.div>

                <motion.div className={`${styles.card} ${styles.colSpan3} ${styles.statCard}`} variants={itemVariants}>
                     <div className={`${styles.iconBase} ${styles.iconGreen}`}>
                        <CheckCircle2 size={20} />
                    </div>
                    <div>
                        <div className={styles.statValue}>{data?.globalStats.activeSurveys || 0}</div>
                        <div className={styles.statLabel}>Active Now</div>
                    </div>
                </motion.div>

                <motion.div className={`${styles.card} ${styles.colSpan3} ${styles.statCard}`} variants={itemVariants}>
                     <div className={`${styles.iconBase} ${styles.iconBlue}`}>
                        <Users size={20} />
                    </div>
                    <div>
                         <div className={styles.statValue}>{data?.globalStats.totalResponses || 0}</div>
                         <div className={styles.statLabel}>Total Responses</div>
                    </div>
                </motion.div>

                <motion.div className={`${styles.card} ${styles.colSpan3} ${styles.statCard}`} variants={itemVariants}>
                     <div className={`${styles.iconBase} ${styles.iconOrange}`}>
                        <BarChart2 size={20} />
                    </div>
                    <div>
                        <div className={styles.statValue}>
                            {data?.globalStats.totalSurveys > 0 
                                ? Math.round(data?.globalStats.totalResponses / data?.globalStats.totalSurveys) 
                                : 0}
                        </div>
                        <div className={styles.statLabel}>Avg. Responses</div>
                    </div>
                </motion.div>

                {/* Traffic Chart */}
                <motion.div className={`${styles.card} ${styles.colSpan8}`} variants={itemVariants}>
                    <h2 className={styles.sectionTitle}>
                        <Activity size={20} />
                        Response Traffic (Last 7 Days)
                    </h2>
                    <TrafficChart data={data?.dailyTrends || []} />
                </motion.div>

                {/* Activity Feed */}
                <motion.div className={`${styles.card} ${styles.colSpan4}`} variants={itemVariants}>
                    <h2 className={styles.sectionTitle}>
                       <Calendar size={20} />
                       Recent Activity
                    </h2>
                    <ActivityFeed activities={data?.recentActivity || []} />
                </motion.div>

                {/* Top Surveys List (Replces Table) */}
                <motion.div className={`${styles.card} ${styles.colSpan12}`} variants={itemVariants}>
                    <h2 className={styles.sectionTitle}>
                        <FileText size={20} />
                        Top Performing Surveys
                    </h2>
                    
                    <div className={styles.topSurveysGrid}>
                        {data?.surveys.slice(0, 5).map((survey: SurveyStats, index: number) => (
                            <Link 
                                href={`/surveys/${survey.id}/analytics`} 
                                key={survey.id} 
                                className={styles.topSurveyCard}
                            >
                                <div className={styles.topSurveyHeader}>
                                    <span className={styles.rankBadge}>{index + 1}</span>
                                    <h3 className={styles.topSurveyTitle}>{survey.title}</h3>
                                    <span className={styles[`status${survey.status.charAt(0).toUpperCase() + survey.status.slice(1)}`]}>
                                        {survey.status}
                                    </span>
                                </div>
                                <div className={styles.topSurveyStats}>
                                    <div className={styles.topSurveyStat}>
                                        <span className={styles.statLabel}>Responses</span>
                                        <span className={styles.statValueSmall}>{survey.responseCount}</span>
                                    </div>
                                    <div className={styles.topSurveyStat}>
                                        <span className={styles.statLabel}>Last Active</span>
                                        <span className={styles.statValueSmall}>
                                            {survey.lastResponseAt 
                                                ? new Date(survey.lastResponseAt).toLocaleDateString() 
                                                : '-'}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.topSurveyAction}>
                                    View Analytics <ArrowLeft size={16} className={styles.actionIcon} style={{transform: 'rotate(180deg)'}}/>
                                </div>
                            </Link>
                        ))}
                        {data?.surveys.length === 0 && (
                            <div className={styles.emptyState}>
                                <FileText size={48} style={{opacity: 0.2, marginBottom: '16px'}} />
                                <div>No surveys found</div>
                                <p style={{fontSize: '0.875rem', marginTop: '8px', opacity: 0.6}}>Create your first survey to see analytics here.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
