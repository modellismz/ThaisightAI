'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Link2 } from 'lucide-react';
import { useBuilderStore } from '../../../stores/builder.store';
import styles from './LogicEditor.module.css';

interface CarryForwardEditorProps {
    question: any;
    blockId: string;
}

export function CarryForwardEditor({ question, blockId }: CarryForwardEditorProps) {
    const [isExpanded, setIsExpanded] = useState(!!question.carryForward);
    const { config, updateQuestion } = useBuilderStore();

    // Only available for choice-based questions
    if (!['single_choice', 'multiple_choice', 'rank_order'].includes(question.type)) {
        return null;
    }

    // Get all choice-based questions before this one
    type SourceQuestion = { id: string; text: string; type: string; choices?: { id: string; text: string }[] };
    const sourceQuestions: SourceQuestion[] = [];

    for (const block of config.blocks) {
        for (const q of block.questions) {
            if (q.id === question.id) break;
            if (['single_choice', 'multiple_choice'].includes(q.type) && 'choices' in q) {
                sourceQuestions.push({
                    id: q.id,
                    text: q.text,
                    type: q.type,
                    choices: (q as any).choices,
                });
            }
        }
        if (block.questions.some((q) => q.id === question.id)) break;
    }

    if (sourceQuestions.length === 0) {
        return null;
    }

    const carryForward = question.carryForward || {
        sourceQuestionId: '',
        logicType: 'selected', // 'selected', 'not_selected', 'all'
    };

    const updateCarryForward = (updates: Partial<typeof carryForward>) => {
        const newConfig = { ...carryForward, ...updates };
        updateQuestion(blockId, question.id, {
            carryForward: newConfig.sourceQuestionId ? newConfig : undefined,
        });
    };

    return (
        <div className={styles.logicSection}>
            <button
                className={styles.toggleHeader}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className={styles.toggleTitle}>Carry Forward Choices</span>
                {carryForward.sourceQuestionId && (
                    <span className={styles.conditionCount}>
                        <Link2 size={12} />
                    </span>
                )}
            </button>

            {isExpanded && (
                <div className={styles.logicContent}>
                    <p className={styles.hint}>
                        Use answer choices from a previous question:
                    </p>

                    <div className={styles.carryForwardFields}>
                        <div className={styles.carryForwardRow}>
                            <label className={styles.fieldLabel}>Source Question:</label>
                            <select
                                className={styles.select}
                                value={carryForward.sourceQuestionId}
                                onChange={(e) => updateCarryForward({ sourceQuestionId: e.target.value })}
                            >
                                <option value="">None (use own choices)</option>
                                {sourceQuestions.map((q) => (
                                    <option key={q.id} value={q.id}>
                                        {q.text.substring(0, 50)}{q.text.length > 50 ? '...' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {carryForward.sourceQuestionId && (
                            <div className={styles.carryForwardRow}>
                                <label className={styles.fieldLabel}>Carry:</label>
                                <select
                                    className={styles.select}
                                    value={carryForward.logicType}
                                    onChange={(e) => updateCarryForward({ logicType: e.target.value })}
                                >
                                    <option value="selected">Selected choices only</option>
                                    <option value="not_selected">Not selected choices only</option>
                                    <option value="all">All choices</option>
                                </select>
                            </div>
                        )}

                        {carryForward.sourceQuestionId && (
                            <div className={styles.carryForwardPreview}>
                                <span className={styles.previewLabel}>Preview:</span>
                                <span className={styles.previewText}>
                                    Choices will be dynamically loaded from "{sourceQuestions.find(q => q.id === carryForward.sourceQuestionId)?.text.substring(0, 30)}..."
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
