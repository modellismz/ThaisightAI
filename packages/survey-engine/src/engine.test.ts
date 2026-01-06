/**
 * Survey Engine Unit Tests
 */
import { describe, it, expect } from 'vitest';
import {
    evaluateCondition,
    evaluateDisplayLogic,
    validateAnswer,
    validatePage,
    calculateProgress,
    shuffleWithSeed,
    interpolateText,
    createInitialState,
} from './engine';

// ============================================
// evaluateCondition Tests
// ============================================

describe('evaluateCondition', () => {
    it('should evaluate equals correctly', () => {
        expect(evaluateCondition(
            { questionId: 'q1', operator: 'equals', value: 'yes' },
            { q1: 'yes' }
        )).toBe(true);

        expect(evaluateCondition(
            { questionId: 'q1', operator: 'equals', value: 'yes' },
            { q1: 'no' }
        )).toBe(false);
    });

    it('should evaluate not_equals correctly', () => {
        expect(evaluateCondition(
            { questionId: 'q1', operator: 'not_equals', value: 'yes' },
            { q1: 'no' }
        )).toBe(true);
    });

    it('should evaluate contains for arrays', () => {
        expect(evaluateCondition(
            { questionId: 'q1', operator: 'contains', value: 'option1' },
            { q1: ['option1', 'option2'] }
        )).toBe(true);

        expect(evaluateCondition(
            { questionId: 'q1', operator: 'contains', value: 'option3' },
            { q1: ['option1', 'option2'] }
        )).toBe(false);
    });

    it('should evaluate contains for strings', () => {
        expect(evaluateCondition(
            { questionId: 'q1', operator: 'contains', value: 'hello' },
            { q1: 'hello world' }
        )).toBe(true);
    });

    it('should evaluate greater_than correctly', () => {
        expect(evaluateCondition(
            { questionId: 'q1', operator: 'greater_than', value: 5 },
            { q1: 10 }
        )).toBe(true);

        expect(evaluateCondition(
            { questionId: 'q1', operator: 'greater_than', value: 5 },
            { q1: 3 }
        )).toBe(false);
    });

    it('should evaluate less_than correctly', () => {
        expect(evaluateCondition(
            { questionId: 'q1', operator: 'less_than', value: 5 },
            { q1: 3 }
        )).toBe(true);
    });

    it('should evaluate is_empty correctly', () => {
        expect(evaluateCondition(
            { questionId: 'q1', operator: 'is_empty' },
            { q1: '' }
        )).toBe(true);

        expect(evaluateCondition(
            { questionId: 'q1', operator: 'is_empty' },
            { q1: undefined }
        )).toBe(true);

        expect(evaluateCondition(
            { questionId: 'q1', operator: 'is_empty' },
            { q1: [] }
        )).toBe(true);

        expect(evaluateCondition(
            { questionId: 'q1', operator: 'is_empty' },
            { q1: 'value' }
        )).toBe(false);
    });

    it('should evaluate is_not_empty correctly', () => {
        expect(evaluateCondition(
            { questionId: 'q1', operator: 'is_not_empty' },
            { q1: 'value' }
        )).toBe(true);

        expect(evaluateCondition(
            { questionId: 'q1', operator: 'is_not_empty' },
            { q1: '' }
        )).toBe(false);
    });
});

// ============================================
// evaluateDisplayLogic Tests
// ============================================

describe('evaluateDisplayLogic', () => {
    it('should return true when no logic defined', () => {
        expect(evaluateDisplayLogic(undefined, {})).toBe(true);
    });

    it('should return true when conditions array is empty', () => {
        expect(evaluateDisplayLogic({ conditions: [], operator: 'and' }, {})).toBe(true);
    });

    it('should evaluate AND logic correctly', () => {
        const logic = {
            conditions: [
                { questionId: 'q1', operator: 'equals' as const, value: 'yes' },
                { questionId: 'q2', operator: 'equals' as const, value: 'yes' },
            ],
            operator: 'and' as const,
        };

        expect(evaluateDisplayLogic(logic, { q1: 'yes', q2: 'yes' })).toBe(true);
        expect(evaluateDisplayLogic(logic, { q1: 'yes', q2: 'no' })).toBe(false);
    });

    it('should evaluate OR logic correctly', () => {
        const logic = {
            conditions: [
                { questionId: 'q1', operator: 'equals' as const, value: 'yes' },
                { questionId: 'q2', operator: 'equals' as const, value: 'yes' },
            ],
            operator: 'or' as const,
        };

        expect(evaluateDisplayLogic(logic, { q1: 'yes', q2: 'no' })).toBe(true);
        expect(evaluateDisplayLogic(logic, { q1: 'no', q2: 'no' })).toBe(false);
    });
});

// ============================================
// validateAnswer Tests
// ============================================

