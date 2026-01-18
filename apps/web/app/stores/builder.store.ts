/**
 * Survey Builder Store
 * Zustand store for managing survey editor state
 */
import { create } from 'zustand';
import type { SurveyConfig, Block, Question, QuestionType } from '@repo/shared/schemas';
import { v4 as uuidv4 } from 'uuid';

interface BuilderState {
    // Survey data
    surveyId: string | null;
    surveyTitle: string;
    config: SurveyConfig;
    isDirty: boolean;
    lastSaved: Date | null;

    // UI state
    selectedBlockId: string | null;
    selectedQuestionId: string | null;
    isPreviewOpen: boolean;

    // Actions
    setSurveyId: (id: string) => void;
    setSurveyTitle: (title: string) => void;
    setConfig: (config: SurveyConfig) => void;
    markDirty: () => void;
    markSaved: () => void;

    // Block operations
    addBlock: (title?: string) => void;
    updateBlock: (blockId: string, updates: Partial<Block>) => void;
    deleteBlock: (blockId: string) => void;
    reorderBlocks: (startIndex: number, endIndex: number) => void;

    // Question operations
    addQuestion: (blockId: string, type: QuestionType) => void;
    updateQuestion: (blockId: string, questionId: string, updates: Partial<Question>) => void;
    deleteQuestion: (blockId: string, questionId: string) => void;
    reorderQuestions: (blockId: string, startIndex: number, endIndex: number) => void;

    // Selection
    selectBlock: (blockId: string | null) => void;
    selectQuestion: (questionId: string | null) => void;

    // Preview
    togglePreview: () => void;

    // Reset
    reset: () => void;
}

export const initialConfig: SurveyConfig = {
    version: '1.0',
    blocks: [],
    settings: {
        theme: 'default',
        progressBar: 'top',
        showQuestionNumbers: true,
        allowBack: true,
        saveProgress: true,
        oneQuestionPerPage: false,
        randomizeBlocks: false,
        thankYouMessage: 'Thank you for completing this survey!',
        redirectDelay: 3,
        requireAuth: false,
        allowMultipleResponses: false,
    },
};

function generateId(): string {
    return uuidv4();
}

function createDefaultQuestion(type: QuestionType): Question {
    const base = {
        id: generateId(),
        text: 'New Question',
        description: '',
    };

    switch (type) {
        case 'text':
            return { ...base, type: 'text', multiline: false, rows: 3 };
        case 'single_choice':
            return {
                ...base,
                type: 'single_choice',
                choices: [
                    { id: generateId(), text: 'Option 1' },
                    { id: generateId(), text: 'Option 2' },
                ],
                displayStyle: 'radio',
                allowOther: false,
                otherLabel: 'Other',
                randomize: false,
            };
        case 'multiple_choice':
            return {
                ...base,
                type: 'multiple_choice',
                choices: [
                    { id: generateId(), text: 'Option 1' },
                    { id: generateId(), text: 'Option 2' },
                ],
                displayStyle: 'checkbox',
                allowOther: false,
                otherLabel: 'Other',
                randomize: false,
            };
        case 'matrix':
            return {
                ...base,
                type: 'matrix',
                rows: [{ id: generateId(), text: 'Row 1' }],
                columns: [
                    { id: generateId(), text: 'Poor', value: 1 },
                    { id: generateId(), text: 'Fair', value: 2 },
                    { id: generateId(), text: 'Good', value: 3 },
                    { id: generateId(), text: 'Excellent', value: 4 },
                ],
                allowMultiple: false,
            };
        case 'slider':
            return {
                ...base,
                type: 'slider',
                min: 0,
                max: 100,
                step: 1,
                showValue: true,
            };
        case 'nps':
            return {
                ...base,
                type: 'nps',
                text: 'How likely are you to recommend us to a friend or colleague?',
                minLabel: 'Not at all likely',
                maxLabel: 'Extremely likely',
            };
        case 'rank_order':
            return {
                ...base,
                type: 'rank_order',
                items: [
                    { id: generateId(), text: 'Item 1' },
                    { id: generateId(), text: 'Item 2' },
                    { id: generateId(), text: 'Item 3' },
                ],
            };
        case 'date':
            return {
                ...base,
                type: 'date',
                includeTime: false,
                format: 'YYYY-MM-DD',
            };
        default:
            return { ...base, type: 'text', multiline: false, rows: 3 } as Question;
    }
}

