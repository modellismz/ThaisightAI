'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import { LogOut } from 'lucide-react';
import styles from './UserProfileDropdown.module.css';

export function UserProfileDropdown() {
    const user = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) return null;

    return (
        <div className={styles.userProfileWrapper} ref={dropdownRef}>
            <button 
                className={styles.userProfileBtn} 
                onClick={() => setIsOpen(!isOpen)}
            >
                {user.image ? (
                    <Image 
                        src={user.image} 
                        alt={user.name || 'User'} 
                        width={32} 
                        height={32} 
                        className={styles.userAvatar}
                    />
                ) : (
                    <div className={styles.userAvatar} style={{ background: '#9ca3af' }} />
                )}
            </button>

            {isOpen && (
                <div className={styles.userDropdown}>
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>{user.name}</span>
                        <span className={styles.userEmail}>{user.email}</span>
                    </div>
                    <hr className={styles.dropdownDivider} />
                    <button 
                        className={styles.userDropdownItem}
                        onClick={() => signOut({ callbackUrl: '/login' })}
                    >
                        <LogOut size={14} />
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
}
