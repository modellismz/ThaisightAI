'use client';

import { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { BarChart2, Users, FileText, CheckCircle2 } from 'lucide-react';
import styles from './GlobalAnalyticsBar.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface GlobalStats {
    totalSurveys: number;
    activeSurveys: number;
    totalResponses: number;
    avgResponsesPerSurvey: number;
}

const containerVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: {
            staggerChildren: 0.1,
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
        opacity: 1, 
        scale: 1,
        transition: { type: "spring" }
    }
};

export function GlobalAnalyticsBar() {
    const [stats, setStats] = useState<GlobalStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            try {
                const res = await fetch(`${API_BASE}/api/analytics/summary`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {
                console.error('Failed to load global stats', err);
            } finally {
                setIsLoading(false);
            }
        }
        loadStats();
    }, []);

    if (isLoading) return null; // Or a skeleton loader
    if (!stats) return null; 

    return (
        <motion.div 
            className={styles.container}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div className={styles.statItem} variants={itemVariants}>
                <div className={`${styles.iconBase} ${styles.iconPurple}`}>
                    <FileText size={20} />
                </div>
                <div>
                    <span className={styles.value}>{stats.totalSurveys}</span>
                    <span className={styles.label}>Total Surveys</span>
                </div>
            </motion.div>

            <div className={styles.divider} />

            <motion.div className={styles.statItem} variants={itemVariants}>
                <div className={`${styles.iconBase} ${styles.iconGreen}`}>
                    <CheckCircle2 size={20} />
                </div>
                <div>
                    <span className={styles.value}>{stats.activeSurveys}</span>
                    <span className={styles.label}>Active Now</span>
                </div>
            </motion.div>

            <div className={styles.divider} />

            <motion.div className={styles.statItem} variants={itemVariants}>
                <div className={`${styles.iconBase} ${styles.iconBlue}`}>
                    <Users size={20} />
                </div>
                <div>
                    <span className={styles.value}>{stats.totalResponses}</span>
                    <span className={styles.label}>Total Responses</span>
                </div>
            </motion.div>

            <div className={styles.divider} />
            
            <motion.div className={styles.statItem} variants={itemVariants}>
                <div className={`${styles.iconBase} ${styles.iconOrange}`}>
                    <BarChart2 size={20} />
                </div>
                <div>
                    <span className={styles.value}>{stats.avgResponsesPerSurvey}</span>
                    <span className={styles.label}>Avg. Responses</span>
                </div>
            </motion.div>
        </motion.div>
    );
}