export const useBuilderStore = create<BuilderState>()((set, get) => ({
    surveyId: null,
    surveyTitle: 'Untitled Survey',
    config: initialConfig,
    isDirty: false,
    lastSaved: null,
    selectedBlockId: null,
    selectedQuestionId: null,
    isPreviewOpen: false,

    setSurveyId: (id) => set({ surveyId: id }),

    setSurveyTitle: (title) => set({ surveyTitle: title, isDirty: true }),

    setConfig: (config) => set({ config, isDirty: false }),

    markDirty: () => set({ isDirty: true }),

    markSaved: () => set({ isDirty: false, lastSaved: new Date() }),

    addBlock: (title) => {
        const state = get();
        const newBlock: Block = {
            id: generateId(),
            title: title || `Block ${state.config.blocks.length + 1}`,
            questions: [],
            randomize: false,
        };
        set({
            config: {
                ...state.config,
                blocks: [...state.config.blocks, newBlock],
            },
            selectedBlockId: newBlock.id,
            isDirty: true,
        });
    },

    updateBlock: (blockId, updates) => {
        const state = get();
        set({
            config: {
                ...state.config,
                blocks: state.config.blocks.map((block) =>
                    block.id === blockId ? { ...block, ...updates } : block
                ),
            },
            isDirty: true,
        });
    },

    deleteBlock: (blockId) => {
        const state = get();
        set({
            config: {
                ...state.config,
                blocks: state.config.blocks.filter((b) => b.id !== blockId),
            },
            selectedBlockId: state.selectedBlockId === blockId ? null : state.selectedBlockId,
            selectedQuestionId: null,
            isDirty: true,
        });
    },

    reorderBlocks: (startIndex, endIndex) => {
        const state = get();
        const blocks = [...state.config.blocks];
        const [removed] = blocks.splice(startIndex, 1);
        if (removed) {
            blocks.splice(endIndex, 0, removed);
        }
        set({
            config: { ...state.config, blocks },
            isDirty: true,
        });
    },

    addQuestion: (blockId, type) => {
        const state = get();
        const question = createDefaultQuestion(type);
        set({
            config: {
                ...state.config,
                blocks: state.config.blocks.map((block) =>
                    block.id === blockId
                        ? { ...block, questions: [...block.questions, question] }
                        : block
                ),
            },
            selectedQuestionId: question.id,
            isDirty: true,
        });
    },

    updateQuestion: (blockId, questionId, updates) => {
        const state = get();
        set({
            config: {
                ...state.config,
                blocks: state.config.blocks.map((block) =>
                    block.id === blockId
                        ? {
                            ...block,
                            questions: block.questions.map((q) =>
                                q.id === questionId ? { ...q, ...updates } as Question : q
                            ),
                        }
                        : block
                ),
            },
            isDirty: true,
        });
    },

    deleteQuestion: (blockId, questionId) => {
        const state = get();
        set({
            config: {
                ...state.config,
                blocks: state.config.blocks.map((block) =>
                    block.id === blockId
                        ? { ...block, questions: block.questions.filter((q) => q.id !== questionId) }
                        : block
                ),
            },
            selectedQuestionId: state.selectedQuestionId === questionId ? null : state.selectedQuestionId,
            isDirty: true,
        });
    },

    reorderQuestions: (blockId, startIndex, endIndex) => {
        const state = get();
        set({
            config: {
                ...state.config,
                blocks: state.config.blocks.map((block) => {
                    if (block.id !== blockId) return block;
                    const questions = [...block.questions];
                    const [removed] = questions.splice(startIndex, 1);
                    if (removed) {
                        questions.splice(endIndex, 0, removed);
                    }
                    return { ...block, questions };
                }),
            },
            isDirty: true,
        });
    },

    selectBlock: (blockId) => set({ selectedBlockId: blockId, selectedQuestionId: null }),

    selectQuestion: (questionId) => set({ selectedQuestionId: questionId }),

    togglePreview: () => set((state) => ({ isPreviewOpen: !state.isPreviewOpen })),

    reset: () =>
        set({
            surveyId: null,
            surveyTitle: 'Untitled Survey',
            config: initialConfig,
            isDirty: false,
            lastSaved: null,
            selectedBlockId: null,
            selectedQuestionId: null,
            isPreviewOpen: false,
        }),
}));
