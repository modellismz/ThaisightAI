/**
 * Main App Router
 * Combines all sub-routers
 */
import { router, createContext } from './trpc';
import { surveyRouter } from './routers/survey.router';
import { sessionRouter } from './routers/session.router';
import { userRouter } from './routers/user.router';

// Main app router
export const appRouter = router({
    survey: surveyRouter,
    session: sessionRouter,
    user: userRouter,
});

export type AppRouter = typeof appRouter;
export { createContext };
