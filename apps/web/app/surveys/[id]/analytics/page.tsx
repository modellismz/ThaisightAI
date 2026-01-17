'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Download, Loader2, Users, Clock, TrendingUp,
    BarChart2, PieChart, FileText, RefreshCw
} from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import styles from './analytics.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface AnalyticsData {
    surveyId: string;
    totalResponses: number;
    avgDurationSeconds: number;
    questionStats: Record<string, {
        questionId: string;
        values: any[];
        counts: Record<string, number>;
    }>;
    config: any;
    responses: any[];
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 10
        }
    }
};

export default function AnalyticsPage() {
    const params = useParams();
    const surveyId = params.id as string;

    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadAnalytics();
    }, [surveyId]);

    async function loadAnalytics() {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch(`${API_BASE}/api/surveys/${surveyId}/analytics`);
            if (!response.ok) throw new Error('Failed to load analytics');
            const data = await response.json();
            setData(data);
        } catch (error) {
            console.error('Error loading analytics:', error);
            setError('Failed to load analytics data');
        } finally {
            setIsLoading(false);
        }
    }

    async function exportCSV() {
        window.open(`${API_BASE}/api/surveys/${surveyId}/export`, '_blank');
    }

    function formatDuration(seconds: number): string {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    }

    function getQuestionText(questionId: string): string {
        if (!data?.config?.blocks) return questionId;
        for (const block of data.config.blocks) {
            const question = block.questions?.find((q: any) => q.id === questionId);
            if (question) return question.text || questionId;
        }
        return questionId;
    }

    function getQuestionType(questionId: string): string {
        if (!data?.config?.blocks) return 'unknown';
        for (const block of data.config.blocks) {
            const question = block.questions?.find((q: any) => q.id === questionId);
            if (question) return question.type;
        }
        return 'unknown';
    }

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 className={styles.spinner} size={40} />
                <p>Loading analytics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <p>{error}</p>
                <button onClick={loadAnalytics} className={styles.retryBtn}>
                    <RefreshCw size={16} />
                    Retry
                </button>
            </div>
        );
    }

    return (
        <motion.div 
            className={styles.container}
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <Link href="/surveys" className={styles.backBtn}>
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <motion.h1 
                            className={styles.title}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            Survey Analytics
                        </motion.h1>
                        <motion.p 
                            className={styles.subtitle}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            Response data and insights
                        </motion.p>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <button onClick={loadAnalytics} className={styles.iconBtn} title="Refresh">
                        <RefreshCw size={18} />
                    </button>
                    <button onClick={exportCSV} className={styles.exportBtn}>
                        <Download size={18} />
                        Export CSV
                    </button>
                </div>
            </header>

            {/* Stats Cards */}
            <motion.section 
                className={styles.statsGrid}
                variants={containerVariants}
            >
                <motion.div className={styles.statCard} variants={itemVariants} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                    <div className={styles.statIcon}>
                        <Users size={24} />
                    </div>
                    <div className={styles.statContent}>
                        <motion.span 
                            className={styles.statValue}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", delay: 0.2 }}
                        >
                            {data?.totalResponses || 0}
                        </motion.span>
                        <span className={styles.statLabel}>Total Responses</span>
                    </div>
                </motion.div>

                <motion.div className={styles.statCard} variants={itemVariants} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                    <div className={styles.statIcon}>
                        <Clock size={24} />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>
                            {formatDuration(data?.avgDurationSeconds || 0)}
                        </span>
                        <span className={styles.statLabel}>Avg. Duration</span>
                    </div>
                </motion.div>

                <motion.div className={styles.statCard} variants={itemVariants} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                    <div className={styles.statIcon}>
                        <TrendingUp size={24} />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>
                            {data?.questionStats ? Object.keys(data.questionStats).length : 0}
                        </span>
                        <span className={styles.statLabel}>Questions Answered</span>
                    </div>
                </motion.div>

                <motion.div className={styles.statCard} variants={itemVariants} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                    <div className={styles.statIcon}>
                        <BarChart2 size={24} />
                    </div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>
                            {data?.responses?.length || 0}
                        </span>
                        <span className={styles.statLabel}>Last 50 Responses</span>
                    </div>
                </motion.div>
            </motion.section>

            {/* Question Breakdown */}
            <section className={styles.section}>
                <motion.h2 
                    className={styles.sectionTitle}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                >
                    <PieChart size={20} />
                    Question Breakdown
                </motion.h2>

                {data?.questionStats && Object.keys(data.questionStats).length > 0 ? (
                    <motion.div 
                        className={styles.questionGrid}
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        {Object.entries(data.questionStats).map(([questionId, stats]) => (
                            <QuestionChart
                                key={questionId}
                                questionId={questionId}
                                questionText={getQuestionText(questionId)}
                                questionType={getQuestionType(questionId)}
                                stats={stats}
                                totalResponses={data.totalResponses}
                            />
                        ))}
                    </motion.div>
                ) : (
                    <div className={styles.emptyState}>
                        <FileText size={48} className={styles.emptyIcon} />
                        <p>No response data yet</p>
                        <span>Share your survey to start collecting responses</span>
                    </div>
                )}
            </section>

            {/* Recent Responses Table */}
            {data?.responses && data.responses.length > 0 && (
                <section className={styles.section}>
                    <motion.h2 
                        className={styles.sectionTitle}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <FileText size={20} />
                        Recent Responses
                    </motion.h2>

                    <motion.div 
                        className={styles.tableWrapper}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Response ID</th>
                                    <th>Completed</th>
                                    <th>Duration</th>
                                    <th>Answers</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.responses.slice(0, 10).map((response: any, i) => (
                                    <motion.tr 
                                        key={response.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <td className={styles.idCell}>{response.id?.slice(0, 8)}...</td>
                                        <td>{new Date(response.completed_at).toLocaleDateString()}</td>
                                        <td>{formatDuration(response.duration_seconds || 0)}</td>
                                        <td>{Object.keys(response.answers || {}).length} answers</td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                </section>
            )}
        </motion.div>
    );
}

// Question Chart Component
function QuestionChart({
    questionId,
    questionText,
    questionType,
    stats,
    totalResponses
}: {
    questionId: string;
    questionText: string;
    questionType: string;
    stats: any;
    totalResponses: number;
}) {
    const counts = stats.counts || {};
    const sortedEntries = Object.entries(counts)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 8); // Top 8 answers

    // Common variant for cards
    const cardVariant: Variants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { 
            opacity: 1, 
            scale: 1,
            transition: { duration: 0.5 }
        }
    };

    // For NPS questions, calculate score
    if (questionType === 'nps') {
        const values = stats.values.filter((v: any) => typeof v === 'number');
        const promoters = values.filter((v: number) => v >= 9).length;
        const detractors = values.filter((v: number) => v <= 6).length;
        const npsScore = values.length > 0
            ? Math.round(((promoters - detractors) / values.length) * 100)
            : 0;

        return (
            <motion.div className={styles.questionCard} variants={cardVariant}>
                <h3 className={styles.questionTitle}>{questionText}</h3>
                <div className={styles.npsDisplay}>
                    <motion.div 
                        className={`${styles.npsScore} ${npsScore >= 0 ? styles.npsPositive : styles.npsNegative}`}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                    >
                        {npsScore > 0 ? '+' : ''}{npsScore}
                    </motion.div>
                    <span className={styles.npsLabel}>NPS Score</span>
                </div>
                <div className={styles.npsBreakdown}>
                    <div className={styles.npsGroup}>
                        <span className={styles.npsPromoter}>{promoters}</span>
                        <span>Promoters</span>
                    </div>
                    <div className={styles.npsGroup}>
                        <span className={styles.npsPassive}>{values.length - promoters - detractors}</span>
                        <span>Passives</span>
                    </div>
                    <div className={styles.npsGroup}>
                        <span className={styles.npsDetractor}>{detractors}</span>
                        <span>Detractors</span>
                    </div>
                </div>
            </motion.div>
        );
    }

    // For slider questions, show average
    if (questionType === 'slider') {
        const values = stats.values.filter((v: any) => typeof v === 'number');
        const avg = values.length > 0
            ? Math.round(values.reduce((a: number, b: number) => a + b, 0) / values.length)
            : 0;

        return (
            <motion.div className={styles.questionCard} variants={cardVariant}>
                <h3 className={styles.questionTitle}>{questionText}</h3>
                <div className={styles.avgDisplay}>
                    <motion.span 
                        className={styles.avgValue}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        {avg}
                    </motion.span>
                    <span className={styles.avgLabel}>Average</span>
                </div>
                <div className={styles.responseCount}>{values.length} responses</div>
            </motion.div>
        );
    }

    // For choice questions, show bar chart
    return (
        <motion.div className={styles.questionCard} variants={cardVariant}>
            <h3 className={styles.questionTitle}>{questionText}</h3>
            <div className={styles.barChart}>
                {sortedEntries.map(([answer, count], index) => {
                    const numericCount = count as number;
                    const percentage = totalResponses > 0
                        ? Math.round((numericCount / totalResponses) * 100)
                        : 0;
                    return (
                        <div key={answer} className={styles.barRow}>
                            <div className={styles.barLabel}>{answer}</div>
                            <div className={styles.barContainer}>
                                <motion.div
                                    className={styles.bar}
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${percentage}%` }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                                />
                                <motion.span 
                                    className={styles.barValue}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 + (index * 0.1) }}
                                >
                                    {numericCount} ({percentage}%)
                                </motion.span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}
