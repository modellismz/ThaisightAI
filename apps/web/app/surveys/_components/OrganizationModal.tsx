import { X } from 'lucide-react';
import styles from './OrganizationModal.module.css';

interface OrganizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    orgName: string;
    children: React.ReactNode;
}

export function OrganizationModal({ isOpen, onClose, orgName, children }: OrganizationModalProps) {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>{orgName}</h3>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.content}>
                    {children}
                </div>
            </div>
        </div>
    );
}
