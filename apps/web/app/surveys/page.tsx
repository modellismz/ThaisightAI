'use client';

import { useState, useEffect, useRef } from 'react';
import { ShareModal } from './_components/ShareModal';
import { OrganizationModal } from './_components/OrganizationModal';
import { UserProfileDropdown } from '../components/UserProfileDropdown';
import Link from 'next/link';
import { trpc } from '../lib/trpc';
import LoadingAnimation from '../components/LoadingAnimation';
import { Plus, FileText, MoreVertical, Eye, Edit2, Trash2, Copy, BarChart2, QrCode, Building2 } from 'lucide-react';
import styles from './surveys.module.css';
import { useUser } from '../context/UserContext';

function SurveyCard({ survey, openMenuId, setOpenMenuId, menuRef, copyShareLink, handleDuplicate, handleDelete, setActiveShareSurvey, formatDate, getStatusColor }: any) {
    return (
        <div className={styles.surveyCard}>
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
                                onClick={() => handleDuplicate(survey)}
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
                                onClick={() => handleDelete(survey.id)}
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
                    Updated {formatDate(survey.updatedAt)}
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
    );
}

export default function SurveysPage() {
    const user = useUser();
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [activeShareSurvey, setActiveShareSurvey] = useState<any | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Data Fetching via TRPC
    const { data: surveys = [], isLoading, refetch } = trpc.survey.list.useQuery({});
    const deleteMutation = trpc.survey.delete.useMutation({
        onSuccess: () => refetch()
    });
    const duplicateMutation = trpc.survey.create.useMutation({
        onSuccess: () => refetch()
    });

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

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this survey?')) return;
        try {
            await deleteMutation.mutateAsync({ id });
        } catch (error) {
            alert('Failed to delete survey');
        }
    }

    async function handleDuplicate(survey: any) {
        try {
            await duplicateMutation.mutateAsync({
                title: `${survey.title} (Copy)`,
                description: survey.description || undefined,
                defaultLanguage: survey.defaultLanguage
            });
        } catch (error) {
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

    // State for Admin Tabs
    const [activeTab, setActiveTab] = useState<'personal' | 'organizations'>('personal');
    const [activeOrgModal, setActiveOrgModal] = useState<string | null>(null);

    function getStatusColor(status: string) {
        switch (status) {
            case 'published': return styles.statusPublished;
            case 'closed': return styles.statusClosed;
            default: return styles.statusDraft;
        }
    }

    // Derived State for Admin View
    const personalSurveys = surveys.filter((s: any) => !s.orgName && !s.orgId);
    const orgSurveys = surveys.filter((s: any) => s.orgName || s.orgId);

    // Grouping for Admin (only org surveys)
    const surveysByOrg = orgSurveys.reduce((acc: any, survey: any) => {
        const orgName = survey.orgName || 'Unknown Organization';
        if (!acc[orgName]) acc[orgName] = [];
        acc[orgName].push(survey);
        return acc;
    }, {});

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingAnimation />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div>
                        <h1 className={styles.title}>
                            {user?.role === 'admin' ? 'Surveys' : 'My Surveys'}
                        </h1>
                        <p className={styles.subtitle}>
                            {surveys.length} survey{surveys.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className={styles.headerActions}>
                        {user?.role !== 'member' && (
                            <Link href="/analytics" className={styles.secondaryBtn}>
                                <BarChart2 size={18} />
                                Dashboard
                            </Link>
                        )}
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
                {user?.role === 'admin' ? (
                    <div className={styles.adminContainer}>
                        {/* Admin Tabs */}
                        <div className={styles.tabsContainer}>
                            <button
                                onClick={() => setActiveTab('personal')}
                                className={`${styles.tabBtn} ${activeTab === 'personal' ? styles.activeTabBtn : ''}`}
                            >
                                My Surveys
                                {activeTab === 'personal' && <div className={styles.activeIndicator} />}
                            </button>
                            <button
                                onClick={() => setActiveTab('organizations')}
                                className={`${styles.tabBtn} ${activeTab === 'organizations' ? styles.activeTabBtn : ''}`}
                            >
                                Organization Surveys
                                {activeTab === 'organizations' && <div className={styles.activeIndicator} />}
                            </button>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'personal' ? (
                            <>
                                {personalSurveys.length === 0 ? (
                                    <div className={styles.emptyState}>
                                        <FileText size={48} className={styles.emptyIcon} />
                                        <h2>No personal surveys</h2>
                                        <p>Create a survey to get started</p>
                                        <Link href="/builder/new" className={styles.createBtn}>
                                            <Plus size={18} />
                                            Create Survey
                                        </Link>
                                    </div>
                                ) : (
                                    <div className={styles.surveyGrid}>
                                        {personalSurveys.map((survey: any) => (
                                            <SurveyCard 
                                                key={survey.id} 
                                                survey={survey} 
                                                openMenuId={openMenuId} 
                                                setOpenMenuId={setOpenMenuId}
                                                menuRef={menuRef}
                                                copyShareLink={copyShareLink}
                                                handleDuplicate={handleDuplicate}
                                                handleDelete={handleDelete}
                                                setActiveShareSurvey={setActiveShareSurvey}
                                                formatDate={formatDate}
                                                getStatusColor={getStatusColor}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {Object.keys(surveysByOrg).length === 0 ? (
                                    <div className={styles.emptyState}>
                                        <Building2 size={48} className={styles.emptyIcon} />
                                        <h2>No organization surveys</h2>
                                        <p>Surveys belonging to organizations will appear here</p>
                                    </div>
                                ) : (
                                    <div className={styles.orgGrid}>
                                        {Object.entries(surveysByOrg).map(([orgName, orgSurveys]: [string, any]) => (
                                            <button 
                                                key={orgName}
                                                className={styles.orgCard}
                                                onClick={() => setActiveOrgModal(orgName)}
                                            >
                                                <div className={styles.orgCardIcon}>
                                                    <Building2 size={32} />
                                                </div>
                                                <h3 className={styles.orgCardTitle}>{orgName}</h3>
                                                <p className={styles.orgCardCount}>
                                                    {orgSurveys.length} survey{orgSurveys.length !== 1 ? 's' : ''}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Organization Modal */}
                                {activeOrgModal && (
                                    <OrganizationModal
                                        isOpen={true}
                                        onClose={() => setActiveOrgModal(null)}
                                        orgName={activeOrgModal}
                                    >
                                        <div className={styles.surveyGrid}>
                                            {surveysByOrg[activeOrgModal]?.map((survey: any) => (
                                                <SurveyCard 
                                                    key={survey.id} 
                                                    survey={survey} 
                                                    openMenuId={openMenuId} 
                                                    setOpenMenuId={setOpenMenuId}
                                                    menuRef={menuRef}
                                                    copyShareLink={copyShareLink}
                                                    handleDuplicate={handleDuplicate}
                                                    handleDelete={handleDelete}
                                                    setActiveShareSurvey={setActiveShareSurvey}
                                                    formatDate={formatDate}
                                                    getStatusColor={getStatusColor}
                                                />
                                            ))}
                                        </div>
                                    </OrganizationModal>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    // Member View (Standard)
                    <>
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
                                    <SurveyCard 
                                        key={survey.id} 
                                        survey={survey} 
                                        openMenuId={openMenuId} 
                                        setOpenMenuId={setOpenMenuId}
                                        menuRef={menuRef}
                                        copyShareLink={copyShareLink}
                                        handleDuplicate={handleDuplicate}
                                        handleDelete={handleDelete}
                                        setActiveShareSurvey={setActiveShareSurvey}
                                        formatDate={formatDate}
                                        getStatusColor={getStatusColor}
                                    />
                                ))}
                            </div>
                        )}
                    </>
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
