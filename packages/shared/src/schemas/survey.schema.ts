/**
 * Survey Schema Definitions
 * Core Zod schemas for survey configuration
 */
import { z } from 'zod';

// ============================================
// Base Types
// ============================================

export const UUIDSchema = z.string().uuid();

// ============================================
// Question Types
// ============================================

export const QuestionTypeSchema = z.enum([
    'text',
    'single_choice',
    'multiple_choice',
    'matrix',
    'slider',
    'nps',
    'rank_order',
    'date',
]);

export type QuestionType = z.infer<typeof QuestionTypeSchema>;

// ============================================
// Choice/Option Schemas
// ============================================

export const ChoiceSchema = z.object({
    id: z.string(),
    text: z.string(),
    value: z.string().optional(),
    imageUrl: z.string().url().optional(),
});

export type Choice = z.infer<typeof ChoiceSchema>;

// ============================================
// Validation Rules
// ============================================

export const ValidationRuleSchema = z.object({
    required: z.boolean().default(false),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
    pattern: z.string().optional(), // regex
    minSelections: z.number().optional(),
    maxSelections: z.number().optional(),
    customMessage: z.string().optional(),
});

export type ValidationRule = z.infer<typeof ValidationRuleSchema>;

// ============================================
// Display Logic Condition
// ============================================

export const ConditionOperatorSchema = z.enum([
    'equals',
    'not_equals',
    'contains',
    'not_contains',
    'greater_than',
    'less_than',
    'is_empty',
    'is_not_empty',
    'is_selected',
    'is_not_selected',
]);

export const LogicConditionSchema = z.object({
    questionId: z.string(),
    operator: ConditionOperatorSchema,
    value: z.union([z.string(), z.number(), z.array(z.string())]).optional(),
});

export const DisplayLogicSchema = z.object({
    conditions: z.array(LogicConditionSchema),
    operator: z.enum(['and', 'or']).default('and'),
});

export type LogicCondition = z.infer<typeof LogicConditionSchema>;
export type DisplayLogic = z.infer<typeof DisplayLogicSchema>;

// ============================================
// Question Schemas
// ============================================

export const CarryForwardRuleSchema = z.object({
    sourceQuestionId: z.string(),
    logicType: z.enum(['selected', 'not_selected', 'displayed', 'not_displayed', 'all']),
});

export type CarryForwardRule = z.infer<typeof CarryForwardRuleSchema>;

const BaseQuestionSchema = z.object({
    id: z.string(),
    type: QuestionTypeSchema,
    text: z.string(),
    description: z.string().optional(),
    helpText: z.string().optional(),
    validation: ValidationRuleSchema.optional(),
    displayLogic: DisplayLogicSchema.optional(),
    carryForward: CarryForwardRuleSchema.optional(),
});

// Text Question
export const TextQuestionSchema = BaseQuestionSchema.extend({
    type: z.literal('text'),
    placeholder: z.string().optional(),
    multiline: z.boolean().default(false),
    rows: z.number().min(1).max(20).default(3),
});

// Single Choice Question
export const SingleChoiceQuestionSchema = BaseQuestionSchema.extend({
    type: z.literal('single_choice'),
    choices: z.array(ChoiceSchema).min(1),
    displayStyle: z.enum(['radio', 'dropdown', 'buttons']).default('radio'),
    allowOther: z.boolean().default(false),
    otherLabel: z.string().default('Other'),
    randomize: z.boolean().default(false),
});

// Multiple Choice Question
export const MultipleChoiceQuestionSchema = BaseQuestionSchema.extend({
    type: z.literal('multiple_choice'),
    choices: z.array(ChoiceSchema).min(1),
    displayStyle: z.enum(['checkbox', 'buttons']).default('checkbox'),
    allowOther: z.boolean().default(false),
    otherLabel: z.string().default('Other'),
    randomize: z.boolean().default(false),
});

