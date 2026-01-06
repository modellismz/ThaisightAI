'use client';

import { useState, useEffect } from 'react';
import { useBuilderStore } from '../../stores/builder.store';
import { useAutosave, loadDraftFromLocalStorage } from '../../hooks/useAutosave';
import { Plus, Save, Eye, Settings, ChevronLeft, Loader2, Check, Cloud, CloudOff } from 'lucide-react';
import Link from 'next/link';
import { BlockList } from './_components/BlockList';
import { QuestionEditor } from './_components/QuestionEditor';
import { SurveySettings } from './_components/SurveySettings';
import styles from './builder.module.css';

export default function SurveyBuilderPage() {
    const {
        config,
        surveyId,
        isDirty,
        lastSaved,
        addBlock,
        togglePreview,
        selectedQuestionId,
        setConfig,
        markSaved,
    } = useBuilderStore();

    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [showRestorePrompt, setShowRestorePrompt] = useState(false);

    // Autosave hook
    const { saveNow } = useAutosave({
        enabled: true,
        onSaveStart: () => setSaveStatus('saving'),
        onSaveSuccess: () => {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        },
        onSaveError: () => setSaveStatus('error'),
    });

    // Check for saved draft on mount
    useEffect(() => {
        const draft = loadDraftFromLocalStorage();
        if (draft && draft.config?.blocks?.length > 0) {
            setShowRestorePrompt(true);
        }
    }, []);

    const handleRestoreDraft = () => {
        const draft = loadDraftFromLocalStorage();
        if (draft?.config) {
            setConfig(draft.config);
            markSaved();
        }
        setShowRestorePrompt(false);
    };

    const handleDismissRestore = () => {
        setShowRestorePrompt(false);
    };

    const handleSave = async () => {
        setSaveStatus('saving');
        await saveNow();
    };

    const handlePublish = async () => {
        if (!surveyId) {
            alert('Please save the survey first before publishing.');
            return;
        }

        try {
            setSaveStatus('saving');

            // Save current draft first
            await saveNow();

            // Import publishSurvey dynamically
            const { publishSurvey } = await import('../../lib/api');
            const result = await publishSurvey(surveyId);

            setSaveStatus('saved');

            // Show share URL
            const shareUrl = result.shareUrl || `${window.location.origin}/survey/${surveyId}`;
            alert(`🎉 Survey Published!\n\nShare this link with respondents:\n${shareUrl}`);

            // Copy to clipboard
            navigator.clipboard.writeText(shareUrl).catch(() => { });
        } catch (error) {
            console.error('Publish failed:', error);
            setSaveStatus('error');
            alert('Failed to publish survey. Please try again.');
        }
    };

    const getSaveStatusDisplay = () => {
        switch (saveStatus) {
            case 'saving':
                return (
                    <span className={styles.saveStatus}>
                        <Loader2 size={12} className={styles.spinIcon} />
                        Saving...
                    </span>
                );
            case 'saved':
                return (
                    <span className={`${styles.saveStatus} ${styles.saved}`}>
                        <Check size={12} />
                        Saved
                    </span>
                );
            case 'error':
                return (
                    <span className={`${styles.saveStatus} ${styles.error}`}>
                        <CloudOff size={12} />
                        Save failed
                    </span>
                );
            default:
                return (
                    <span className={styles.saveStatus}>
                        {isDirty ? (
                            <>
                                <Cloud size={12} />
                                Unsaved changes
                            </>
                        ) : lastSaved ? (
                            <>
                                <Cloud size={12} />
                                Last saved {formatTimeAgo(lastSaved)}
                            </>
                        ) : (
                            'Draft'
                        )}
                    </span>
                );
        }
    };

    return (
        <div className={styles.container}>
            {/* Restore Draft Prompt */}
            {showRestorePrompt && (
                <div className={styles.restorePrompt}>
                    <span>📝 You have an unsaved draft. Would you like to restore it?</span>
                    <button className="btn btn-primary btn-sm" onClick={handleRestoreDraft}>
                        Restore
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={handleDismissRestore}>
                        Dismiss
                    </button>
                </div>
            )}

            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <Link href="/" className={styles.backButton}>
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <input
                            type="text"
                            defaultValue="Untitled Survey"
                            className={styles.titleInput}
                            placeholder="Survey title..."
                        />
                        {getSaveStatusDisplay()}
                    </div>
                </div>

                <div className={styles.headerActions}>
                    <button className="btn btn-ghost" onClick={togglePreview}>
                        <Eye size={18} />
                        Preview
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={handleSave}
                        disabled={saveStatus === 'saving'}
                    >
                        {saveStatus === 'saving' ? (
                            <Loader2 size={18} className={styles.spinIcon} />
                        ) : (
                            <Save size={18} />
                        )}
                        Save Draft
                    </button>
                    <button className="btn btn-primary" onClick={handlePublish}>
                        Publish
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className={styles.main}>
                {/* Left Sidebar - Question Types */}
                <aside className={styles.sidebar}>
                    <h3 className={styles.sidebarTitle}>Question Types</h3>
                    <div className={styles.questionTypes}>
                        <QuestionTypeButton type="text" label="Text Entry" icon="📝" />
                        <QuestionTypeButton type="single_choice" label="Single Choice" icon="🔘" />
                        <QuestionTypeButton type="multiple_choice" label="Multiple Choice" icon="☑️" />
                        <QuestionTypeButton type="matrix" label="Matrix" icon="📊" />
                        <QuestionTypeButton type="slider" label="Slider" icon="🎚️" />
                        <QuestionTypeButton type="nps" label="NPS" icon="⭐" />
                        <QuestionTypeButton type="rank_order" label="Rank Order" icon="🔢" />
                        <QuestionTypeButton type="date" label="Date" icon="📅" />
                    </div>
                </aside>

                {/* Center - Survey Canvas */}
                <main className={styles.canvas}>
                    <div className={styles.canvasContent}>
                        {config.blocks.length === 0 ? (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>📋</div>
                                <h3>Start building your survey</h3>
                                <p>Add a block to organize your questions</p>
                                <button className="btn btn-primary" onClick={() => addBlock()}>
                                    <Plus size={18} />
                                    Add First Block
                                </button>
                            </div>
                        ) : (
                            <>
                                <BlockList />
                                <button
                                    className={styles.addBlockButton}
                                    onClick={() => addBlock()}
                                >
                                    <Plus size={18} />
                                    Add Block
                                </button>
                            </>
                        )}
                    </div>
                </main>

                {/* Right Sidebar - Question Editor */}
                <aside className={styles.editorPanel}>
                    {selectedQuestionId ? (
                        <QuestionEditor />
                    ) : (
                        <div className={styles.editorEmpty}>
                            <Settings size={40} className={styles.editorEmptyIcon} />
                            <p>Select a question to edit its properties</p>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}

function QuestionTypeButton({
    type,
    label,
    icon
}: {
    type: string;
    label: string;
    icon: string;
}) {
    const { selectedBlockId, addQuestion } = useBuilderStore();

    const handleClick = () => {
        if (selectedBlockId) {
            addQuestion(selectedBlockId, type as any);
        }
    };

    return (
        <button
            className={styles.questionTypeBtn}
            onClick={handleClick}
            disabled={!selectedBlockId}
            title={selectedBlockId ? `Add ${label}` : 'Select a block first'}
        >
            <span className={styles.questionTypeIcon}>{icon}</span>
            <span>{label}</span>
        </button>
    );
}

function formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
}
