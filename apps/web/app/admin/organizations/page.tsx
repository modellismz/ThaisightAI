'use client';

import { useState, useEffect } from 'react';
import { trpc } from '../../lib/trpc';
import { useUser } from '../../context/UserContext';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Building2, User, ArrowLeft, Calendar, ChevronDown, ChevronUp, Trash2, Edit2, X, Check, XCircle } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './admin.module.css';
import LoadingAnimation from '../../components/LoadingAnimation';

export default function AdminOrganizationsPage() {
    const user = useUser();
    const router = useRouter();
    
    // Use TRPC React Hooks
    const { data: orgs = [], isLoading, refetch } = trpc.organization.list.useQuery(undefined, {
        enabled: user?.role === 'admin' // Only fetch if admin
    });
    
    const createMutation = trpc.organization.create.useMutation({
        onSuccess: () => {
            alert('Organization created successfully!');
            setName('');
            setContactEmail('');
            refetch(); // Reload the list
        },
        onError: (error) => {
            alert('Failed to create organization: ' + error.message);
        }
    });

    const [name, setName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [expandedOrgId, setExpandedOrgId] = useState<string | null>(null);

    useEffect(() => {
        if (user && user.role !== 'admin') {
            router.push('/surveys');
        }
    }, [user, router]);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        createMutation.mutate({ name, contactEmail });
    }

    if (isLoading) return <LoadingAnimation />;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/surveys" className={styles.backBtn}>
                    <ArrowLeft size={18} /> Back to Surveys
                </Link>
                <div style={{ marginTop: '1rem' }}>
                    <h1 className={styles.title}>
                        <Building2 size={32} /> Manage Organizations
                    </h1>
                    <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>Overview and management of all platform organizations and their members</p>
                </div>
            </header>

            <motion.div 
                className={styles.createSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <h2 className={styles.sectionTitle}>Create New Organization</h2>
                <form onSubmit={handleCreate} className={styles.createForm}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Organization Name</label>
                        <input 
                            type="text" 
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Acme Corp"
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Owner Contact Email</label>
                        <input 
                            type="email" 
                            required
                            value={contactEmail}
                            onChange={e => setContactEmail(e.target.value)}
                            placeholder="owner@example.com"
                            className={styles.input}
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={createMutation.isLoading}
                        className={styles.createBtn}
                    >
                        {createMutation.isLoading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                        Create
                    </button>
                </form>
            </motion.div>

            <motion.div 
                className={styles.grid}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
            >
                {orgs.map((org, index) => (
                    <OrganizationCard 
                        key={org.id} 
                        org={org} 
                        index={index} 
                        expanded={expandedOrgId === org.id} 
                        onToggle={() => setExpandedOrgId(expandedOrgId === org.id ? null : org.id)}
                        onUpdate={refetch}
                    />
                ))}
                {orgs.length === 0 && (
                    <div className={styles.emptyState}>
                        <Building2 size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <h3>No organizations yet</h3>
                        <p>Create your first organization using the form above.</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

function OrganizationCard({ org, index, expanded, onToggle, onUpdate }: { org: any, index: number, expanded: boolean, onToggle: () => void, onUpdate: () => void }) {
    const { data: members = [], refetch: refetchMembers } = trpc.organization.getMembers.useQuery(
        { orgId: org.id },
        { enabled: expanded }
    );

    const addMemberMutation = trpc.organization.adminAddMember.useMutation({
        onSuccess: () => {
            alert('Member added to organization');
            setNewMemberEmail('');
            refetchMembers();
        },
        onError: (err) => alert(err.message)
    });

    // Enabled removeMember for admins
    const removeMemberMutation = trpc.organization.removeMember.useMutation({
         onSuccess: () => {
             refetchMembers();
         },
         onError: (err) => alert("Failed to remove member: " + err.message)
    });

    const deleteOrgMutation = trpc.organization.delete.useMutation({
        onSuccess: () => {
            onUpdate();
        },
        onError: (err) => alert("Failed to delete organization: " + err.message)
    });

    const updateOrgMutation = trpc.organization.update.useMutation({
        onSuccess: () => {
            setIsEditing(false);
            onUpdate();
        },
        onError: (err) => alert("Failed to update organization: " + err.message)
    });

    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(org.name);

    function handleAddMember(e: React.FormEvent) {
        e.preventDefault();
        addMemberMutation.mutate({ orgId: org.id, email: newMemberEmail, role: 'member' });
    }

    function handleRemoveMember(userId: string) {
        if (confirm('Are you sure you want to remove this member?')) {
            removeMemberMutation.mutate({ userId, orgId: org.id });
        }
    }

    function handleDeleteOrg() {
        if (confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
            deleteOrgMutation.mutate({ id: org.id });
        }
    }

    function handleUpdateOrg(e: React.FormEvent) {
        e.preventDefault();
        updateOrgMutation.mutate({ id: org.id, name: editName });
    }

    return (
        <motion.div 
            className={styles.shopCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index, type: "spring", stiffness: 300, damping: 24 }}
            layout="position"
        >
            <div 
                onClick={onToggle}
                style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'start', 
                    width: '100%',
                    cursor: 'pointer' 
                }}
            >
                <div style={{ flex: 1, marginRight: '1rem' }}>
                    {isEditing ? (
                        <form 
                            onSubmit={handleUpdateOrg} 
                            onClick={e => e.stopPropagation()} 
                            style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}
                        >
                            <input 
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                className={styles.input}
                                style={{ padding: '4px 8px', fontSize: '1.1rem' }}
                                autoFocus
                            />
                            <button type="submit" className={styles.addMemberBtn} style={{ background: '#10b981', color: 'white' }}><Check size={16} /></button>
                            <button type="button" onClick={() => setIsEditing(false)} className={styles.addMemberBtn} style={{ background: '#ef4444', color: 'white' }}><X size={16} /></button>
                        </form>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h3 className={styles.shopTitle}>{org.name}</h3>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} 
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0 }}
                            >
                                <Edit2 size={14} />
                            </button>
                        </div>
                    )}
                     <div className={styles.shopMeta}>
                        <span className={styles.slugBadge}>{org.slug}</span>
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteOrg(); }}
                        style={{ 
                            padding: '6px', 
                            borderRadius: '8px', 
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                        title="Delete Organization"
                    >
                        <Trash2 size={16} />
                    </button>
                    <button 
                        style={{ 
                            padding: '6px', 
                            borderRadius: '8px', 
                            background: expanded ? 'var(--gray-200)' : 'transparent',
                            border: 'none',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        {expanded ? <ChevronUp size={20} style={{ color: 'var(--text-primary)' }} /> : <ChevronDown size={20} style={{ color: 'var(--text-secondary)' }} />}
                    </button>
                </div>
            </div>

            <div className={styles.cardFooter}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={14} />
                    {new Date(org.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span style={{ fontFamily: 'monospace', opacity: 0.6 }}>
                    ID: {org.id.slice(0, 8)}...
                </span>
            </div>

            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div 
                        className={styles.membersSection}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 24 }}
                    >
                        <h4 className={styles.membersTitle}>
                            <User size={14} /> Members
                        </h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                            {members.map((m: any) => (
                                <div key={m.id} className={styles.memberItem}>
                                    <span className={styles.memberEmail}>{m.email}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span className={styles.memberRole}>{m.role}</span>
                                        <button 
                                            onClick={() => handleRemoveMember(m.id)}
                                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex' }}
                                            title="Remove Member"
                                        >
                                            <XCircle size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                             {members.length === 0 && <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>No members found</div>}
                        </div>

                        <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <input 
                                type="email" 
                                placeholder="Add member email" 
                                value={newMemberEmail}
                                onChange={e => setNewMemberEmail(e.target.value)}
                                className={styles.memberInput}
                                required
                            />
                             <button type="submit" disabled={addMemberMutation.isLoading} className={styles.addMemberBtn}>
                                <Plus size={16} />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
