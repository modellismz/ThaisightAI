'use client';

import { useState } from 'react';
import { useBuilderStore } from '../../../stores/builder.store';
import { GripVertical, Trash2, ChevronDown, ChevronRight, Eye, GitBranch, Shuffle, CheckCircle2, Link2 } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from './BlockList.module.css';

export function BlockList() {
    const { config, selectedBlockId, selectBlock, deleteBlock, addQuestion, reorderQuestions, reorderBlocks } = useBuilderStore();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleBlockDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = config.blocks.findIndex(b => b.id === active.id);
            const newIndex = config.blocks.findIndex(b => b.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                reorderBlocks(oldIndex, newIndex);
            }
        }
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleBlockDragEnd}>
            <SortableContext items={config.blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                <div className={styles.blockList}>
                    {config.blocks.map((block, blockIndex) => (
                        <SortableBlock
                            key={block.id}
                            block={block}
                            blockIndex={blockIndex}
                            isSelected={selectedBlockId === block.id}
                            onSelect={() => selectBlock(block.id)}
                            onDelete={() => deleteBlock(block.id)}
                            onAddQuestion={(type) => addQuestion(block.id, type as any)}
                            onReorderQuestions={(oldIndex, newIndex) => reorderQuestions(block.id, oldIndex, newIndex)}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

interface SortableBlockProps {
    block: any;
    blockIndex: number;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onAddQuestion: (type: string) => void;
    onReorderQuestions: (oldIndex: number, newIndex: number) => void;
}

function SortableBlock({ block, blockIndex, isSelected, onSelect, onDelete, onAddQuestion, onReorderQuestions }: SortableBlockProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const { selectQuestion, selectedQuestionId, deleteQuestion } = useBuilderStore();

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleQuestionDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = block.questions.findIndex((q: any) => q.id === active.id);
            const newIndex = block.questions.findIndex((q: any) => q.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                onReorderQuestions(oldIndex, newIndex);
            }
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${styles.block} ${isSelected ? styles.selected : ''}`}
            onClick={onSelect}
        >
            {/* Block Header */}
            <div className={styles.blockHeader}>
                <div className={styles.blockHeaderLeft}>
                    <button className={styles.dragHandle} {...attributes} {...listeners}>
                        <GripVertical size={16} />
                    </button>
                    <button
                        className={styles.expandBtn}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                    >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <span className={styles.blockLabel}>
                        {block.title || `Block ${blockIndex + 1}`}
                    </span>
                    <span className={styles.questionCount}>
                        {block.questions.length} question{block.questions.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className={styles.blockActions}>
                    <button
                        className={styles.iconBtn}
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Block Content */}
            {isExpanded && (
                <div className={styles.blockContent}>
                    {block.questions.length === 0 ? (
                        <div className={styles.emptyBlock}>
                            <p>No questions yet</p>
                            <span className={styles.hint}>
                                Click a question type from the sidebar to add one
                            </span>
                        </div>
                    ) : (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleQuestionDragEnd}>
                            <SortableContext items={block.questions.map((q: any) => q.id)} strategy={verticalListSortingStrategy}>
                                <div className={styles.questionList}>
                                    {block.questions.map((question: any, index: number) => (
                                        <SortableQuestionCard
                                            key={question.id}
                                            question={question}
                                            index={index}
                                            blockId={block.id}
                                            isSelected={selectedQuestionId === question.id}
                                            onSelect={() => selectQuestion(question.id)}
                                            onDelete={() => deleteQuestion(block.id, question.id)}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}
                </div>
            )}
        </div>
    );
}

function SortableQuestionCard({
    question,
    index,
    blockId,
    isSelected,
    onSelect,
    onDelete,
}: {
    question: any;
    index: number;
    blockId: string;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
}) {
    const [showDetails, setShowDetails] = useState(true);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: question.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const hasPreview = hasQuestionPreview(question);

    // Check for logic configurations
    const hasDisplayLogic = question.displayLogic?.conditions?.length > 0;
    const hasSkipLogic = question.skipLogic?.conditions?.length > 0;
    const hasRandomize = question.randomize;
    const hasValidation = question.validation?.required;
    const hasCarryForward = !!question.carryForward?.sourceQuestionId;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${styles.questionItem} ${isSelected ? styles.questionSelected : ''}`}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
        >
            {/* Logic Indicators Sidebar */}
            <div className={styles.logicIndicators}>
                {hasDisplayLogic && (
                    <div className={styles.logicBadge} title="Has display logic">
                        <Eye size={12} />
                        <span>Display</span>
                    </div>
                )}
                {hasSkipLogic && (
                    <div className={styles.logicBadge} title="Has skip logic">
                        <GitBranch size={12} />
                        <span>Skip</span>
                    </div>
                )}
                {hasRandomize && (
                    <div className={styles.logicBadge} title="Randomize choices">
                        <Shuffle size={12} />
                        <span>Random</span>
                    </div>
                )}
                {hasValidation && (
                    <div className={`${styles.logicBadge} ${styles.validationBadge}`} title="Required question">
                        <CheckCircle2 size={12} />
                        <span>Required</span>
                    </div>
                )}
                {hasCarryForward && (
                    <div className={styles.logicBadge} title="Carries choices from previous question">
                        <Link2 size={12} />
                        <span>Carry</span>
                    </div>
                )}
            </div>

            {/* Main Question Content */}
            <div className={styles.questionContent}>
                <div className={styles.questionMain}>
                    <button className={styles.dragHandle} {...attributes} {...listeners}>
                        <GripVertical size={14} />
                    </button>
                    <div className={styles.questionNumber}>{index + 1}</div>
                    <div className={styles.questionInfo}>
                        <span className={styles.questionType}>
                            {getQuestionTypeIcon(question.type)} {formatQuestionType(question.type)}
                        </span>
                        <span className={styles.questionText}>{question.text || 'New Question'}</span>
                    </div>
                    <div className={styles.questionActions}>
                        {hasPreview && (
                            <button
                                className={styles.toggleBtn}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDetails(!showDetails);
                                }}
                            >
                                {showDetails ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                        )}
                        <button
                            className={styles.iconBtn}
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                {/* Question Preview */}
                {hasPreview && showDetails && (
                    <div className={styles.previewSection}>
                        <QuestionPreview question={question} />
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper functions
function getQuestionTypeIcon(type: string): string {
    const icons: Record<string, string> = {
        text: '📝',
        single_choice: '◉',
        multiple_choice: '☑️',
        matrix: '📊',
        slider: '🎚️',
        nps: '⭐',
        rank_order: '🔢',
        date: '📅',
    };
    return icons[type] || '❓';
}

function formatQuestionType(type: string): string {
    return type.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function hasQuestionPreview(question: any): boolean {
    const previewTypes = ['single_choice', 'multiple_choice', 'matrix', 'slider', 'nps', 'rank_order', 'date'];
    return previewTypes.includes(question.type);
}

function QuestionPreview({ question }: { question: any }) {
    switch (question.type) {
        case 'single_choice':
        case 'multiple_choice':
            return <ChoicesPreview question={question} />;
        case 'matrix':
            return <MatrixPreview question={question} />;
        case 'slider':
            return <SliderPreview question={question} />;
        case 'nps':
            return <NPSPreview question={question} />;
        case 'rank_order':
            return <RankOrderPreview question={question} />;
        case 'date':
            return <DatePreview question={question} />;
        default:
            return null;
    }
}

function ChoicesPreview({ question }: { question: any }) {
    const isRadio = question.type === 'single_choice';
    const bullet = isRadio ? '○' : '□';

    return (
        <div className={styles.choicesPreview}>
            {question.choices?.map((choice: any) => (
                <div key={choice.id} className={styles.choiceItem}>
                    <span className={styles.choiceBullet}>{bullet}</span>
                    <span className={styles.choiceText}>{choice.text}</span>
                </div>
            ))}
            {question.allowOther && (
                <div className={styles.choiceItem}>
                    <span className={styles.choiceBullet}>{bullet}</span>
                    <span className={styles.choiceTextOther}>{question.otherLabel || 'Other'}</span>
                </div>
            )}
        </div>
    );
}

function MatrixPreview({ question }: { question: any }) {
    return (
        <div className={styles.matrixPreview}>
            <div className={styles.matrixHeader}>
                <div className={styles.matrixRowLabel}></div>
                {question.columns?.slice(0, 4).map((col: any) => (
                    <div key={col.id} className={styles.matrixCol}>{col.text}</div>
                ))}
            </div>
            {question.rows?.slice(0, 2).map((row: any) => (
                <div key={row.id} className={styles.matrixRow}>
                    <div className={styles.matrixRowLabel}>{row.text}</div>
                    {question.columns?.slice(0, 4).map((col: any) => (
                        <div key={col.id} className={styles.matrixCell}>
                            <span className={styles.matrixDot}>○</span>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

function SliderPreview({ question }: { question: any }) {
    return (
        <div className={styles.sliderPreview}>
            <div className={styles.sliderTrack}>
                <div className={styles.sliderThumb}></div>
            </div>
            <div className={styles.sliderLabels}>
                <span>{question.minLabel || question.min || 0}</span>
                <span className={styles.sliderRange}>
                    Range: {question.min || 0} - {question.max || 100}
                </span>
                <span>{question.maxLabel || question.max || 100}</span>
            </div>
        </div>
    );
}

function NPSPreview({ question }: { question: any }) {
    return (
        <div className={styles.npsPreview}>
            <div className={styles.npsScale}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <div
                        key={n}
                        className={`${styles.npsNumber} ${n <= 6 ? styles.npsDetractor : n <= 8 ? styles.npsPassive : styles.npsPromoter}`}
                    >
                        {n}
                    </div>
                ))}
            </div>
            <div className={styles.npsLabels}>
                <span className={styles.npsLabelLeft}>{question.minLabel || 'Not likely'}</span>
                <span className={styles.npsLabelRight}>{question.maxLabel || 'Very likely'}</span>
            </div>
        </div>
    );
}

function RankOrderPreview({ question }: { question: any }) {
    return (
        <div className={styles.rankPreview}>
            {question.items?.slice(0, 3).map((item: any, i: number) => (
                <div key={item.id} className={styles.rankItem}>
                    <span className={styles.rankNumber}>{i + 1}</span>
                    <span className={styles.rankText}>{item.text}</span>
                    <span className={styles.rankDrag}>⋮⋮</span>
                </div>
            ))}
        </div>
    );
}

function DatePreview({ question }: { question: any }) {
    return (
        <div className={styles.datePreview}>
            <div className={styles.dateInput}>
                <span className={styles.dateIcon}>📅</span>
                <span className={styles.datePlaceholder}>
                    {question.format || 'YYYY-MM-DD'}
                    {question.includeTime && ' HH:MM'}
                </span>
            </div>
            {(question.minDate || question.maxDate) && (
                <div className={styles.dateConstraints}>
                    {question.minDate && <span>Min: {question.minDate}</span>}
                    {question.maxDate && <span>Max: {question.maxDate}</span>}
                </div>
            )}
        </div>
    );
}
