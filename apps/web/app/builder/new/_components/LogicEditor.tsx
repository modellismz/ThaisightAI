'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useBuilderStore } from '../../../stores/builder.store';
import styles from './LogicEditor.module.css';

interface LogicCondition {
    questionId: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
    value?: unknown;
}

interface DisplayLogic {
    conditions: LogicCondition[];
    operator: 'and' | 'or';
}

interface LogicEditorProps {
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

export function LogicEditor({ question, blockId }: LogicEditorProps) {
    const [isExpanded, setIsExpanded] = useState(!!question.displayLogic);
    const { config, updateQuestion } = useBuilderStore();

    // Get all questions before this one (to reference in conditions)
    type QuestionRef = { id: string; text: string; type: string; choices?: { id: string; text: string }[] };
    const availableQuestions: QuestionRef[] = [];

    for (const block of config.blocks) {
        for (const q of block.questions) {
            if (q.id === question.id) break; // Only questions before this one
            const qRef: QuestionRef = {
                id: q.id,
                text: q.text,
                type: q.type,
            };
            // Only add choices for choice-based questions
            if ((q.type === 'single_choice' || q.type === 'multiple_choice') && 'choices' in q) {
                qRef.choices = (q as any).choices;
            }
            availableQuestions.push(qRef);
        }
        if (block.questions.some((q) => q.id === question.id)) break;
    }

    const displayLogic: DisplayLogic = question.displayLogic
        ? {
            conditions: question.displayLogic.conditions || [],
            operator: question.displayLogic.operator || 'and'
        }
        : { conditions: [], operator: 'and' };

    const updateLogic = (newLogic: DisplayLogic) => {
        updateQuestion(blockId, question.id, {
            displayLogic: newLogic.conditions.length > 0 ? newLogic : undefined,
        });
    };

    const addCondition = () => {
        if (availableQuestions.length === 0) return;
        const newCondition: LogicCondition = {
            questionId: availableQuestions[0].id,
            operator: 'equals',
            value: '',
        };
        updateLogic({
            ...displayLogic,
            conditions: [...displayLogic.conditions, newCondition],
        });
    };

    const updateCondition = (index: number, updates: Partial<LogicCondition>) => {
        const newConditions = [...displayLogic.conditions];
        newConditions[index] = { ...newConditions[index], ...updates };
        updateLogic({ ...displayLogic, conditions: newConditions });
    };

    const removeCondition = (index: number) => {
        const newConditions = displayLogic.conditions.filter((_, i) => i !== index);
        updateLogic({ ...displayLogic, conditions: newConditions });
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
        return null; // No questions to reference yet
    }

    return (
        <div className={styles.logicSection}>
            <button
                className={styles.toggleHeader}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className={styles.toggleTitle}>Display Logic</span>
                {displayLogic.conditions.length > 0 && (
                    <span className={styles.conditionCount}>
                        {displayLogic.conditions.length} condition{displayLogic.conditions.length > 1 ? 's' : ''}
                    </span>
                )}
            </button>

            {isExpanded && (
                <div className={styles.logicContent}>
                    <p className={styles.hint}>
                        Show this question only when the following conditions are met:
                    </p>

                    {displayLogic.conditions.length > 0 && (
                        <>
                            <div className={styles.logicTypeSelector}>
                                <label className={styles.radioLabel}>
                                    <input
                                        type="radio"
                                        name={`logic-type-${question.id}`}
                                        checked={displayLogic.operator === 'and'}
                                        onChange={() => updateLogic({ ...displayLogic, operator: 'and' })}
                                    />
                                    ALL conditions (AND)
                                </label>
                                <label className={styles.radioLabel}>
                                    <input
                                        type="radio"
                                        name={`logic-type-${question.id}`}
                                        checked={displayLogic.operator === 'or'}
                                        onChange={() => updateLogic({ ...displayLogic, operator: 'or' })}
                                    />
                                    ANY condition (OR)
                                </label>
                            </div>

                            <div className={styles.conditionsList}>
                                {displayLogic.conditions.map((condition, index) => (
                                    <div key={index} className={styles.conditionRow}>
                                        {index > 0 && (
                                            <span className={styles.connector}>
                                                {displayLogic.operator === 'and' ? 'AND' : 'OR'}
                                            </span>
                                        )}
                                        <div className={styles.conditionFields}>
                                            {/* Question selector */}
                                            <select
                                                className={styles.select}
                                                value={condition.questionId}
                                                onChange={(e) => updateCondition(index, {
                                                    questionId: e.target.value,
                                                    value: '' // Reset value when question changes
                                                })}
                                            >
                                                {availableQuestions.map((q) => (
                                                    <option key={q.id} value={q.id}>
                                                        {q.text.substring(0, 40)}{q.text.length > 40 ? '...' : ''}
                                                    </option>
                                                ))}
                                            </select>

                                            {/* Operator selector */}
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

                                            {/* Value input (varies by question type and operator) */}
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
    // For choice-based questions, show a dropdown
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

    // For numeric questions, show number input
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

    // Default: text input
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
