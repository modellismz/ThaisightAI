'use client';

import { useState } from 'react';
import { GripVertical } from 'lucide-react';
import styles from './inputs.module.css';

interface RankItem {
    id: string;
    text: string;
}

interface RankOrderInputProps {
    value: string[];
    onChange: (value: string[]) => void;
    items: RankItem[];
}

export function RankOrderInput({ value, onChange, items }: RankOrderInputProps) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Sort items by current ranking
    const orderedItems = [...items].sort((a, b) => {
        const indexA = value.indexOf(a.id);
        const indexB = value.indexOf(b.id);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newOrder = [...value];
        const draggedId = newOrder[draggedIndex];
        newOrder.splice(draggedIndex, 1);
        newOrder.splice(index, 0, draggedId);
        onChange(newOrder);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    return (
        <div className={styles.rankContainer}>
            <p className={styles.rankHint}>Drag items to reorder by preference</p>
            {orderedItems.map((item, index) => (
                <div
                    key={item.id}
                    className={`${styles.rankItem} ${draggedIndex === index ? styles.rankDragging : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                >
                    <span className={styles.rankNumber}>{index + 1}</span>
                    <span className={styles.rankText}>{item.text}</span>
                    <GripVertical size={16} className={styles.rankHandle} />
                </div>
            ))}
        </div>
    );
}
