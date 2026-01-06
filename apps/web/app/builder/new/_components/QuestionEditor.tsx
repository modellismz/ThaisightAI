'use client';

import { useBuilderStore } from '../../../stores/builder.store';
import { Plus, Trash2 } from 'lucide-react';
import { LogicEditor } from './LogicEditor';
import { SkipLogicEditor } from './SkipLogicEditor';
import { CarryForwardEditor } from './CarryForwardEditor';
import styles from './QuestionEditor.module.css';

export function QuestionEditor() {
    const { config, selectedQuestionId } = useBuilderStore();

    // Find the selected question and its block
    let selectedQuestion = null;
    let selectedBlockId = null;

    for (const block of config.blocks) {
        const question = block.questions.find((q: any) => q.id === selectedQuestionId);
        if (question) {
            selectedQuestion = question;
            selectedBlockId = block.id;
            break;
        }
    }

    if (!selectedQuestion || !selectedBlockId) {
        return null;
    }

    return (
        <div className={styles.editor}>
            <h3 className={styles.title}>Question Settings</h3>

            <div className={styles.section}>
                <label className="label">Question Text</label>
                <textarea
                    className={`input ${styles.textarea}`}
                    value={selectedQuestion.text}
                    onChange={(e) => {
                        useBuilderStore.getState().updateQuestion(
                            selectedBlockId,
                            selectedQuestion.id,
                            { text: e.target.value }
                        );
                    }}
                    rows={3}
                />
            </div>

            <div className={styles.section}>
                <label className="label">Description (optional)</label>
                <input
                    type="text"
                    className="input"
                    value={selectedQuestion.description || ''}
                    onChange={(e) => {
                        useBuilderStore.getState().updateQuestion(
                            selectedBlockId,
                            selectedQuestion.id,
                            { description: e.target.value }
                        );
                    }}
                    placeholder="Add help text..."
                />
            </div>

            {/* Choice-based questions */}
            {(selectedQuestion.type === 'single_choice' || selectedQuestion.type === 'multiple_choice') && (
                <ChoiceEditor
                    question={selectedQuestion}
                    blockId={selectedBlockId}
                />
            )}

            {/* Slider settings */}
            {selectedQuestion.type === 'slider' && (
                <SliderEditor
                    question={selectedQuestion}
                    blockId={selectedBlockId}
                />
            )}

            {/* Validation */}
            <div className={styles.section}>
                <h4 className={styles.sectionTitle}>Validation</h4>
                <label className={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        checked={selectedQuestion.validation?.required || false}
                        onChange={(e) => {
                            useBuilderStore.getState().updateQuestion(
                                selectedBlockId,
                                selectedQuestion.id,
                                {
                                    validation: {
                                        ...selectedQuestion.validation,
                                        required: e.target.checked
                                    }
                                }
                            );
                        }}
                    />
                    Required
                </label>
            </div>

            {/* Display Logic */}
            <LogicEditor question={selectedQuestion} blockId={selectedBlockId} />

            {/* Skip Logic */}
            <SkipLogicEditor question={selectedQuestion} blockId={selectedBlockId} />

            {/* Carry Forward Choices */}
            <CarryForwardEditor question={selectedQuestion} blockId={selectedBlockId} />
        </div>
    );
}

function ChoiceEditor({ question, blockId }: { question: any; blockId: string }) {
    const { updateQuestion } = useBuilderStore();

    const addChoice = () => {
        const newChoice = {
            id: crypto.randomUUID(),
            text: `Option ${question.choices.length + 1}`,
        };
        updateQuestion(blockId, question.id, {
            choices: [...question.choices, newChoice],
        });
    };

    const updateChoice = (choiceId: string, text: string) => {
        updateQuestion(blockId, question.id, {
            choices: question.choices.map((c: any) =>
                c.id === choiceId ? { ...c, text } : c
            ),
        });
    };

    const deleteChoice = (choiceId: string) => {
        if (question.choices.length <= 1) return;
        updateQuestion(blockId, question.id, {
            choices: question.choices.filter((c: any) => c.id !== choiceId),
        });
    };

    return (
        <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Answer Choices</h4>
            <div className={styles.choiceList}>
                {question.choices.map((choice: any, index: number) => (
                    <div key={choice.id} className={styles.choiceItem}>
                        <span className={styles.choiceNumber}>{index + 1}</span>
                        <input
                            type="text"
                            className="input"
                            value={choice.text}
                            onChange={(e) => updateChoice(choice.id, e.target.value)}
                        />
                        <button
                            className={styles.deleteChoiceBtn}
                            onClick={() => deleteChoice(choice.id)}
                            disabled={question.choices.length <= 1}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
            <button className={styles.addChoiceBtn} onClick={addChoice}>
                <Plus size={14} />
                Add Choice
            </button>

            <label className={styles.checkboxLabel}>
                <input
                    type="checkbox"
                    checked={question.allowOther || false}
                    onChange={(e) => {
                        updateQuestion(blockId, question.id, { allowOther: e.target.checked });
                    }}
                />
                Allow "Other" option
            </label>

            <label className={styles.checkboxLabel}>
                <input
                    type="checkbox"
                    checked={question.randomize || false}
                    onChange={(e) => {
                        updateQuestion(blockId, question.id, { randomize: e.target.checked });
                    }}
                />
                Randomize order
            </label>
        </div>
    );
}

function SliderEditor({ question, blockId }: { question: any; blockId: string }) {
    const { updateQuestion } = useBuilderStore();

    return (
        <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Slider Settings</h4>

            <div className={styles.row}>
                <div className={styles.field}>
                    <label className="label">Min</label>
                    <input
                        type="number"
                        className="input"
                        value={question.min}
                        onChange={(e) => {
                            updateQuestion(blockId, question.id, { min: parseInt(e.target.value) || 0 });
                        }}
                    />
                </div>
                <div className={styles.field}>
                    <label className="label">Max</label>
                    <input
                        type="number"
                        className="input"
                        value={question.max}
                        onChange={(e) => {
                            updateQuestion(blockId, question.id, { max: parseInt(e.target.value) || 100 });
                        }}
                    />
                </div>
                <div className={styles.field}>
                    <label className="label">Step</label>
                    <input
                        type="number"
                        className="input"
                        value={question.step}
                        onChange={(e) => {
                            updateQuestion(blockId, question.id, { step: parseInt(e.target.value) || 1 });
                        }}
                    />
                </div>
            </div>

            <div className={styles.row}>
                <div className={styles.field}>
                    <label className="label">Min Label</label>
                    <input
                        type="text"
                        className="input"
                        value={question.minLabel || ''}
                        placeholder="e.g., Poor"
                        onChange={(e) => {
                            updateQuestion(blockId, question.id, { minLabel: e.target.value });
                        }}
                    />
                </div>
                <div className={styles.field}>
                    <label className="label">Max Label</label>
                    <input
                        type="text"
                        className="input"
                        value={question.maxLabel || ''}
                        placeholder="e.g., Excellent"
                        onChange={(e) => {
                            updateQuestion(blockId, question.id, { maxLabel: e.target.value });
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
