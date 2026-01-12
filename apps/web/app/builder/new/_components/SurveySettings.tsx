'use client';

import { useBuilderStore } from '../../../stores/builder.store';
import styles from './QuestionEditor.module.css';

export function SurveySettings() {
    const { config, setConfig } = useBuilderStore();
    const settings = config.settings;

    const updateSettings = (updates: Partial<typeof settings>) => {
        setConfig({
            ...config,
            settings: { ...settings, ...updates },
        });
    };

    return (
        <div className={styles.editor}>
            <h3 className={styles.title}>Survey Settings</h3>

            <div className={styles.section}>
                <h4 className={styles.sectionTitle}>Appearance</h4>

                <div className={styles.field}>
                    <label className="label">Progress Bar</label>
                    <select
                        className="input"
                        value={settings.progressBar}
                        onChange={(e) => updateSettings({ progressBar: e.target.value as any })}
                    >
                        <option value="none">None</option>
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                    </select>
                </div>

                <label className={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        checked={settings.showQuestionNumbers}
                        onChange={(e) => updateSettings({ showQuestionNumbers: e.target.checked })}
                    />
                    Show question numbers
                </label>
            </div>

            <div className={styles.section}>
                <h4 className={styles.sectionTitle}>Behavior</h4>

                <label className={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        checked={settings.allowBack}
                        onChange={(e) => updateSettings({ allowBack: e.target.checked })}
                    />
                    Allow back navigation
                </label>

                <label className={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        checked={settings.saveProgress}
                        onChange={(e) => updateSettings({ saveProgress: e.target.checked })}
                    />
                    Save progress for resume
                </label>

                <label className={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        checked={settings.oneQuestionPerPage}
                        onChange={(e) => updateSettings({ oneQuestionPerPage: e.target.checked })}
                    />
                    One question per page
                </label>
            </div>

            <div className={styles.section}>
                <h4 className={styles.sectionTitle}>Completion</h4>

                <div className={styles.field}>
                    <label className="label">Thank You Message</label>
                    <textarea
                        className={`input ${styles.textarea}`}
                        value={settings.thankYouMessage}
                        onChange={(e) => updateSettings({ thankYouMessage: e.target.value })}
                        rows={3}
                    />
                </div>

                <div className={styles.field}>
                    <label className="label">Redirect URL (optional)</label>
                    <input
                        type="url"
                        className="input"
                        value={settings.redirectUrl || ''}
                        onChange={(e) => updateSettings({ redirectUrl: e.target.value || undefined })}
                        placeholder="https://example.com/thank-you"
                    />
                </div>
            </div>

            <div className={styles.section}>
                <h4 className={styles.sectionTitle}>Response Limits</h4>

                <div className={styles.field}>
                    <label className="label">Maximum Responses</label>
                    <input
                        type="number"
                        className="input"
                        min={0}
                        value={settings.quotaLimit || ''}
                        onChange={(e) => updateSettings({
                            quotaLimit: e.target.value ? parseInt(e.target.value, 10) : undefined
                        })}
                        placeholder="Unlimited"
                    />
                    <small style={{ color: '#6b7280', marginTop: '0.25rem', display: 'block' }}>
                        Leave empty for unlimited responses
                    </small>
                </div>
            </div>
        </div>
    );
}
