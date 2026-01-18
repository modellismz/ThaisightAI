'use client';

import { useState, useEffect } from 'react';
import { trpc } from '../../lib/trpc';
import { useUser } from '../../context/UserContext';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Settings, UserPlus, Users, ArrowLeft, Building2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from './settings.module.css';
import LoadingAnimation from '../../components/LoadingAnimation';

export default function OrganizationSettingsPage() {
    const user = useUser();
    const router = useRouter();
    
    const [email, setEmail] = useState('');

    // Fetch members
    const { data: members = [], refetch: refetchMembers } = trpc.organization.getMembers.useQuery(
        {}, 
        { enabled: !!user?.orgId }
    );

    // Fetch org details
    const { data: org } = trpc.organization.getById.useQuery(
        { id: user.orgId || '' },
        { enabled: !!user?.orgId }
    );

    const inviteMutation = trpc.organization.addMember.useMutation({
        onSuccess: () => {
            setEmail('');
            alert('Member added successfully! They can now login with this email.');
            refetchMembers();
        },
        onError: (error) => {
            alert('Failed to add member: ' + error.message);
        }
    });

    const removeMutation = trpc.organization.removeMember.useMutation({
        onSuccess: () => {
             refetchMembers();
        },
        onError: (error) => {
            alert('Failed to remove member: ' + error.message);
        }
    });

    useEffect(() => {
        // Only owner or admin should be here
        if (user && user.role !== 'owner' && user.role !== 'admin') {
            router.push('/surveys');
        }
    }, [user, router]);

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault();
        inviteMutation.mutate({ email });
    }

    async function handleRemove(userId: string) {
        if (confirm('Are you sure you want to remove this member?')) {
            removeMutation.mutate({ userId });
        }
    }

    if (!user) return <LoadingAnimation />;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                 <Link href="/surveys" className={styles.backBtn}>
                    <ArrowLeft size={18} /> Back to Surveys
                </Link>
                <div style={{ marginTop: '0.5rem' }}>
                    <h1 className={styles.title}>
                        <Settings size={28} /> Organization Settings
                    </h1>
                </div>
            </header>

            <motion.div 
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            <Building2 size={24} className="text-gray-400" />
                            Organization Information
                        </h2>
                        <div className={styles.shopIdBox}>
                            <div>
                                <span className={styles.shopIdLabel}>Organization Name</span>
                                <div className={styles.shopIdValue} style={{ fontSize: '1.25rem' }}>{org?.name || 'Loading...'}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                    Slug: {org?.slug}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span className={styles.shopIdLabel}>Your Role</span>
                                <div className={styles.roleBadge}>{user.role}</div>
                                <div style={{ marginTop: '0.5rem' }}>
                                     <span className={styles.shopIdLabel}>Org ID</span>
                                     <div style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                        {user.orgId?.slice(0, 8)}...
                                     </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            <Users size={24} className="text-gray-400" />
                            Team Management
                        </h2>
                        <p className={styles.sectionDescription}>
                            Manage access to your organization. Members can create and manage surveys but have limited access to settings.
                        </p>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h3 className={styles.subTitle}>Current Members</h3>
                        <div className={styles.membersList} style={{ display: 'grid', gap: '0.75rem' }}>
                            {members.map(member => (
                                <div key={member.id} className={styles.memberItem}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div className={styles.memberAvatar}>
                                            {member.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className={styles.memberEmail}>{member.email}</div>
                                            <div className={styles.memberRole}>{member.role === 'owner' ? 'Owner' : 'Member'}</div>
                                        </div>
                                    </div>
                                    
                                    {member.id !== user.id && member.role !== 'owner' && (
                                        <button 
                                            onClick={() => handleRemove(member.id)}
                                            className={styles.removeBtn}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handleInvite} className={styles.form}>
                         <h3 className={styles.subTitle} style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>Invite New Member</h3>
                        <div className={styles.inputWrapper}>
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Enter colleague's email address..."
                                className={styles.input}
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={inviteMutation.isLoading}
                            className={styles.submitBtn}
                        >
                            {inviteMutation.isLoading ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
                            Invite Member
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
