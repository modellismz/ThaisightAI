import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '../../db';
import { TRPCError } from '@trpc/server';

function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
}

export const organizationRouter = router({
    create: protectedProcedure
        .input(z.object({
            name: z.string().min(1),
            contactEmail: z.string().email(),
        }))
        .mutation(async ({ ctx, input }) => {
            if (ctx.user.role !== 'admin') {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can create organizations' });
            }

            const slug = slugify(input.name);
            const org = await db.organizations.create(input.name, slug);

            // Assign user as owner of this org
            // NOTE: The input.contactEmail is basically the owner.
            await db.users.create({
                email: input.contactEmail,
                role: 'owner',
                orgId: org.id
            });

            return org;
        }),

    addMember: protectedProcedure
        .input(z.object({ email: z.string().email() }))
        .mutation(async ({ ctx, input }) => {
            if (ctx.user.role !== 'owner') {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Only owners can add members' });
            }
            if (!ctx.user.orgId) {
                throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Owner has no organization assigned' });
            }

            // Create member associated with owner's org
            const user = await db.users.create({
                email: input.email,
                role: 'member',
                orgId: ctx.user.orgId
            });

            return user;
        }),

    adminAddMember: protectedProcedure
        .input(z.object({ orgId: z.string(), email: z.string().email(), role: z.enum(['owner', 'member']) }))
        .mutation(async ({ ctx, input }) => {
            if (ctx.user.role !== 'admin') {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can add members to specific orgs' });
            }

            const user = await db.users.create({
                email: input.email,
                role: input.role,
                orgId: input.orgId
            });
            return user;
        }),

    removeMember: protectedProcedure
        .input(z.object({ userId: z.string(), orgId: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
            if (ctx.user.role === 'admin') {
                // Admin can remove member from specific org
                if (!input.orgId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Org ID required for admin removal' });
                await db.organizations.removeMember(input.orgId, input.userId);
                return { success: true };
            }

            if (ctx.user.role === 'owner') {
                if (!ctx.user.orgId) throw new TRPCError({ code: 'PRECONDITION_FAILED' });
                await db.organizations.removeMember(ctx.user.orgId, input.userId);
                return { success: true };
            }

            throw new TRPCError({ code: 'FORBIDDEN' });
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            if (ctx.user.role !== 'admin') {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can delete organizations' });
            }
            await db.organizations.delete(input.id);
            return { success: true };
        }),

    update: protectedProcedure
        .input(z.object({ id: z.string(), name: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
            if (ctx.user.role !== 'admin') {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can update organizations' });
            }
            const slug = slugify(input.name);
            await db.organizations.update(input.id, input.name, slug);
            return { success: true, slug };
        }),

    getMembers: protectedProcedure
        .input(z.object({ orgId: z.string().optional() }))
        .query(async ({ ctx, input }) => {
            if (ctx.user.role === 'admin') {
                if (!input.orgId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Org ID required for admin' });
                return db.organizations.getMembers(input.orgId);
            }

            if (ctx.user.role === 'owner') {
                if (!ctx.user.orgId) throw new TRPCError({ code: 'PRECONDITION_FAILED' });
                // Owner can only see their own org members
                return db.organizations.getMembers(ctx.user.orgId);
            }

            throw new TRPCError({ code: 'FORBIDDEN' });
        }),

    list: protectedProcedure
        .query(async ({ ctx }) => {
            if (ctx.user.role !== 'admin') {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can list organizations' });
            }
            return db.organizations.list();
        }),

    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            if (ctx.user.role === 'admin') {
                return db.organizations.getById(input.id);
            }
            if (ctx.user.role === 'owner' || ctx.user.role === 'member') {
                if (ctx.user.orgId !== input.id) throw new TRPCError({ code: 'FORBIDDEN' });
                return db.organizations.getById(input.id);
            }
            throw new TRPCError({ code: 'FORBIDDEN' });
        }),
});
