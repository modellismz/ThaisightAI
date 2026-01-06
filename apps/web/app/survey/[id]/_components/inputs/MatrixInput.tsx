'use client';

import styles from './inputs.module.css';

interface MatrixRow {
    id: string;
    text: string;
}

interface MatrixColumn {
    id: string;
    text: string;
    value?: number;
}

interface MatrixInputProps {
    value: Record<string, string>;
    onChange: (value: Record<string, string>) => void;
    rows: MatrixRow[];
    columns: MatrixColumn[];
    allowMultiple?: boolean;
}

export function MatrixInput({
    value,
    onChange,
    rows,
    columns,
    allowMultiple = false,
}: MatrixInputProps) {
    const handleSelect = (rowId: string, colId: string) => {
        onChange({ ...value, [rowId]: colId });
    };

    return (
        <div className={styles.matrixContainer}>
            <table className={styles.matrixTable}>
                <thead>
                    <tr>
                        <th></th>
                        {columns.map((col) => (
                            <th key={col.id} className={styles.matrixHeader}>
                                {col.text}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.id}>
                            <td className={styles.matrixRowLabel}>{row.text}</td>
                            {columns.map((col) => (
                                <td key={col.id} className={styles.matrixCell}>
                                    <input
                                        type="radio"
                                        name={`matrix-${row.id}`}
                                        className={styles.matrixRadio}
                                        checked={value[row.id] === col.id}
                                        onChange={() => handleSelect(row.id, col.id)}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
