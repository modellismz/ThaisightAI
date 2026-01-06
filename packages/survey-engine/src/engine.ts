/**
 * Survey Engine - Core Logic Evaluator
 * Pure functions for deterministic survey execution
 */
import type {
    Question,
    Block,
    SurveyConfig,
    DisplayLogic,
    LogicCondition
} from '@repo/shared/schemas';

// ============================================
// Types
// ============================================

export interface SurveyState {
    currentBlockIndex: number;
    currentQuestionIndex: number;
    answers: Record<string, unknown>;
    embeddedData: Record<string, string>;
    seed: number; // For deterministic randomization
    visitedBlocks: string[];
    visitedQuestions: string[];
}

export interface NavigationResult {
    nextBlockIndex: number;
    nextQuestionIndex: number;
    isComplete: boolean;
}

export interface ValidationResult {
    valid: boolean;
    errors: Record<string, string[]>;
}

// ============================================
// Logic Evaluation
// ============================================

/**
 * Evaluate a single condition against the current answers
 */
export function evaluateCondition(
    condition: LogicCondition,
    answers: Record<string, unknown>
): boolean {
    const value = answers[condition.questionId];

    switch (condition.operator) {
        case 'equals':
            return value === condition.value;

        case 'not_equals':
            return value !== condition.value;

        case 'contains':
            if (Array.isArray(value)) {
                return value.includes(condition.value);
            }
            if (typeof value === 'string' && typeof condition.value === 'string') {
                return value.includes(condition.value);
            }
            return false;

        case 'not_contains':
            if (Array.isArray(value)) {
                return !value.includes(condition.value);
            }
            if (typeof value === 'string' && typeof condition.value === 'string') {
                return !value.includes(condition.value);
            }
            return true;

        case 'greater_than':
            return typeof value === 'number' &&
                typeof condition.value === 'number' &&
                value > condition.value;

        case 'less_than':
            return typeof value === 'number' &&
                typeof condition.value === 'number' &&
                value < condition.value;

        case 'is_empty':
            return value === undefined ||
                value === null ||
                value === '' ||
                (Array.isArray(value) && value.length === 0);

        case 'is_not_empty':
            return value !== undefined &&
                value !== null &&
                value !== '' &&
                !(Array.isArray(value) && value.length === 0);

        case 'is_selected':
            if (Array.isArray(value)) {
                return value.includes(condition.value);
            }
            return value === condition.value;

        case 'is_not_selected':
            if (Array.isArray(value)) {
                return !value.includes(condition.value);
            }
            return value !== condition.value;

        default:
            return false;
    }
}

/**
 * Evaluate display logic (AND/OR combination of conditions)
 */
export function evaluateDisplayLogic(
    logic: DisplayLogic | undefined,
    answers: Record<string, unknown>
): boolean {
    if (!logic || logic.conditions.length === 0) {
        return true; // No logic = always show
    }

    const results = logic.conditions.map(cond =>
        evaluateCondition(cond, answers)
    );

    if (logic.operator === 'or') {
        return results.some(r => r);
    }

    // Default to AND
    return results.every(r => r);
}

// ============================================
// Visibility Filtering
// ============================================

/**
 * Get visible questions for a block based on display logic
 */
export function getVisibleQuestions(
    block: Block,
    answers: Record<string, unknown>
): Question[] {
    return block.questions.filter(q =>
        evaluateDisplayLogic(q.displayLogic, answers)
    );
}

/**
 * Get visible blocks based on display logic
 */
export function getVisibleBlocks(
    config: SurveyConfig,
    answers: Record<string, unknown>
): Block[] {
    return config.blocks.filter(block =>
        evaluateDisplayLogic(block.displayLogic, answers)
    );
}

// ============================================
// Randomization (Seeded)
// ============================================

/**
 * Seeded random number generator (Mulberry32)
 */