describe('validateAnswer', () => {
    it('should validate required fields', () => {
        const question = {
            id: 'q1',
            type: 'text' as const,
            text: 'Question',
            multiline: false,
            rows: 3,
            validation: { required: true },
        };

        expect(validateAnswer(question, '')).toContain('This field is required');
        expect(validateAnswer(question, undefined)).toContain('This field is required');
        expect(validateAnswer(question, 'answer')).toHaveLength(0);
    });

    it('should validate minLength', () => {
        const question = {
            id: 'q1',
            type: 'text' as const,
            text: 'Question',
            multiline: false,
            rows: 3,
            validation: { required: false, minLength: 5 },
        };

        expect(validateAnswer(question, 'hi')).toContain('Minimum 5 characters required');
        expect(validateAnswer(question, 'hello world')).toHaveLength(0);
    });

    it('should validate maxLength', () => {
        const question = {
            id: 'q1',
            type: 'text' as const,
            text: 'Question',
            multiline: false,
            rows: 3,
            validation: { required: false, maxLength: 10 },
        };

        expect(validateAnswer(question, 'this is way too long')).toContain('Maximum 10 characters allowed');
        expect(validateAnswer(question, 'short')).toHaveLength(0);
    });

    it('should validate number ranges', () => {
        const question = {
            id: 'q1',
            type: 'slider' as const,
            text: 'Question',
            min: 0,
            max: 100,
            step: 1,
            showValue: true,
            validation: { required: false, minValue: 0, maxValue: 100 },
        };

        expect(validateAnswer(question, -5)).toContain('Minimum value is 0');
        expect(validateAnswer(question, 150)).toContain('Maximum value is 100');
        expect(validateAnswer(question, 50)).toHaveLength(0);
    });

    it('should validate array selections', () => {
        const question = {
            id: 'q1',
            type: 'multiple_choice' as const,
            text: 'Question',
            choices: [],
            displayStyle: 'checkbox' as const,
            allowOther: false,
            otherLabel: 'Other',
            randomize: false,
            validation: { required: false, minSelections: 2, maxSelections: 3 },
        };

        expect(validateAnswer(question, ['a'])).toContain('Select at least 2 options');
        expect(validateAnswer(question, ['a', 'b', 'c', 'd'])).toContain('Select at most 3 options');
        expect(validateAnswer(question, ['a', 'b'])).toHaveLength(0);
    });
});

// ============================================
// shuffleWithSeed Tests
// ============================================

describe('shuffleWithSeed', () => {
    it('should be deterministic with same seed', () => {
        const arr = [1, 2, 3, 4, 5];
        const result1 = shuffleWithSeed(arr, 12345);
        const result2 = shuffleWithSeed(arr, 12345);

        expect(result1).toEqual(result2);
    });

    it('should produce different results with different seeds', () => {
        const arr = [1, 2, 3, 4, 5];
        const result1 = shuffleWithSeed(arr, 12345);
        const result2 = shuffleWithSeed(arr, 54321);

        expect(result1).not.toEqual(result2);
    });

    it('should not modify original array', () => {
        const arr = [1, 2, 3, 4, 5];
        shuffleWithSeed(arr, 12345);

        expect(arr).toEqual([1, 2, 3, 4, 5]);
    });
});

// ============================================
// interpolateText Tests
// ============================================

describe('interpolateText', () => {
    it('should interpolate embedded data', () => {
        const result = interpolateText(
            'Hello, ${name}!',
            {},
            { name: 'John' }
        );
        expect(result).toBe('Hello, John!');
    });

    it('should interpolate answers', () => {
        const result = interpolateText(
            'Your answer was: ${q1}',
            { q1: 'yes' },
            {}
        );
        expect(result).toBe('Your answer was: yes');
    });

    it('should leave unmatched variables as-is', () => {
        const result = interpolateText(
            'Hello, ${unknown}!',
            {},
            {}
        );
        expect(result).toBe('Hello, ${unknown}!');
    });

    it('should handle multiple variables', () => {
        const result = interpolateText(
            '${greeting}, ${name}! Your score is ${score}.',
            { score: 100 },
            { greeting: 'Hi', name: 'Jane' }
        );
        expect(result).toBe('Hi, Jane! Your score is 100.');
    });
});

// ============================================
// createInitialState Tests
// ============================================

describe('createInitialState', () => {
    it('should create initial state with empty answers', () => {
        const config = {
            version: '1.0',
            blocks: [],
            settings: {} as any,
        };

        const state = createInitialState(config);

        expect(state.currentBlockIndex).toBe(0);
        expect(state.currentQuestionIndex).toBe(0);
        expect(state.answers).toEqual({});
        expect(state.visitedBlocks).toEqual([]);
    });

    it('should use provided seed', () => {
        const config = {
            version: '1.0',
            blocks: [],
            settings: {} as any,
        };

        const state = createInitialState(config, 12345);
        expect(state.seed).toBe(12345);
    });

    it('should use embedded data from config', () => {
        const config = {
            version: '1.0',
            blocks: [],
            settings: {} as any,
            embeddedData: { source: 'email' },
        };

        const state = createInitialState(config);
        expect(state.embeddedData).toEqual({ source: 'email' });
    });
});

// ============================================
// calculateProgress Tests
// ============================================

describe('calculateProgress', () => {
    it('should return 100 for empty survey', () => {
        const config = {
            version: '1.0',
            blocks: [],
            settings: {} as any,
        };
        const state = createInitialState(config);

        expect(calculateProgress(config, state)).toBe(100);
    });

    it('should calculate correct progress', () => {
        const config = {
            version: '1.0',
            blocks: [
                {
                    id: 'b1',
                    questions: [
                        { id: 'q1', type: 'text' as const, text: 'Q1', multiline: false, rows: 3 },
                        { id: 'q2', type: 'text' as const, text: 'Q2', multiline: false, rows: 3 },
                    ],
                    randomize: false,
                },
            ],
            settings: {} as any,
        };

        const state = {
            ...createInitialState(config),
            answers: { q1: 'answer' },
        };

        expect(calculateProgress(config, state)).toBe(50);
    });
});
