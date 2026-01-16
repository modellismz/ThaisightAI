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
    resolveChoices,
} from '@repo/survey-engine';
import { getTRPCClient } from '../lib/trpc';

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
    initialize: (data: {
        config: SurveyConfig;
        sessionId?: string;
        resumeToken?: string;
        surveyId?: string;
        versionId?: string;
        initialAnswers?: Record<string, unknown>;
    }) => void;
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

    initialize: ({ config, sessionId, resumeToken, surveyId, versionId, initialAnswers }) => {
        set({
            config,
            sessionId: sessionId || crypto.randomUUID(),
            resumeToken: resumeToken || null,
            surveyId: surveyId || null,
            versionId: versionId || null,
            status: 'in_progress',
            answers: initialAnswers || {},
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

        // Auto-save (debounce could be better, but for MVP simple save is fine)
        saveProgress(get(), { [questionId]: value });
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

        // Save progress for entire block to be safe
        const questions = state.getVisibleQuestionsForCurrentBlock();
        const blockAnswers: Record<string, unknown> = {};
        questions.forEach(q => {
            blockAnswers[q.id] = state.answers[q.id];
        });
        saveProgress(state, blockAnswers);

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
            // Demo/Preview mode - just mark as completed, no backend call
            if (!state.sessionId || state.sessionId.startsWith('demo') || state.sessionId.startsWith('preview')) {
                set({ status: 'completed' });
                return;
            }

            const trpc = getTRPCClient();
            await trpc.session.submit.mutate({
                sessionId: state.sessionId,
            });

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

        // Resolve dynamic choices (Carry Forward)
        questions = questions.map(q => {
            if (q.carryForward && state.config) {
                const resolved = resolveChoices(q, state.config, state.answers);
                // Return new question object with updated choices/items/rows
                if ('choices' in q) return { ...q, choices: resolved };
                if ('items' in q) return { ...q, items: resolved };
                if ('rows' in q && q.type === 'matrix') return { ...q, rows: resolved };
            }
            return q;
        });

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

// Helper to save progress
const saveProgress = async (state: RunnerState, answersToSave: Record<string, unknown>) => {
    // Skip for demo mode, preview mode, or invalid sessions
    if (!state.sessionId || state.sessionId.startsWith('demo') || state.sessionId.startsWith('preview')) return;

    try {
        const trpc = getTRPCClient();
        await trpc.session.saveAnswers.mutate({
            sessionId: state.sessionId,
            answers: answersToSave,
        });
    } catch (err) {
        console.error('Failed to save progress', err);
    }
};
