'use client';

import { useState } from 'react';
import { useBuilderStore } from '../../stores/builder.store';
import { Plus, Save, Eye, Settings, ChevronLeft, Loader2, Check, Cloud, CloudOff, Layout, List } from 'lucide-react';
import Link from 'next/link';
import { BlockList } from '../new/_components/BlockList';
import { QuestionEditor } from '../new/_components/QuestionEditor';
import { SurveySettings } from '../new/_components/SurveySettings';
import { FlowEditor } from './FlowEditor/FlowEditor';
import styles from '../new/builder.module.css';

interface SurveyBuilderProps {
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
    onSave: () => void;
    onPublish: () => void;
    showRestorePrompt?: boolean;
    onRestoreDraft?: () => void;
    onDismissRestore?: () => void;
    title?: string;
    onTitleChange?: (title: string) => void;
}

export function SurveyBuilder({
    saveStatus,
    onSave,
    onPublish,
    showRestorePrompt,
    onRestoreDraft,
    onDismissRestore,
    title = 'Untitled Survey',
    onTitleChange
}: SurveyBuilderProps) {
    const {
        config,
        isDirty,
        lastSaved,
        addBlock,
        surveyId,
        surveyTitle,
        setSurveyTitle,
        selectedQuestionId,
    } = useBuilderStore();

    const [viewMode, setViewMode] = useState<'editor' | 'flow'>('editor');

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
            {showRestorePrompt && onRestoreDraft && onDismissRestore && (
                <div className={styles.restorePrompt}>
                    <span>📝 You have an unsaved draft. Would you like to restore it?</span>
                    <button className="btn btn-primary btn-sm" onClick={onRestoreDraft}>
                        Restore
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={onDismissRestore}>
                        Dismiss
                    </button>
                </div>
            )}

            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <Link href="/surveys" className={styles.backButton}>
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <input
                            type="text"
                            value={surveyTitle}
                            onChange={(e) => setSurveyTitle(e.target.value)}
                            className={styles.titleInput}
                            placeholder="Survey title..."
                        />
                        {getSaveStatusDisplay()}
                    </div>
                </div>

                <div className={styles.headerMid}>
                    <div className={styles.viewToggle}>
                        <button
                            className={`${styles.toggleBtn} ${viewMode === 'editor' ? styles.active : ''}`}
                            onClick={() => setViewMode('editor')}
                        >
                            <List size={16} />
                            Editor
                        </button>
                        <button
                            className={`${styles.toggleBtn} ${viewMode === 'flow' ? styles.active : ''}`}
                            onClick={() => setViewMode('flow')}
                        >
                            <Layout size={16} />
                            Flow
                        </button>
                    </div>
                </div>

                <div className={styles.headerActions}>
                    <button
                        className="btn btn-ghost"
                        onClick={() => {
                            // Save current config to localStorage for preview
                            localStorage.setItem('preview_config', JSON.stringify(config));
                            window.open('/survey/preview', '_blank');
                        }}
                    >
                        <Eye size={18} />
                        Preview
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={onSave}
                        disabled={saveStatus === 'saving'}
                    >
                        {saveStatus === 'saving' ? (
                            <Loader2 size={18} className={styles.spinIcon} />
                        ) : (
                            <Save size={18} />
                        )}
                        Save Draft
                    </button>
                    <button className="btn btn-primary" onClick={onPublish}>
                        Publish
                    </button>
                </div>
            </header>

            {/* Main Content */}
            {viewMode === 'editor' ? (
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

                    {/* Right Sidebar - Question Editor or Settings */}
                    <aside className={styles.editorPanel}>
                        {selectedQuestionId ? (
                            <QuestionEditor />
                        ) : (
                            <SurveySettings />
                        )}
                    </aside>
                </div>
            ) : (
                <div className={styles.flowContainer}>
                    <FlowEditor />
                </div>
            )}
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
