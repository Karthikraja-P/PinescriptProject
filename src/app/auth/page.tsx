'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './auth.module.css';

// Simple Eye Icons
const EyeOpen = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
);
const EyeClosed = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
);

import { signIn } from 'next-auth/react';
import { registerUser } from '../actions';

// ... other imports ...

export default function LoginPage() {
    const router = useRouter();

    // States
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form Fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); // Only for signup

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (authMode === 'login') {
            const res = await signIn('credentials', {
                email,
                password,
                redirect: false
            });

            if (res?.error) {
                alert('Invalid Credentials! Please try again.');
                setLoading(false);
            } else {
                // Determine redirect based on role (simple client logic for now, or fetch session)
                // For now default to dashboard, but we can check if email is admin.
                if (email === 'admin@pinescript.com') {
                    router.push('/admin');
                } else {
                    router.push('/dashboard');
                }
                router.refresh(); // Update auth state
            }
        } else {
            // Signup
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('password', password);

            const result = await registerUser(null, formData); // Handle prevState null

            if (result?.error) {
                alert(result.error);
                setLoading(false);
            } else {
                // Auto login after signup
                const res = await signIn('credentials', {
                    email,
                    password,
                    redirect: false
                });
                if (!res?.error) {
                    router.push('/dashboard');
                    router.refresh();
                } else {
                    setAuthMode('login'); // Fallback
                    setLoading(false);
                }
            }
        }
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.logo}>
                        PineScript<span style={{ color: 'var(--primary)' }}>Elite</span>
                    </div>
                    <p style={{ color: '#64748b' }}>
                        {authMode === 'login' ? 'Welcome back, trader.' : 'Create your account.'}
                    </p>
                </div>

                <form onSubmit={handleAuth}>
                    {authMode === 'signup' && (
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Full Name</label>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email Address</label>
                        <input
                            type="email"
                            className={styles.input}
                            placeholder="trader@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Password</label>
                        <div className={styles.inputWrapper}>
                            <input
                                type={showPassword ? "text" : "password"}
                                className={styles.input}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className={styles.eyeIcon}
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOpen /> : <EyeClosed />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className={styles.btnLogin} disabled={loading}>
                        {loading ? 'Processing...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div className={styles.footer}>
                    {authMode === 'login' ? (
                        <>
                            Don&apos;t have an account?{' '}
                            <span className={styles.link} onClick={() => setAuthMode('signup')}>Sign up</span>
                        </>
                    ) : (
                        <>
                            Already have an account?{' '}
                            <span className={styles.link} onClick={() => setAuthMode('login')}>Log in</span>
                        </>
                    )}
                </div>

                {/* Credentials Hint */}
                <div style={{ marginTop: '24px', padding: '16px', background: '#f1f5f9', borderRadius: '8px', fontSize: '0.85rem', color: '#64748b' }}>
                    <p style={{ fontWeight: 600, marginBottom: '8px', color: '#475569' }}>Test Credentials:</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>Client:</span>
                        <code style={{ fontFamily: 'monospace' }}>client@pinescript.com / client123</code>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Developer:</span>
                        <code style={{ fontFamily: 'monospace' }}>admin@pinescript.com / admin123</code>
                    </div>
                </div>
            </div>
        </div>
    );
}
