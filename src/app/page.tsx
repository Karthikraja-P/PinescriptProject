'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './landing.module.css';
// const styles: any = {};

export default function LandingPage() {
    const router = useRouter();

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className={styles.container}>
            {/* Navbar */}
            <nav className={styles.navbar}>
                <div className={styles.logo}>PineScript<span style={{ color: '#2563eb' }}>Elite</span></div>
                <div className={styles.navLinks}>
                    <span onClick={() => scrollToSection('home')} className={styles.navLink}>Home</span>
                    <span onClick={() => scrollToSection('services')} className={styles.navLink}>Services</span>
                    <span onClick={() => scrollToSection('policies')} className={styles.navLink}>Policies</span>
                    <span onClick={() => scrollToSection('contact')} className={styles.navLink}>Contact</span>
                </div>
                <div className={styles.authButtons}>
                    <Link href="/auth?mode=login" className={`${styles.btn} ${styles.btnPrimary}`}>Log In</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header id="home" className={styles.hero}>
                <span className={styles.label}>Professional Coding Services</span>
                <h1 className={styles.title}>
                    Turn Your Trading Strategy<br />
                    Into Automated Reality
                </h1>
                <p className={styles.description}>
                    Expert PineScript developers ready to build your custom indicators, strategies,
                    and alerts for TradingView. Fast delivery, professional code.
                </p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <Link href="/auth?mode=signup" className={`${styles.btn} ${styles.btnPrimary}`} style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
                        Start Your Project
                    </Link>
                    <span onClick={() => scrollToSection('services')} className={`${styles.btn} ${styles.btnOutline}`} style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
                        View Services
                    </span>
                </div>
            </header>

            {/* Services Section */}
            <section id="services" className={styles.services}>
                <h2 className={styles.sectionTitle}>Our Services</h2>
                <div className={styles.grid}>
                    <div className={styles.card}>
                        <div className={styles.cardIcon}>📊</div>
                        <div className={styles.cardTitle}>Custom Strategies</div>
                        <p className={styles.cardText}>
                            Automate your trading rules. We build robust backtesting strategies with
                            risk management, entry/exit conditions, and detailed performance reports.
                        </p>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.cardIcon}>📈</div>
                        <div className={styles.cardTitle}>Indicators & Tools</div>
                        <p className={styles.cardText}>
                            Visualize the market your way. Custom oscillators, moving averages,
                            and multi-timeframe dashboards tailored to your specific needs.
                        </p>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.cardIcon}>🔔</div>
                        <div className={styles.cardTitle}>Alert Systems</div>
                        <p className={styles.cardText}>
                            Never miss a setup. Complex alert conditions sent directly to your
                            phone, email, or webhook for automated execution.
                        </p>
                    </div>
                </div>
            </section>

            {/* Policies Section */}
            <section id="policies" className={styles.section}>
                <div className={styles.sectionContent}>
                    <h2 className={styles.sectionTitle}>Our Policies</h2>
                    <div className={styles.grid} style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <div className={styles.textBlock}>
                            <h3 className={styles.h3}>🔒 Code Privacy</h3>
                            <p className={styles.cardText}>
                                Your strategy logic is your intellectual property. We sign NDAs upon request
                                and guarantee that your code is never shared or reused for other clients.
                            </p>
                        </div>
                        <div className={styles.textBlock}>
                            <h3 className={styles.h3}>✅ Revision Guarantee</h3>
                            <p className={styles.cardText}>
                                We provide 14 days of free support after delivery. If the code deviates
                                from your initial requirements, we fix it for free.
                            </p>
                        </div>
                        <div className={styles.textBlock}>
                            <h3 className={styles.h3}>💰 Refund Policy</h3>
                            <p className={styles.cardText}>
                                If we cannot deliver the project as scoped, you receive a full refund.
                                Payments are held in escrow until key milestones are met.
                            </p>
                        </div>
                        <div className={styles.textBlock}>
                            <h3 className={styles.h3}>⏱️ Delivery Timeline</h3>
                            <p className={styles.cardText}>
                                Standard projects are delivered within 3-5 business days. Expedited
                                24-hour delivery is available for urgent requests.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className={styles.contactSection}>
                <div className={styles.sectionContent} style={{ maxWidth: '600px' }}>
                    <h2 className={styles.sectionTitle}>Get In Touch</h2>
                    <p className={styles.description} style={{ marginBottom: '32px' }}>
                        Have a question before starting? Send us a message and our lead developer
                        will get back to you within 24 hours.
                    </p>
                    <form
                        className={styles.card}
                        style={{ textAlign: 'left' }}
                        onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const { submitContactForm } = await import('./actions');
                            const res = await submitContactForm(formData);
                            if (res.success) {
                                alert('Message sent successfully!');
                                (e.target as HTMLFormElement).reset();
                            } else {
                                alert(res.error || 'Something went wrong.');
                            }
                        }}
                    >
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email Address</label>
                            <input name="email" type="email" placeholder="you@example.com" style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px' }} required />
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Message</label>
                            <textarea name="message" rows={4} placeholder="How can we help?" style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px' }} required />
                        </div>
                        <button className={`${styles.btn} ${styles.btnPrimary}`} style={{ width: '100%' }}>Send Message</button>
                    </form>
                </div>
            </section>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <div>
                        <div className={styles.footerLogo}>PineScript<span style={{ color: '#3b82f6' }}>Elite</span></div>
                        <p style={{ color: '#94a3b8', maxWidth: '300px' }}>
                            Professional coding services for serious traders.
                            Based in New York, serving clients worldwide.
                        </p>
                    </div>
                    <div className={styles.footerLinks}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <span style={{ fontWeight: '600', color: 'white' }}>Platform</span>
                            <span onClick={() => scrollToSection('home')} style={{ cursor: 'pointer', color: '#94a3b8' }}>Home</span>
                            <span onClick={() => scrollToSection('services')} style={{ cursor: 'pointer', color: '#94a3b8' }}>Services</span>
                            <Link href="/auth?mode=login" className={styles.footerLink}>Login</Link>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <span style={{ fontWeight: '600', color: 'white' }}>Legal</span>
                            <span onClick={() => scrollToSection('policies')} style={{ cursor: 'pointer', color: '#94a3b8' }}>Terms of Service</span>
                            <span onClick={() => scrollToSection('policies')} style={{ cursor: 'pointer', color: '#94a3b8' }}>Privacy Policy</span>
                        </div>
                    </div>
                </div>
                <div style={{ borderTop: '1px solid #1e293b', marginTop: '40px', paddingTop: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                    &copy; 2026 PineScript Elite. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
