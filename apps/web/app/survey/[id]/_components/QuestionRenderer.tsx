'use client';

import type { Question } from '@repo/shared/schemas';
import { TextInput } from './inputs/TextInput';
import { SingleChoice } from './inputs/SingleChoice';
import { MultipleChoice } from './inputs/MultipleChoice';
import { SliderInput } from './inputs/SliderInput';
import { NPSInput } from './inputs/NPSInput';
import { MatrixInput } from './inputs/MatrixInput';
import { RankOrderInput } from './inputs/RankOrderInput';
import { DateInput } from './inputs/DateInput';
import styles from './QuestionRenderer.module.css';

interface QuestionRendererProps {
    question: Question;
    questionNumber?: number;
    value: unknown;
    error?: string;
    onChange: (value: unknown) => void;
}

export function QuestionRenderer({
    question,
    questionNumber,
    value,
    error,
    onChange,
}: QuestionRendererProps) {
    return (
        <div className={`${styles.question} ${error ? styles.hasError : ''}`}>
            {/* Question Header */}
            <div className={styles.header}>
                {questionNumber && (
                    <span className={styles.number}>{questionNumber}</span>
                )}
                <div className={styles.textContent}>
                    <h3 className={styles.text}>
                        {question.text}
                        {question.validation?.required && (
                            <span className={styles.required}>*</span>
                        )}
                    </h3>
                    {question.description && (
                        <p className={styles.description}>{question.description}</p>
                    )}
                </div>
            </div>

            {/* Question Input */}
            <div className={styles.input}>
                {renderInput(question, value, onChange)}
            </div>

            {/* Error Message */}
            {error && (
                <div className={styles.error}>
                    <span className={styles.errorIcon}>⚠️</span>
                    {error}
                </div>
            )}
        </div>
    );
}

function renderInput(
    question: Question,
    value: unknown,
    onChange: (value: unknown) => void
) {
    switch (question.type) {
        case 'text':
            return (
                <TextInput
                    value={(value as string) || ''}
                    onChange={onChange}
                    multiline={question.multiline}
                    rows={question.rows}
                    placeholder={question.placeholder}
                />
            );

        case 'single_choice':
            return (
                <SingleChoice
                    value={(value as string) || ''}
                    onChange={onChange}
                    choices={question.choices}
                    displayStyle={question.displayStyle}
                    allowOther={question.allowOther}
                    otherLabel={question.otherLabel}
                />
            );

        case 'multiple_choice':
            return (
                <MultipleChoice
                    value={(value as string[]) || []}
                    onChange={onChange}
                    choices={question.choices}
                    allowOther={question.allowOther}
                    otherLabel={question.otherLabel}
                />
            );

        case 'slider':
            return (
                <SliderInput
                    value={(value as number) ?? question.min}
                    onChange={onChange}
                    min={question.min}
                    max={question.max}
                    step={question.step}
                    minLabel={question.minLabel}
                    maxLabel={question.maxLabel}
                    showValue={question.showValue}
                />
            );

        case 'nps':
            return (
                <NPSInput
                    value={(value as number) ?? null}
                    onChange={onChange}
                    minLabel={question.minLabel}
                    maxLabel={question.maxLabel}
                />
            );

        case 'matrix':
            return (
                <MatrixInput
                    value={(value as Record<string, string>) || {}}
                    onChange={onChange}
                    rows={question.rows}
                    columns={question.columns}
                    allowMultiple={question.allowMultiple}
                />
            );

        case 'rank_order':
            return (
                <RankOrderInput
                    value={(value as string[]) || question.items.map(i => i.id)}
                    onChange={onChange}
                    items={question.items}
                />
            );

        case 'date':
            return (
                <DateInput
                    value={(value as string) || ''}
                    onChange={onChange}
                    includeTime={question.includeTime}
                    minDate={question.minDate}
                    maxDate={question.maxDate}
                />
            );

        default:
            return <div>Unsupported question type</div>;
    }
}
