/**
 * Main App Router
 * Combines all sub-routers
 */
import { router, createContext } from './trpc';
import { surveyRouter } from './routers/survey.router';
import { sessionRouter } from './routers/session.router';

// Main app router
export const appRouter = router({
    survey: surveyRouter,
    session: sessionRouter,
});

export type AppRouter = typeof appRouter;
export { createContext };
