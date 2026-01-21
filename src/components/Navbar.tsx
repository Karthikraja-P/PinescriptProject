'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = () => {
        // In a real app, clear tokens/cookies here
        router.push('/');
    };

    return (
        <nav className={styles.navbar}>
            <div className={`container ${styles.navContainer}`}>
                <Link href="/dashboard" className={styles.logo}>
                    PineScript<span className="text-gradient">Elite</span>
                </Link>
                <div className={styles.links}>
                    {pathname !== '/start' && (
                        <Link href="/start" className={styles.link}>Start Project</Link>
                    )}
                    <Link href="/dashboard" className={styles.link}>Dashboard</Link>
                    <button
                        className="btn-primary"
                        style={{ padding: '8px 16px', fontSize: '14px', background: '#ef4444', color: 'white' }}
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    )
}