export function seededRandom(seed: number): () => number {
    return function () {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

/**
 * Shuffle array with seeded randomization
 */
export function shuffleWithSeed<T>(array: T[], seed: number): T[] {
    const random = seededRandom(seed);
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

// ============================================
// Navigation
// ============================================

/**
 * Calculate next position in the survey
 */
export function getNextPosition(
    config: SurveyConfig,
    state: SurveyState
): NavigationResult {
    const visibleBlocks = getVisibleBlocks(config, state.answers);

    if (visibleBlocks.length === 0) {
        return { nextBlockIndex: 0, nextQuestionIndex: 0, isComplete: true };
    }

    let blockIdx = state.currentBlockIndex;
    let questionIdx = state.currentQuestionIndex + 1;

    while (blockIdx < visibleBlocks.length) {
        const block = visibleBlocks[blockIdx];
        const visibleQuestions = getVisibleQuestions(block, state.answers);

        if (questionIdx < visibleQuestions.length) {
            return {
                nextBlockIndex: blockIdx,
                nextQuestionIndex: questionIdx,
                isComplete: false,
            };
        }

        // Move to next block
        blockIdx++;
        questionIdx = 0;
    }

    // No more questions
    return {
        nextBlockIndex: blockIdx,
        nextQuestionIndex: 0,
        isComplete: true,
    };
}

/**
 * Initialize survey state
 */
export function createInitialState(
    config: SurveyConfig,
    sessionSeed?: number
): SurveyState {
    return {
        currentBlockIndex: 0,
        currentQuestionIndex: 0,
        answers: {},
        embeddedData: config.embeddedData || {},
        seed: sessionSeed ?? Math.floor(Math.random() * 2147483647),
        visitedBlocks: [],
        visitedQuestions: [],
    };
}

// ============================================
// Validation
// ============================================

/**
 * Validate a single answer
 */
export function validateAnswer(
    question: Question,
    value: unknown
): string[] {
    const errors: string[] = [];
    const validation = question.validation;

    if (!validation) return errors;

    // Required check
    if (validation.required) {
        const isEmpty =
            value === undefined ||
            value === null ||
            value === '' ||
            (Array.isArray(value) && value.length === 0);

        if (isEmpty) {
            errors.push(validation.customMessage || 'This field is required');
            return errors; // No point checking other validations
        }
    }

    // Skip further validation if empty and not required
    if (value === undefined || value === null || value === '') {
        return errors;
    }

    // String validations
    if (typeof value === 'string') {
        if (validation.minLength && value.length < validation.minLength) {
            errors.push(`Minimum ${validation.minLength} characters required`);
        }
        if (validation.maxLength && value.length > validation.maxLength) {
            errors.push(`Maximum ${validation.maxLength} characters allowed`);
        }
        if (validation.pattern) {
            const regex = new RegExp(validation.pattern);
            if (!regex.test(value)) {
                errors.push(validation.customMessage || 'Invalid format');
            }
        }
    }

    // Number validations
    if (typeof value === 'number') {
        if (validation.minValue !== undefined && value < validation.minValue) {
            errors.push(`Minimum value is ${validation.minValue}`);
        }
        if (validation.maxValue !== undefined && value > validation.maxValue) {
            errors.push(`Maximum value is ${validation.maxValue}`);
        }
    }

    // Array validations (multiple choice)
    if (Array.isArray(value)) {
        if (validation.minSelections && value.length < validation.minSelections) {
            errors.push(`Select at least ${validation.minSelections} options`);
        }
        if (validation.maxSelections && value.length > validation.maxSelections) {
            errors.push(`Select at most ${validation.maxSelections} options`);
        }
    }

    return errors;
}

/**
 * Validate all answers for current page
 */
export function validatePage(
    questions: Question[],
    answers: Record<string, unknown>
): ValidationResult {
    const errors: Record<string, string[]> = {};
    let valid = true;

    for (const question of questions) {
        const questionErrors = validateAnswer(question, answers[question.id]);
        if (questionErrors.length > 0) {
            errors[question.id] = questionErrors;
            valid = false;
        }
    }

    return { valid, errors };
}

// ============================================
// Piped Text / Variable Interpolation
// ============================================

/**
 * Interpolate variables in text (e.g., "Hello, ${name}!")
 */
export function interpolateText(
    text: string,
    answers: Record<string, unknown>,
    embeddedData: Record<string, string>
): string {
    return text.replace(/\$\{([^}]+)\}/g, (match, key) => {
        // Check embedded data first
        if (key in embeddedData) {
            return embeddedData[key];
        }

        // Then check answers
        if (key in answers) {
            const value = answers[key];
            if (typeof value === 'string' || typeof value === 'number') {
                return String(value);
            }
        }

        // Return original if not found
        return match;
    });
}

// ============================================
// Progress Calculation
// ============================================

/**
 * Calculate survey completion progress (0-100)
 */
export function calculateProgress(
    config: SurveyConfig,
    state: SurveyState
): number {
    const visibleBlocks = getVisibleBlocks(config, state.answers);

    if (visibleBlocks.length === 0) return 100;

    let totalQuestions = 0;
    let answeredQuestions = 0;

    for (const block of visibleBlocks) {
        const visibleQuestions = getVisibleQuestions(block, state.answers);
        totalQuestions += visibleQuestions.length;

        for (const question of visibleQuestions) {
            if (question.id in state.answers) {
                answeredQuestions++;
            }
        }
    }

    if (totalQuestions === 0) return 100;

    return Math.round((answeredQuestions / totalQuestions) * 100);
}
