/**
 * Survey Runner Store
 * Manages respondent survey session state using XState-like patterns
 */
import { create } from 'zustand';
import type { SurveyConfig, Block, Question } from '@repo/shared/schemas';
import {
    evaluateDisplayLogic,
    getVisibleBlocks,
    getVisibleQuestions,
    validateAnswer,
    calculateProgress,
    seededRandom,
    shuffleWithSeed,
} from '@repo/survey-engine';

export type RunnerStatus = 'loading' | 'in_progress' | 'submitting' | 'completed' | 'error';

interface RunnerState {
    // Session info
    sessionId: string | null;
    surveyId: string | null;
    versionId: string | null;
    resumeToken: string | null;

    // Survey data
    config: SurveyConfig | null;
    status: RunnerStatus;
    error: string | null;

    // Navigation
    currentBlockIndex: number;
    answers: Record<string, unknown>;
    validationErrors: Record<string, string[]>;

    // Randomization seed
    seed: number;

    // Computed
    progress: number;

    // Actions
    initialize: (config: SurveyConfig, sessionId?: string, existingAnswers?: Record<string, unknown>) => void;
    setAnswer: (questionId: string, value: unknown) => void;
    validateCurrentPage: () => boolean;
    goToNextBlock: () => void;
    goToPreviousBlock: () => void;
    submit: () => Promise<void>;
    reset: () => void;

    // Getters
    getCurrentBlock: () => Block | null;
    getVisibleQuestionsForCurrentBlock: () => Question[];
    isFirstBlock: () => boolean;
    isLastBlock: () => boolean;
}

const initialState = {
    sessionId: null,
    surveyId: null,
    versionId: null,
    resumeToken: null,
    config: null,
    status: 'loading' as RunnerStatus,
    error: null,
    currentBlockIndex: 0,
    answers: {},
    validationErrors: {},
    seed: Math.floor(Math.random() * 2147483647),
    progress: 0,
};

export const useRunnerStore = create<RunnerState>()((set, get) => ({
    ...initialState,

    initialize: (config, sessionId, existingAnswers) => {
        set({
            config,
            sessionId: sessionId || crypto.randomUUID(),
            status: 'in_progress',
            answers: existingAnswers || {},
            currentBlockIndex: 0,
            progress: 0,
            error: null,
        });
    },

    setAnswer: (questionId, value) => {
        const state = get();
        const newAnswers = { ...state.answers, [questionId]: value };

        // Clear validation error for this question
        const newErrors = { ...state.validationErrors };
        delete newErrors[questionId];

        // Calculate new progress
        const progress = state.config
            ? calculateProgress(state.config, {
                currentBlockIndex: state.currentBlockIndex,
                currentQuestionIndex: 0,
                answers: newAnswers,
                embeddedData: {},
                seed: state.seed,
                visitedBlocks: [],
                visitedQuestions: [],
            })
            : 0;

        set({
            answers: newAnswers,
            validationErrors: newErrors,
            progress,
        });
    },

    validateCurrentPage: () => {
        const state = get();
        const questions = state.getVisibleQuestionsForCurrentBlock();
        const errors: Record<string, string[]> = {};
        let isValid = true;

        for (const question of questions) {
            const questionErrors = validateAnswer(question, state.answers[question.id]);
            if (questionErrors.length > 0) {
                errors[question.id] = questionErrors;
                isValid = false;
            }
        }

        set({ validationErrors: errors });
        return isValid;
    },

    goToNextBlock: () => {
        const state = get();
        if (!state.config) return;

        // Validate current page first
        if (!state.validateCurrentPage()) {
            return;
        }

        const visibleBlocks = getVisibleBlocks(state.config, state.answers);
        if (state.currentBlockIndex < visibleBlocks.length - 1) {
            set({ currentBlockIndex: state.currentBlockIndex + 1 });
        }
    },

    goToPreviousBlock: () => {
        const state = get();
        if (!state.config?.settings.allowBack) return;

        if (state.currentBlockIndex > 0) {
            set({ currentBlockIndex: state.currentBlockIndex - 1 });
        }
    },

    submit: async () => {
        const state = get();

        // Validate current page
        if (!state.validateCurrentPage()) {
            return;
        }

        set({ status: 'submitting' });

        try {
            // TODO: Call API to submit
            // await trpc.session.submit.mutate({ sessionId: state.sessionId, ... })

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            set({ status: 'completed' });
        } catch (error) {
            set({
                status: 'error',
                error: error instanceof Error ? error.message : 'Failed to submit survey'
            });
        }
    },

    reset: () => set(initialState),

    getCurrentBlock: () => {
        const state = get();
        if (!state.config) return null;

        const visibleBlocks = getVisibleBlocks(state.config, state.answers);
        return visibleBlocks[state.currentBlockIndex] || null;
    },

    getVisibleQuestionsForCurrentBlock: () => {
        const state = get();
        const block = state.getCurrentBlock();
        if (!block) return [];

        let questions = getVisibleQuestions(block, state.answers);

        // Apply randomization if enabled
        if (block.randomize) {
            questions = shuffleWithSeed(questions, state.seed);
        }

        return questions;
    },

    isFirstBlock: () => {
        return get().currentBlockIndex === 0;
    },

    isLastBlock: () => {
        const state = get();
        if (!state.config) return true;

        const visibleBlocks = getVisibleBlocks(state.config, state.answers);
        return state.currentBlockIndex >= visibleBlocks.length - 1;
    },
}));
