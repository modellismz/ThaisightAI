'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRunnerStore } from '../../stores/runner.store';
import { QuestionRenderer } from './_components/QuestionRenderer';
import { ProgressBar } from './_components/ProgressBar';
import { ThankYouPage } from './_components/ThankYouPage';
import { ChevronLeft, ChevronRight, Loader2, Send, AlertCircle } from 'lucide-react';
import styles from './runner.module.css';
import type { SurveyConfig } from '@repo/shared/schemas';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function SurveyRunnerPage() {
    const params = useParams();
    const surveyId = params.id as string;

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
        submit,
        getCurrentBlock,
        getVisibleQuestionsForCurrentBlock,
        isFirstBlock,
        isLastBlock,
    } = useRunnerStore();

    // Fetch published survey config from API
    useEffect(() => {
        async function loadSurvey() {
            setIsLoading(true);
            setLoadError(null);

            try {
                // Get the latest published version
                const response = await fetch(`${API_BASE}/api/surveys/${surveyId}/published`);

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Survey not found or not published yet');
                    }
                    throw new Error('Failed to load survey');
                }

                const data = await response.json();
                const surveyConfig = data.config as SurveyConfig;

                initialize(surveyConfig);
            } catch (error) {
                console.error('Error loading survey:', error);
                setLoadError(error instanceof Error ? error.message : 'Failed to load survey');
            } finally {
                setIsLoading(false);
            }
        }

        if (surveyId && surveyId !== 'demo') {
            loadSurvey();
        } else {
            // Demo mode - use sample survey
            initialize(getDemoSurvey());
            setIsLoading(false);
        }
    }, [surveyId, initialize]);

    // Loading state
    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 className={styles.spinner} size={40} />
                <p>Loading survey...</p>
            </div>
        );
    }

    // Error state
    if (loadError) {
        return (
            <div className={styles.loadingContainer}>
                <AlertCircle size={40} className={styles.errorIcon} />
                <h2>Unable to Load Survey</h2>
                <p>{loadError}</p>
            </div>
        );
    }

    if (status === 'loading' || !config) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 className={styles.spinner} size={40} />
                <p>Loading survey...</p>
            </div>
        );
    }

    if (status === 'completed') {
        return <ThankYouPage message={config.settings.thankYouMessage} />;
    }

    const block = getCurrentBlock();
    const questions = getVisibleQuestionsForCurrentBlock();

    return (
        <div className={styles.container}>
            {/* Progress Bar */}
            {config.settings.progressBar !== 'none' && (
                <ProgressBar
                    progress={progress}
                    position={config.settings.progressBar}
                />
            )}

            {/* Survey Content */}
            <div className={styles.content}>
                <div className={styles.surveyCard}>
                    {/* Block Title */}
                    {block?.title && (
                        <h2 className={styles.blockTitle}>{block.title}</h2>
                    )}

                    {/* Questions */}
                    <div className={styles.questions}>
                        {questions.map((question, index) => (
                            <div key={question.id} className={styles.questionWrapper}>
                                <QuestionRenderer
                                    question={question}
                                    questionNumber={config.settings.showQuestionNumbers ? index + 1 : undefined}
                                    value={answers[question.id]}
                                    error={validationErrors[question.id]?.[0]}
                                    onChange={(value) => setAnswer(question.id, value)}
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
                                <ChevronLeft size={18} />
                                Previous
                            </button>
                        )}

                        <div className={styles.navSpacer} />

                        {isLastBlock() ? (
                            <button
                                className={`${styles.navBtn} ${styles.navBtnPrimary}`}
                                onClick={submit}
                                disabled={status === 'submitting'}
                            >
                                {status === 'submitting' ? (
                                    <>
                                        <Loader2 size={18} className={styles.spinner} />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        Submit
                                        <Send size={18} />
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                className={`${styles.navBtn} ${styles.navBtnPrimary}`}
                                onClick={goToNextBlock}
                            >
                                Next
                                <ChevronRight size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Page indicator */}
            <div className={styles.pageIndicator}>
                Page {currentBlockIndex + 1} of {config.blocks.length}
            </div>
        </div>
    );
}

// Demo survey for testing
function getDemoSurvey(): SurveyConfig {
    return {
        version: '1.0',
        blocks: [
            {
                id: 'block-1',
                title: 'About You',
                questions: [
                    {
                        id: 'q1',
                        type: 'text',
                        text: 'What is your name?',
                        description: 'Please enter your full name',
                        validation: { required: true },
                        multiline: false,
                        rows: 1,
                    },
                    {
                        id: 'q2',
                        type: 'single_choice',
                        text: 'How did you hear about us?',
                        choices: [
                            { id: 'c1', text: 'Social Media' },
                            { id: 'c2', text: 'Friend or Family' },
                            { id: 'c3', text: 'Search Engine' },
                            { id: 'c4', text: 'Advertisement' },
                        ],
                        displayStyle: 'radio',
                        allowOther: true,
                        otherLabel: 'Other',
                        randomize: false,
                    },
                ],
                randomize: false,
            },
        ],
        settings: {
            theme: 'default',
            progressBar: 'top',
            showQuestionNumbers: true,
            allowBack: true,
            saveProgress: true,
            oneQuestionPerPage: false,
            randomizeBlocks: false,
            thankYouMessage: 'Thank you for your feedback! Your responses have been recorded.',
            redirectDelay: 5,
            requireAuth: false,
            allowMultipleResponses: false,
        },
    };
}
