'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useRunnerStore } from '../../stores/runner.store';
import { getTRPCClient } from '../../lib/trpc';
import { QuestionRenderer } from './_components/QuestionRenderer';
import { ProgressBar } from './_components/ProgressBar';
import { ThankYouPage } from './_components/ThankYouPage';
import { QuotaFullPage } from './_components/QuotaFullPage';
import { ChevronLeft, ChevronRight, Loader2, Send, AlertCircle, Copy, Check } from 'lucide-react';
import styles from './runner.module.css';
import type { SurveyConfig } from '@repo/shared/schemas';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function SaveAndResume() {
    const [copied, setCopied] = useState(false);

    const handleCopyObj = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={styles.saveResumeContainer}>
            <span className={styles.saveText}>
                <Check size={14} className={styles.saveIcon} />
                Progress saved for 30 days
            </span>
            <button className={styles.copyLinkBtn} onClick={handleCopyObj}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Link Copied' : 'Save & Finish Later'}
            </button>
        </div>
    );
}

export default function SurveyRunnerPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const surveyId = params.id as string;

    const [loadError, setLoadError] = useState<string | null>(null);
    const [isQuotaFull, setIsQuotaFull] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const initializedRef = useRef(false);

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
        // Prevent re-running if already initialized
        if (initializedRef.current) return;

        const token = searchParams.get('session');

        async function loadSurvey() {
            setIsLoading(true);
            setLoadError(null);

            const trpc = getTRPCClient();

            try {
                // Scenario A: Resume existing session
                if (token) {
                    const data = await trpc.session.resume.query({ resumeToken: token });

                    // Handle both compiled config and config URL
                    let surveyConfig: SurveyConfig;
                    if (typeof data.config === 'string') {
                        // It's a URL, fetch the config
                        const configResponse = await fetch(data.config);
                        surveyConfig = await configResponse.json();
                    } else {
                        surveyConfig = data.config as SurveyConfig;
                    }

                    initialize({
                        config: surveyConfig,
                        sessionId: data.session.id,
                        resumeToken: data.session.resumeToken ?? undefined,
                        surveyId: data.session.surveyId,
                        versionId: data.session.versionId,
                        initialAnswers: data.answers as Record<string, unknown>,
                    });
                    initializedRef.current = true;
                    return;
                }

                // Scenario B: Start new session
                const startResult = await trpc.session.start.mutate({ surveyId });
                console.log('Session start result:', startResult, 'SurveyId:', surveyId);

                // Fetch the config from REST API
                const response = await fetch(`${API_BASE}/api/surveys/${surveyId}/published`);
                if (!response.ok) throw new Error('Failed to load survey configuration');
                const data = await response.json();

                initialize({
                    config: data.config as SurveyConfig,
                    sessionId: startResult.sessionId,
                    resumeToken: startResult.resumeToken ?? undefined,
                    surveyId: surveyId,
                    versionId: startResult.versionId,
                    initialAnswers: {},
                });
                initializedRef.current = true;

                // Update URL with session token
                if (startResult.resumeToken) {
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.set('session', startResult.resumeToken);
                    window.history.replaceState({}, '', newUrl.toString());
                }

            } catch (error) {
                console.error('Error loading survey:', error);
                const errorMessage = error instanceof Error ? error.message : 'Failed to load survey';

                // Check if quota is full
                if (errorMessage.includes('QUOTA_FULL')) {
                    setIsQuotaFull(true);
                } else {
                    setLoadError(errorMessage);
                }
            } finally {
                setIsLoading(false);
            }
        }

        if (surveyId && surveyId !== 'demo') {
            loadSurvey();
        } else {
            // Demo mode - use sample survey
            const demoConfig = getDemoSurvey();
            initialize({
                config: demoConfig,
                surveyId: 'demo',
                versionId: 'demo',
                sessionId: 'demo-session',
                resumeToken: 'demo-token',
                initialAnswers: {}
            });
            initializedRef.current = true;
            setIsLoading(false);
        }
    }, [surveyId, initialize]);

    // Quota full state
    if (isQuotaFull) {
        return <QuotaFullPage />;
    }

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
            <div className={styles.footer}>
                <div className={styles.pageIndicator}>
                    Page {currentBlockIndex + 1} of {config.blocks.length}
                </div>
                <SaveAndResume />
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
