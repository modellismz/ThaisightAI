import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Copy, Download, Link2 } from 'lucide-react';
import styles from './ShareModal.module.css';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    surveyId: string;
    surveyTitle: string;
}

export function ShareModal({ isOpen, onClose, surveyId, surveyTitle }: ShareModalProps) {
    const qrRef = useRef<HTMLCanvasElement>(null);

    if (!isOpen) return null;

    // Use window.location.origin to construct full URL
    // Fallback to localhost if window is undefined (SSR) logic handled by component mounting
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const surveyUrl = `${origin}/survey/${surveyId}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(surveyUrl);
        alert('Link copied to clipboard!');
    };

    const handleDownloadQR = () => {
        if (!qrRef.current) return;

        const canvas = qrRef.current;
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `qrcode-${surveyId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>Share Survey</h3>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.content}>
                    <p className={styles.surveyTitle}>{surveyTitle}</p>

                    <div className={styles.qrContainer}>
                        <QRCodeCanvas
                            ref={qrRef}
                            value={surveyUrl}
                            size={200}
                            level="H"
                            includeMargin={true}
                        />
                    </div>

                    <div className={styles.actions}>
                        <button className={styles.actionBtn} onClick={handleDownloadQR}>
                            <Download size={16} />
                            Download QR Code
                        </button>
                    </div>

                    <div className={styles.linkSection}>
                        <label>Survey Link</label>
                        <div className={styles.inputGroup}>
                            <div className={styles.inputIcon}>
                                <Link2 size={16} />
                            </div>
                            <input
                                readOnly
                                value={surveyUrl}
                                className={styles.linkInput}
                            />
                            <button className={styles.copyBtn} onClick={handleCopyLink}>
                                <Copy size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
