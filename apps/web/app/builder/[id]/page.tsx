'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBuilderStore } from '../../stores/builder.store';
import { useAutosave } from '../../hooks/useAutosave';
import { SurveyBuilder } from '../_components/SurveyBuilder';
import { getDraft, getSurvey, publishSurvey } from '../../lib/api';
import { SurveyConfigSchema } from '@repo/shared/schemas';

export default function EditSurveyPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const {
        setSurveyId,
        setConfig,
        markSaved,
        reset,
        isDirty,
    } = useBuilderStore();

    const [isLoading, setIsLoading] = useState(true);
    const [title, setTitle] = useState('Untitled Survey');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Reset and load data on mount
    useEffect(() => {
        async function loadData() {
            try {
                setIsLoading(true);
                reset();
                setSurveyId(id);

                // 1. Get survey details for title
                const survey = await getSurvey(id);
                setTitle(survey.title);

                // 2. Get draft config
                const draft = await getDraft(id);

                if (draft && draft.config) {
                    // Validate/Parse config to ensure it matches schema
                    // If it doesn't match perfectly, we might still want to load it but be careful
                    // For now, cast it as any to load what we have
                    setConfig(draft.config as any);
                } else {
                    // No draft exists yet, maybe initialize with default or empty
                    console.log('No draft found, starting fresh linked to survey');
                }

                // Mark as clean initially
                markSaved();
            } catch (error) {
                console.error('Failed to load survey:', error);
                alert('Failed to load survey. It might not exist.');
                router.push('/surveys');
            } finally {
                setIsLoading(false);
            }
        }

        if (id) {
            loadData();
        }
    }, [id]);

    // Autosave hook
    const { saveNow } = useAutosave({
        enabled: !isLoading,
        onSaveStart: () => setSaveStatus('saving'),
        onSaveSuccess: () => {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        },
        onSaveError: () => setSaveStatus('error'),
    });

    const handleSave = async () => {
        setSaveStatus('saving');
        await saveNow();
    };

    const handlePublish = async () => {
        try {
            setSaveStatus('saving');
            await saveNow();

            const result = await publishSurvey(id);
            setSaveStatus('saved');

            const shareUrl = result.shareUrl || `${window.location.origin}/survey/${id}`;
            alert(`🎉 Survey Published!\n\nShare this link with respondents:\n${shareUrl}`);
            navigator.clipboard.writeText(shareUrl).catch(() => { });
        } catch (error) {
            console.error('Publish failed:', error);
            setSaveStatus('error');
            alert('Failed to publish survey.');
        }
    };

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                height: '100vh',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0f0f23',
                color: 'white'
            }}>
                Loading survey...
            </div>
        );
    }

    return (
        <SurveyBuilder
            title={title}
            saveStatus={saveStatus}
            onSave={handleSave}
            onPublish={handlePublish}
        />
    );
}
