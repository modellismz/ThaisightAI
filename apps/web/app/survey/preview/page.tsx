'use client';

import { useEffect, useState } from 'react';
import { useRunnerStore } from '../../stores/runner.store';
import { QuestionRenderer } from '../[id]/_components/QuestionRenderer';
import { ProgressBar } from '../[id]/_components/ProgressBar';
import { ThankYouPage } from '../[id]/_components/ThankYouPage';
import { ChevronLeft, ChevronRight, Loader2, Send, AlertCircle, Eye } from 'lucide-react';
import styles from '../[id]/runner.module.css';
import type { SurveyConfig } from '@repo/shared/schemas';

export default function PreviewPage() {
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const {
        config,
        status,
        progress,
        currentBlockIndex,
        answers,
        validationErrors,
        initialize,
        setAnswer,
        goToNextBlock,
        goToPreviousBlock,
        getCurrentBlock,
        getVisibleQuestionsForCurrentBlock,
        isFirstBlock,
        isLastBlock,
    } = useRunnerStore();

    // Load config from localStorage
    useEffect(() => {
        const loadPreviewConfig = () => {
            try {
                const savedConfig = localStorage.getItem('preview_config');
                if (!savedConfig) {
                    setLoadError('No preview config found. Please use the Preview button in the Builder.');
                    setIsLoading(false);
                    return;
                }

                const parsedConfig = JSON.parse(savedConfig) as SurveyConfig;

                // Initialize with the preview config (no session management)
                initialize({
                    config: parsedConfig,
                    surveyId: 'preview',
                    versionId: 'preview',
                    sessionId: 'preview-session',
                    resumeToken: 'preview-token',
                    initialAnswers: {}
                });

                setIsLoading(false);
            } catch (error) {
                console.error('Error loading preview config:', error);
                setLoadError('Failed to load preview config');
                setIsLoading(false);
            }
        };

        loadPreviewConfig();
    }, [initialize]);

    // Loading state
    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 className={styles.spinner} size={40} />
                <p>Loading preview...</p>
            </div>
        );
    }

    // Error state
    if (loadError) {
        return (
            <div className={styles.loadingContainer}>
                <AlertCircle size={40} className={styles.errorIcon} />
                <h2>Unable to Load Preview</h2>
                <p>{loadError}</p>
            </div>
        );
    }

    if (status === 'loading' || !config) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 className={styles.spinner} size={40} />
                <p>Preparing preview...</p>
            </div>
        );
    }

    if (status === 'complete') {
        return <ThankYouPage message={config.settings.thankYouMessage} />;
    }

    const currentBlock = getCurrentBlock();
    const visibleQuestions = getVisibleQuestionsForCurrentBlock();

    if (!currentBlock) {
        return (
            <div className={styles.loadingContainer}>
                <AlertCircle size={40} className={styles.errorIcon} />
                <h2>No Questions Found</h2>
                <p>This survey has no questions to preview.</p>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            color: '#111827'
        }}>
            {/* Preview Banner */}
            <div style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: 500,
            }}>
                <Eye size={18} />
                Preview Mode - Responses are not saved
            </div>

            {/* Progress Bar */}
            {config.settings.progressBar !== 'none' && (
                <ProgressBar
                    progress={progress}
                    position={config.settings.progressBar}
                />
            )}

            {/* Survey Content */}
            <main className={styles.content}>
                <div className={styles.surveyCard}>
                    {currentBlock.title && (
                        <h2 className={styles.blockTitle}>{currentBlock.title}</h2>
                    )}
                    {currentBlock.description && (
                        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>{currentBlock.description}</p>
                    )}

                    <div className={styles.questions}>
                        {visibleQuestions.map((question, index) => (
                            <div key={question.id} className={styles.questionWrapper}>
                                {config.settings.showQuestionNumbers && (
                                    <span style={{
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        color: '#6366f1',
                                        marginBottom: '0.5rem',
                                        display: 'block'
                                    }}>Q{index + 1}</span>
                                )}
                                <QuestionRenderer
                                    question={question}
                                    value={answers[question.id]}
                                    onChange={(value) => setAnswer(question.id, value)}
                                    errors={validationErrors[question.id]}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Navigation */}
                    <div className={styles.navigation}>
                        {config.settings.allowBack && !isFirstBlock() && (
                            <button
                                className={`${styles.navBtn} ${styles.navBtnSecondary}`}
                                onClick={goToPreviousBlock}
                            >
                                <ChevronLeft size={20} />
                                Back
                            </button>
                        )}

                        <div className={styles.navSpacer} />

                        {isLastBlock() ? (
                            <button
                                className={`${styles.navBtn} ${styles.navBtnPrimary}`}
                                onClick={() => alert('Preview mode - Submit disabled')}
                            >
                                <Send size={18} />
                                Submit (Preview)
                            </button>
                        ) : (
                            <button
                                className={`${styles.navBtn} ${styles.navBtnPrimary}`}
                                onClick={goToNextBlock}
                            >
                                Next
                                <ChevronRight size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
