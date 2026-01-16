
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '../../db';

export const userRouter = router({
    getByEmail: publicProcedure
        .input(z.object({ email: z.string().email() }))
        .query(async ({ input }) => {
            const user = await db.users.getByEmail(input.email);
            return user;
        }),
});
