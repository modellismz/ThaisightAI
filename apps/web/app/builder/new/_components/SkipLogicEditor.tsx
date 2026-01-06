'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useBuilderStore } from '../../../stores/builder.store';
import styles from './LogicEditor.module.css';

interface SkipCondition {
    questionId: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
    value?: unknown;
}

interface SkipLogic {
    conditions: SkipCondition[];
    operator: 'and' | 'or';
    skipTo: string; // block ID or 'end'
}

interface SkipLogicEditorProps {
    question: any;
    blockId: string;
}

const OPERATORS = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Does not equal' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is answered' },
];

export function SkipLogicEditor({ question, blockId }: SkipLogicEditorProps) {
    const [isExpanded, setIsExpanded] = useState(!!question.skipLogic);
    const { config, updateQuestion } = useBuilderStore();

    // Get all questions up to and including this one (to reference in conditions)
    type QuestionRef = { id: string; text: string; type: string; choices?: { id: string; text: string }[] };
    const availableQuestions: QuestionRef[] = [];
    let foundCurrentQuestion = false;

    for (const block of config.blocks) {
        for (const q of block.questions) {
            const qRef: QuestionRef = {
                id: q.id,
                text: q.text,
                type: q.type,
            };
            if ((q.type === 'single_choice' || q.type === 'multiple_choice') && 'choices' in q) {
                qRef.choices = (q as any).choices;
            }
            availableQuestions.push(qRef);

            if (q.id === question.id) {
                foundCurrentQuestion = true;
                break;
            }
        }
        if (foundCurrentQuestion) break;
    }

    // Get all blocks after current block for skip targets
    let currentBlockFound = false;
    const skipTargets: { id: string; label: string }[] = [];

    for (const block of config.blocks) {
        if (currentBlockFound) {
            skipTargets.push({
                id: block.id,
                label: block.title || `Block ${config.blocks.indexOf(block) + 1}`,
            });
        }
        if (block.id === blockId) {
            currentBlockFound = true;
        }
    }
    skipTargets.push({ id: 'end', label: 'End of Survey' });

    const skipLogic: SkipLogic = question.skipLogic
        ? {
            conditions: question.skipLogic.conditions || [],
            operator: question.skipLogic.operator || 'and',
            skipTo: question.skipLogic.skipTo || 'end',
        }
        : { conditions: [], operator: 'and', skipTo: 'end' };

    const updateLogic = (newLogic: SkipLogic) => {
        updateQuestion(blockId, question.id, {
            skipLogic: newLogic.conditions.length > 0 ? newLogic : undefined,
        });
    };

    const addCondition = () => {
        if (availableQuestions.length === 0) return;
        const newCondition: SkipCondition = {
            questionId: availableQuestions[availableQuestions.length - 1].id, // Current question by default
            operator: 'equals',
            value: '',
        };
        updateLogic({
            ...skipLogic,
            conditions: [...skipLogic.conditions, newCondition],
        });
    };

    const updateCondition = (index: number, updates: Partial<SkipCondition>) => {
        const newConditions = [...skipLogic.conditions];
        newConditions[index] = { ...newConditions[index], ...updates };
        updateLogic({ ...skipLogic, conditions: newConditions });
    };

    const removeCondition = (index: number) => {
        const newConditions = skipLogic.conditions.filter((_, i) => i !== index);
        updateLogic({ ...skipLogic, conditions: newConditions });
    };

    const getQuestionChoices = (questionId: string) => {
        const q = availableQuestions.find((q) => q.id === questionId);
        return q?.choices || [];
    };

    const getQuestionType = (questionId: string) => {
        const q = availableQuestions.find((q) => q.id === questionId);
        return q?.type || 'text';
    };

    if (availableQuestions.length === 0) {
        return null;
    }

    return (
        <div className={styles.logicSection}>
            <button
                className={styles.toggleHeader}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className={styles.toggleTitle}>Skip Logic</span>
                {skipLogic.conditions.length > 0 && (
                    <span className={styles.conditionCount}>
                        {skipLogic.conditions.length} condition{skipLogic.conditions.length > 1 ? 's' : ''}
                    </span>
                )}
            </button>

            {isExpanded && (
                <div className={styles.logicContent}>
                    <p className={styles.hint}>
                        Skip to a different block based on the answer to this question:
                    </p>

                    {skipLogic.conditions.length > 0 && (
                        <>
                            <div className={styles.logicTypeSelector}>
                                <label className={styles.radioLabel}>
                                    <input
                                        type="radio"
                                        name={`skip-logic-type-${question.id}`}
                                        checked={skipLogic.operator === 'and'}
                                        onChange={() => updateLogic({ ...skipLogic, operator: 'and' })}
                                    />
                                    ALL conditions (AND)
                                </label>
                                <label className={styles.radioLabel}>
                                    <input
                                        type="radio"
                                        name={`skip-logic-type-${question.id}`}
                                        checked={skipLogic.operator === 'or'}
                                        onChange={() => updateLogic({ ...skipLogic, operator: 'or' })}
                                    />
                                    ANY condition (OR)
                                </label>
                            </div>

                            <div className={styles.conditionsList}>
                                {skipLogic.conditions.map((condition, index) => (
                                    <div key={index} className={styles.conditionRow}>
                                        {index > 0 && (
                                            <span className={styles.connector}>
                                                {skipLogic.operator === 'and' ? 'AND' : 'OR'}
                                            </span>
                                        )}
                                        <div className={styles.conditionFields}>
                                            <select
                                                className={styles.select}
                                                value={condition.questionId}
                                                onChange={(e) => updateCondition(index, {
                                                    questionId: e.target.value,
                                                    value: ''
                                                })}
                                            >
                                                {availableQuestions.map((q) => (
                                                    <option key={q.id} value={q.id}>
                                                        {q.text.substring(0, 40)}{q.text.length > 40 ? '...' : ''}
                                                    </option>
                                                ))}
                                            </select>

                                            <select
                                                className={styles.selectSmall}
                                                value={condition.operator}
                                                onChange={(e) => updateCondition(index, { operator: e.target.value as any })}
                                            >
                                                {OPERATORS.map((op) => (
                                                    <option key={op.value} value={op.value}>
                                                        {op.label}
                                                    </option>
                                                ))}
                                            </select>

                                            {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
                                                <ConditionValueInput
                                                    questionType={getQuestionType(condition.questionId)}
                                                    choices={getQuestionChoices(condition.questionId)}
                                                    value={condition.value}
                                                    onChange={(value) => updateCondition(index, { value })}
                                                />
                                            )}

                                            <button
                                                className={styles.deleteBtn}
                                                onClick={() => removeCondition(index)}
                                                title="Remove condition"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Skip Target Selector */}
                            <div className={styles.skipTargetSection}>
                                <label className={styles.skipTargetLabel}>Then skip to:</label>
                                <select
                                    className={styles.select}
                                    value={skipLogic.skipTo}
                                    onChange={(e) => updateLogic({ ...skipLogic, skipTo: e.target.value })}
                                >
                                    {skipTargets.map((target) => (
                                        <option key={target.id} value={target.id}>
                                            {target.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    <button className={styles.addConditionBtn} onClick={addCondition}>
                        <Plus size={14} />
                        Add Condition
                    </button>
                </div>
            )}
        </div>
    );
}

function ConditionValueInput({
    questionType,
    choices,
    value,
    onChange,
}: {
    questionType: string;
    choices: { id: string; text: string }[];
    value: unknown;
    onChange: (value: unknown) => void;
}) {
    if (['single_choice', 'multiple_choice'].includes(questionType) && choices.length > 0) {
        return (
            <select
                className={styles.selectSmall}
                value={(value as string) || ''}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="">Select answer...</option>
                {choices.map((choice) => (
                    <option key={choice.id} value={choice.id}>
                        {choice.text}
                    </option>
                ))}
            </select>
        );
    }

    if (['slider', 'nps'].includes(questionType)) {
        return (
            <input
                type="number"
                className={styles.input}
                value={(value as number) ?? ''}
                onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
                placeholder="Value"
            />
        );
    }

    return (
        <input
            type="text"
            className={styles.input}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Value"
        />
    );
}
