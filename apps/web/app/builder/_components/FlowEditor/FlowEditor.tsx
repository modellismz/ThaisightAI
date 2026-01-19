'use client';

import { useCallback, useEffect } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useBuilderStore } from '../../../stores/builder.store';
import { BlockNode } from './BlockNode';
import styles from './FlowEditor.module.css';
import { Block } from '@repo/shared/schemas';

const nodeTypes = {
    block: BlockNode,
};

export function FlowEditor() {
    const { config, updateBlock, selectBlock } = useBuilderStore();
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    // Transform blocks to nodes
    useEffect(() => {
        if (!config.blocks.length) return;

        const newNodes: Node[] = config.blocks.map((block: Block, index: number) => ({
            id: block.id,
            type: 'block',
            position: { x: index * 300, y: 100 },
            data: {
                label: block.title,
                questionCount: block.questions.length,
                isStart: index === 0,
            },
        }));

        setNodes((nds) => {
            return config.blocks.map((block: Block, index: number) => {
                const existing = nds.find((n) => n.id === block.id);
                return {
                    id: block.id,
                    type: 'block',
                    position: existing ? existing.position : { x: index * 300, y: 100 },
                    data: {
                        label: block.title,
                        questionCount: block.questions.length,
                        isStart: index === 0,
                    },
                };
            });
        });

    }, [config.blocks, setNodes]);

    const onConnect = useCallback(
        (params: Connection) => {
            if (!params.source || !params.target) return;
            console.log('Connected', params);
            setEdges((eds) => addEdge(params, eds));
        },
        [setEdges]
    );

    return (
        <div className={styles.container}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                onNodeClick={(_, node) => selectBlock(node.id)}
                fitView
            >
                <Background />
                <Controls />
                <MiniMap />
            </ReactFlow>
        </div>
    );
}
