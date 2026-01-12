'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useBuilderStore } from '../stores/builder.store';
import { saveDraft, createSurvey } from '../lib/api';

const AUTOSAVE_DELAY = 2000; // 2 seconds debounce
const LOCAL_STORAGE_KEY = 'thaisight_survey_draft';

interface AutosaveOptions {
    enabled?: boolean;
    onSaveStart?: () => void;
    onSaveSuccess?: () => void;
    onSaveError?: (error: Error) => void;
}

export function useAutosave(options: AutosaveOptions = {}) {
    const { enabled = true, onSaveStart, onSaveSuccess, onSaveError } = options;
    const { config, isDirty, surveyId, surveyTitle, markSaved, setSurveyId } = useBuilderStore();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isSavingRef = useRef(false);

    const saveToLocalStorage = useCallback(() => {
        try {
            const draft = {
                surveyId,
                surveyTitle,
                config,
                savedAt: new Date().toISOString(),
            };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draft));
            return true;
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return false;
        }
    }, [config, surveyId, surveyTitle]);

    const saveToServer = useCallback(async () => {
        if (isSavingRef.current) return;

        isSavingRef.current = true;
        onSaveStart?.();

        try {
            // First save to localStorage as backup
            saveToLocalStorage();

            let currentSurveyId = surveyId;

            // If no survey exists yet, create one first
            if (!currentSurveyId) {
                try {
                    const newSurvey = await createSurvey({
                        title: surveyTitle || 'Untitled Survey',
                        description: '',
                    });
                    currentSurveyId = newSurvey.id;
                    setSurveyId(newSurvey.id);
                } catch (error) {
                    console.warn('Failed to create survey on server, saving locally only:', error);
                    // Still mark as saved for local storage
                    markSaved();
                    onSaveSuccess?.();
                    isSavingRef.current = false;
                    return;
                }
            }

            // Now save the draft to the server
            try {
                await saveDraft(currentSurveyId, config);
                markSaved();
                onSaveSuccess?.();
            } catch (error) {
                console.warn('Failed to save to server, saved locally:', error);
                // Still mark as saved since we saved to localStorage
                markSaved();
                onSaveSuccess?.();
            }
        } catch (error) {
            onSaveError?.(error instanceof Error ? error : new Error('Save failed'));
        } finally {
            isSavingRef.current = false;
        }
    }, [config, surveyId, surveyTitle, markSaved, setSurveyId, saveToLocalStorage, onSaveStart, onSaveSuccess, onSaveError]);

    // Debounced autosave
    useEffect(() => {
        if (!enabled || !isDirty) return;

        // Clear previous timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Save to localStorage immediately for safety
        saveToLocalStorage();

        // Debounced server save
        timeoutRef.current = setTimeout(() => {
            saveToServer();
        }, AUTOSAVE_DELAY);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [enabled, isDirty, config, saveToLocalStorage, saveToServer]);

    // Save on page unload
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                saveToLocalStorage();
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty, saveToLocalStorage]);

    return {
        isSaving: isSavingRef.current,
        saveNow: saveToServer,
        saveToLocalStorage,
    };
}

export function loadDraftFromLocalStorage(): { surveyId: string | null; surveyTitle?: string; config: any; savedAt: string } | null {
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!stored) return null;
        return JSON.parse(stored);
    } catch {
        return null;
    }
}

export function clearDraftFromLocalStorage(): void {
    try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
        // Ignore
    }
}
