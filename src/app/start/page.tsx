'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';
import Link from 'next/link';
import { submitProjectRequest } from '../actions';
// ... prev imports

export default function StartProject() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        telegram: '',
        type: 'strategy', // strategy | indicator | modification
        budget: '',
        description: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const nextStep = async () => {
        if (step === 2) {
            const fd = new FormData();
            fd.append('type', formData.type);
            fd.append('budget', formData.budget);
            fd.append('description', formData.description);

            const res = await submitProjectRequest(null, fd);
            if (res?.error) {
                alert(res.error);
                return;
            }
        }
        setStep(s => Math.min(s + 1, 3));
    };

    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    return (
        <main>
            <Navbar />
            <div className={styles.container}>
                <div className={styles.wizard}>

                    <div className={styles.header}>
                        <h1 className={styles.title}>Start Your Project</h1>
                        <p className={styles.subtitle}>Tell us what you need built.</p>
                    </div>

                    {/* Stepper */}
                    {/* Stepper */}
                    <div className={styles.stepper}>
                        {['⚙️', '📝'].map((icon, index) => {
                            const stepNum = index + 1;
                            return (
                                <div
                                    key={stepNum}
                                    className={`${styles.step} ${step >= stepNum ? styles.stepActive : ''} ${step > stepNum ? styles.stepCompleted : ''}`}
                                >
                                    {step > stepNum ? '✓' : icon}
                                </div>
                            );
                        })}
                    </div>

                    {/* Step 1: Details (Formerly Step 2) */}
                    {step === 1 && (
                        <div className="animate-fade-in">
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Project Type</label>
                                <select
                                    name="type"
                                    className={styles.select}
                                    value={formData.type}
                                    onChange={handleChange}
                                >
                                    <option value="strategy">Strategy Development</option>
                                    <option value="indicator">Custom Indicator</option>
                                    <option value="modification">Script Modification</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Budget Range ($)</label>
                                <select
                                    name="budget"
                                    className={styles.select}
                                    value={formData.budget}
                                    onChange={handleChange}
                                >
                                    <option value="">Select a range</option>
                                    <option value="50-150">$50 - $150 (Simple)</option>
                                    <option value="150-300">$150 - $300 (Standard)</option>
                                    <option value="300-500">$300 - $500 (Complex)</option>
                                    <option value="500+">$500+ (Professional Suite)</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Description (Formerly Step 3) */}
                    {step === 2 && (
                        <div className="animate-fade-in">
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Project Description</label>
                                <textarea
                                    name="description"
                                    className={styles.textarea}
                                    placeholder="Describe your entry/exit conditions, indicators used, and any specific requirements..."
                                    value={formData.description}
                                    onChange={handleChange}
                                ></textarea>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Attachments</label>
                                <div className={styles.dropzone}>
                                    <div className={styles.dropzoneIcon}>📁</div>
                                    <p style={{ color: '#888', fontSize: '0.9rem' }}>
                                        Drag & drop screenshots or PDFs here<br />
                                        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>(Mockup functionality)</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Success (Formerly Step 4) */}
                    {step === 3 && (
                        <div style={{ textAlign: 'center', padding: '20px 0' }} className="animate-fade-in">
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Enquiry Received!</h2>
                            <p style={{ color: '#888', marginBottom: '32px' }}>
                                We have received your details. Check your email (and dashboard) for a quote within 24 hours.
                            </p>
                            <Link href="/dashboard">
                                <button className="btn-primary">Go to Dashboard</button>
                            </Link>
                        </div>
                    )}

                    {/* Navigation */}
                    {step < 3 && (
                        <div className={styles.actions}>
                            {step > 1 ? (
                                <button onClick={prevStep} className={styles.btnBack}>Back</button>
                            ) : <div></div>}

                            <button onClick={nextStep} className="btn-primary">
                                {step === 2 ? 'Submit Request' : 'Next Step'}
                            </button>
                        </div>
                    )}

                </div>
            </div >
        </main >
    );
}

