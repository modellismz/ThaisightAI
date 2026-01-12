'use client';

import { useState, useEffect } from 'react';
import { useBuilderStore } from '../../stores/builder.store';
import { useAutosave, loadDraftFromLocalStorage } from '../../hooks/useAutosave';
import { SurveyBuilder } from '../_components/SurveyBuilder';

export default function SurveyBuilderPage() {
    const {
        surveyId,
        setConfig,
        setSurveyTitle,
        markSaved,
        reset,
    } = useBuilderStore();

    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [showRestorePrompt, setShowRestorePrompt] = useState(false);

    // Reset store on mount (only for new survey page)
    useEffect(() => {
        reset();
    }, []);

    // Autosave hook
    const { saveNow } = useAutosave({
        enabled: true,
        onSaveStart: () => setSaveStatus('saving'),
        onSaveSuccess: () => {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        },
        onSaveError: () => setSaveStatus('error'),
    });

    // Check for saved draft on mount
    useEffect(() => {
        const draft = loadDraftFromLocalStorage();
        if (draft && draft.config?.blocks?.length > 0) {
            setShowRestorePrompt(true);
        }
    }, []);

    const handleRestoreDraft = () => {
        const draft = loadDraftFromLocalStorage();
        if (draft?.config) {
            setConfig(draft.config);
            if (draft.surveyTitle) {
                setSurveyTitle(draft.surveyTitle);
            }
            markSaved();
        }
        setShowRestorePrompt(false);
    };

    const handleDismissRestore = () => {
        setShowRestorePrompt(false);
    };

    const handleSave = async () => {
        setSaveStatus('saving');
        await saveNow();
    };

    const handlePublish = async () => {
        if (!surveyId) {
            alert('Please save the survey first before publishing.');
            return;
        }

        try {
            setSaveStatus('saving');

            // Save current draft first
            await saveNow();

            // Import publishSurvey dynamically
            const { publishSurvey } = await import('../../lib/api');
            const result = await publishSurvey(surveyId);

            setSaveStatus('saved');

            // Show share URL
            const shareUrl = result.shareUrl || `${window.location.origin}/survey/${surveyId}`;
            alert(`🎉 Survey Published!\n\nShare this link with respondents:\n${shareUrl}`);

            // Copy to clipboard
            navigator.clipboard.writeText(shareUrl).catch(() => { });
        } catch (error) {
            console.error('Publish failed:', error);
            setSaveStatus('error');
            alert('Failed to publish survey. Please try again.');
        }
    };

    return (
        <SurveyBuilder
            saveStatus={saveStatus}
            onSave={handleSave}
            onPublish={handlePublish}
            showRestorePrompt={showRestorePrompt}
            onRestoreDraft={handleRestoreDraft}
            onDismissRestore={handleDismissRestore}
        />
    );
}
