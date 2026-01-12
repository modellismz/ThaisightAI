import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileText, GripVertical } from 'lucide-react';
import styles from './FlowEditor.module.css';

interface BlockNodeProps {
    data: {
        label: string;
        questionCount: number;
        isStart?: boolean;
    };
}

export const BlockNode = memo(({ data }: BlockNodeProps) => {
    return (
        <div className={styles.blockNode}>
            {/* Input Handle */}
            {!data.isStart && (
                <Handle
                    type="target"
                    position={Position.Left}
                    className={styles.handle}
                />
            )}

            <div className={styles.nodeHeader}>
                <div className={styles.dragHandle}>
                    <GripVertical size={14} />
                </div>
                <div className={styles.nodeIcon}>
                    <FileText size={16} />
                </div>
                <div className={styles.nodeInfo}>
                    <div className={styles.nodeTitle}>{data.label}</div>
                    <div className={styles.nodeSubtitle}>
                        {data.questionCount} Questions
                    </div>
                </div>
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                className={styles.handle}
            />
        </div>
    );
});

BlockNode.displayName = 'BlockNode';
