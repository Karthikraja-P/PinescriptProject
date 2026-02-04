import styles from './Footer.module.css';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.grid}>
                    <div className={styles.brand}>
                        <div className={styles.logo}>PineScript<span>Elite</span></div>
                        <p className={styles.tagline}>Premium PineScript development for serious traders.</p>
                    </div>
                    <div className={styles.linksSection}>
                        <div className={styles.linkGroup}>
                            <h4>Services</h4>
                            <Link href="/">Strategy Dev</Link>
                            <Link href="/">Indicators</Link>
                            <Link href="/">Modifications</Link>
                        </div>
                        <div className={styles.linkGroup}>
                            <h4>Company</h4>
                            <Link href="/">About</Link>
                            <Link href="/">Contact</Link>
                            <Link href="/">Terms</Link>
                        </div>
                        <div className={styles.linkGroup}>
                            <h4>Social</h4>
                            <Link href="/">Telegram</Link>
                            <Link href="/">TradingView</Link>
                            <Link href="/">GitHub</Link>
                        </div>
                    </div>
                </div>
                <div className={styles.bottom}>
                    <p>&copy; {new Date().getFullYear()} PineScript Elite. All rights reserved.</p>
                    <div className={styles.dots}>
                        <span style={{ color: '#22c55e' }}>●</span> System Online
                    </div>
                </div>
            </div>
        </footer>
    );
}
