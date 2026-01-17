'use client';

import { useState, useEffect, useRef } from 'react';
import { ShareModal } from './_components/ShareModal';
import { UserProfileDropdown } from '../components/UserProfileDropdown';
import Link from 'next/link';
import { Plus, FileText, MoreVertical, Eye, Edit2, Trash2, Copy, BarChart2, Loader2, QrCode, LogOut } from 'lucide-react';
import styles from './surveys.module.css';
import { useUser } from '../context/UserContext';
import { signOut } from 'next-auth/react';
import Image from 'next/image';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Survey {
    id: string;
    title: string;
    description?: string;
    status: 'draft' | 'published' | 'closed';
    created_at: string;
    updated_at: string;
}

export default function SurveysPage() {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [activeShareSurvey, setActiveShareSurvey] = useState<Survey | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Click outside to close menu
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        loadSurveys();
    }, []);

    async function loadSurveys() {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE}/api/surveys`);
            if (!response.ok) throw new Error('Failed to load surveys');
            const data = await response.json();
            setSurveys(data);
        } catch (error) {
            console.error('Error loading surveys:', error);
            setError('Failed to load surveys. Make sure the API server is running.');
        } finally {
            setIsLoading(false);
        }
    }

    async function deleteSurvey(id: string) {
        if (!confirm('Are you sure you want to delete this survey?')) return;

        try {
            const response = await fetch(`${API_BASE}/api/surveys/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete');
            setSurveys(surveys.filter(s => s.id !== id));
        } catch (error) {
            console.error('Error deleting survey:', error);
            alert('Failed to delete survey');
        }
    }

    async function duplicateSurvey(survey: Survey) {
        try {
            const response = await fetch(`${API_BASE}/api/surveys`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `${survey.title} (Copy)`,
                    description: survey.description,
                }),
            });
            if (!response.ok) throw new Error('Failed to duplicate');
            const newSurvey = await response.json();
            setSurveys([newSurvey, ...surveys]);
        } catch (error) {
            console.error('Error duplicating survey:', error);
            alert('Failed to duplicate survey');
        }
    }

    function copyShareLink(surveyId: string) {
        const url = `${window.location.origin}/survey/${surveyId}`;
        navigator.clipboard.writeText(url);
        alert('Survey link copied to clipboard!');
    }

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }

    function getStatusColor(status: string) {
        switch (status) {
            case 'published': return styles.statusPublished;
            case 'closed': return styles.statusClosed;
            default: return styles.statusDraft;
        }
    }

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 className={styles.spinner} size={40} />
                <p>Loading surveys...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div>
                        <h1 className={styles.title}>My Surveys</h1>
                        <p className={styles.subtitle}>
                            {surveys.length} survey{surveys.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className={styles.headerActions}>
                        <Link href="/analytics" className={styles.secondaryBtn}>
                            <BarChart2 size={18} />
                            Dashboard
                        </Link>
                        <Link href="/builder/new" className={styles.createBtn}>
                            <Plus size={18} />
                            Create Survey
                        </Link>
                        <UserProfileDropdown />
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className={styles.main}>
                {error && (
                    <div className={styles.errorBanner}>
                        {error}
                        <button onClick={loadSurveys} className={styles.retryBtn}>
                            Retry
                        </button>
                    </div>
                )}

                {surveys.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FileText size={48} className={styles.emptyIcon} />
                        <h2>No surveys yet</h2>
                        <p>Create your first survey to get started</p>
                        <Link href="/builder/new" className={styles.createBtn}>
                            <Plus size={18} />
                            Create Survey
                        </Link>
                    </div>
                ) : (
                    <div className={styles.surveyGrid}>
                        {surveys.map((survey) => (
                            <div key={survey.id} className={styles.surveyCard}>
                                <div className={styles.cardHeader}>
                                    <span className={`${styles.statusBadge} ${getStatusColor(survey.status)}`}>
                                        {survey.status}
                                    </span>
                                    <div className={styles.menuWrapper} ref={openMenuId === survey.id ? menuRef : null}>
                                        <button
                                            className={styles.menuBtn}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuId(openMenuId === survey.id ? null : survey.id);
                                            }}
                                        >
                                            <MoreVertical size={18} />
                                        </button>
                                        {openMenuId === survey.id && (
                                            <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
                                                <Link href={`/survey/${survey.id}`} className={styles.dropdownItem}>
                                                    <Eye size={14} />
                                                    Preview
                                                </Link>
                                                <Link href={`/builder/${survey.id}`} className={styles.dropdownItem}>
                                                    <Edit2 size={14} />
                                                    Edit
                                                </Link>
                                                <button
                                                    className={styles.dropdownItem}
                                                    onClick={() => copyShareLink(survey.id)}
                                                >
                                                    <Copy size={14} />
                                                    Copy Link
                                                </button>
                                                <button
                                                    className={styles.dropdownItem}
                                                    onClick={() => duplicateSurvey(survey)}
                                                >
                                                    <FileText size={14} />
                                                    Duplicate
                                                </button>
                                                <button
                                                    className={styles.dropdownItem}
                                                    onClick={() => {
                                                        setOpenMenuId(null);
                                                        setActiveShareSurvey(survey);
                                                    }}
                                                >
                                                    <QrCode size={14} />
                                                    QR Code
                                                </button>
                                                <Link href={`/surveys/${survey.id}/analytics`} className={styles.dropdownItem}>
                                                    <BarChart2 size={14} />
                                                    Analytics
                                                </Link>
                                                <hr className={styles.dropdownDivider} />
                                                <button
                                                    className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                                                    onClick={() => deleteSurvey(survey.id)}
                                                >
                                                    <Trash2 size={14} />
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Link href={`/builder/${survey.id}`} className={styles.cardBody}>
                                    <h3 className={styles.surveyTitle}>{survey.title}</h3>
                                    {survey.description && (
                                        <p className={styles.surveyDescription}>{survey.description}</p>
                                    )}
                                </Link>

                                <div className={styles.cardFooter}>
                                    <span className={styles.date}>
                                        Updated {formatDate(survey.updated_at)}
                                    </span>
                                    <div className={styles.quickActions}>
                                        <Link href={`/survey/${survey.id}`} className={styles.quickBtn} title="Preview">
                                            <Eye size={16} />
                                        </Link>
                                        <Link href={`/builder/${survey.id}`} className={styles.quickBtn} title="Edit">
                                            <Edit2 size={16} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Share Modal */}
            {activeShareSurvey && (
                <ShareModal
                    isOpen={true}
                    onClose={() => setActiveShareSurvey(null)}
                    surveyId={activeShareSurvey.id}
                    surveyTitle={activeShareSurvey.title}
                />
            )}
        </div>
    );
}