// Matrix/Likert Question
export const MatrixQuestionSchema = BaseQuestionSchema.extend({
    type: z.literal('matrix'),
    rows: z.array(z.object({
        id: z.string(),
        text: z.string(),
    })).min(1),
    columns: z.array(z.object({
        id: z.string(),
        text: z.string(),
        value: z.number().optional(),
    })).min(1),
    allowMultiple: z.boolean().default(false),
});

// Slider Question
export const SliderQuestionSchema = BaseQuestionSchema.extend({
    type: z.literal('slider'),
    min: z.number().default(0),
    max: z.number().default(100),
    step: z.number().default(1),
    minLabel: z.string().optional(),
    maxLabel: z.string().optional(),
    showValue: z.boolean().default(true),
});

// NPS Question
export const NPSQuestionSchema = BaseQuestionSchema.extend({
    type: z.literal('nps'),
    minLabel: z.string().default('Not at all likely'),
    maxLabel: z.string().default('Extremely likely'),
});

// Rank Order Question
export const RankOrderQuestionSchema = BaseQuestionSchema.extend({
    type: z.literal('rank_order'),
    items: z.array(z.object({
        id: z.string(),
        text: z.string(),
    })).min(2),
    maxRanks: z.number().optional(),
});

// Date Question
export const DateQuestionSchema = BaseQuestionSchema.extend({
    type: z.literal('date'),
    includeTime: z.boolean().default(false),
    minDate: z.string().optional(),
    maxDate: z.string().optional(),
    format: z.string().default('YYYY-MM-DD'),
});

// Union of all question types
export const QuestionSchema = z.discriminatedUnion('type', [
    TextQuestionSchema,
    SingleChoiceQuestionSchema,
    MultipleChoiceQuestionSchema,
    MatrixQuestionSchema,
    SliderQuestionSchema,
    NPSQuestionSchema,
    RankOrderQuestionSchema,
    DateQuestionSchema,
]);

export type Question = z.infer<typeof QuestionSchema>;

// ============================================
// Block Schema (Container for Questions)
// ============================================

export const BlockSchema = z.object({
    id: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    questions: z.array(QuestionSchema),
    displayLogic: DisplayLogicSchema.optional(),
    randomize: z.boolean().default(false),
});

export type Block = z.infer<typeof BlockSchema>;

// ============================================
// Survey Settings
// ============================================

export const SurveySettingsSchema = z.object({
    // Appearance
    theme: z.string().default('default'),
    progressBar: z.enum(['none', 'top', 'bottom']).default('top'),
    showQuestionNumbers: z.boolean().default(true),

    // Behavior
    allowBack: z.boolean().default(true),
    saveProgress: z.boolean().default(true),
    oneQuestionPerPage: z.boolean().default(false),
    randomizeBlocks: z.boolean().default(false),

    // Completion
    thankYouMessage: z.string().default('Thank you for completing this survey!'),
    redirectUrl: z.string().url().optional(),
    redirectDelay: z.number().default(3),

    // Access
    requireAuth: z.boolean().default(false),
    allowMultipleResponses: z.boolean().default(false),
    quotaLimit: z.number().optional(),

    // Dates
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});

export type SurveySettings = z.infer<typeof SurveySettingsSchema>;

// ============================================
// Full Survey Config
// ============================================

export const SurveyConfigSchema = z.object({
    version: z.string().default('1.0'),
    blocks: z.array(BlockSchema),
    settings: SurveySettingsSchema.default({}),
    embeddedData: z.record(z.string()).optional(),
    translations: z.record(z.string(), z.record(z.string())).optional(),
});

export type SurveyConfig = z.infer<typeof SurveyConfigSchema>;

// ============================================
// API DTOs
// ============================================

export const CreateSurveySchema = z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    defaultLanguage: z.string().default('en'),
});

export const UpdateSurveySchema = z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    status: z.enum(['draft', 'published', 'closed']).optional(),
});

export const UpdateDraftConfigSchema = z.object({
    config: SurveyConfigSchema,
});

export type CreateSurvey = z.infer<typeof CreateSurveySchema>;
export type UpdateSurvey = z.infer<typeof UpdateSurveySchema>;
export type UpdateDraftConfig = z.infer<typeof UpdateDraftConfigSchema>;
