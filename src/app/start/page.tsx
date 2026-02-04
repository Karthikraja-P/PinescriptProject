'use client';

import { useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';
import Link from 'next/link';
import { submitProjectRequest } from '../actions';
import Footer from '@/components/Footer';

export default function StartProject() {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        type: 'strategy', // strategy | indicator | modification
        budget: '',
        description: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            // Enforce limit of 200KB as per BACKEND_PLAN
            const validFiles = newFiles.filter(f => f.size <= 200 * 1024);
            if (validFiles.length < newFiles.length) {
                alert("Some files were too large and were skipped (Max 200KB).");
            }
            setAttachments(prev => [...prev, ...validFiles]);
        }
    };

    const removeFile = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const nextStep = async () => {
        if (step === 2) {
            setIsSubmitting(true);
            try {
                const fd = new FormData();
                fd.append('title', formData.title);
                fd.append('type', formData.type);
                fd.append('budget', formData.budget);
                fd.append('description', formData.description);

                attachments.forEach(file => {
                    fd.append('attachments', file);
                });

                const res = await submitProjectRequest(null, fd);
                if (res?.error) {
                    alert(res.error);
                    setIsSubmitting(false);
                    return;
                }
            } catch (e) {
                console.error(e);
                alert("An error occurred during submission.");
                setIsSubmitting(false);
                return;
            }
            setIsSubmitting(false);
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

                    {/* Step 1: Details */}
                    {step === 1 && (
                        <div className="animate-fade-in">
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Project Title (Optional)</label>
                                <input
                                    type="text"
                                    name="title"
                                    placeholder="e.g. Trend Following Strategy"
                                    className={styles.input}
                                    value={formData.title}
                                    onChange={handleChange}
                                />
                            </div>
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

                    {/* Step 2: Description */}
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
                                <label className={styles.label}>Attachments (Screenshots/PDFs)</label>
                                <div
                                    className={styles.dropzone}
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <input
                                        type="file"
                                        multiple
                                        hidden
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".pdf,.png,.jpg,.jpeg,.txt"
                                    />
                                    <div className={styles.dropzoneIcon}>📁</div>
                                    <p style={{ color: '#888', fontSize: '0.9rem' }}>
                                        Click to upload or drag & drop<br />
                                        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>(Max 200KB per file)</span>
                                    </p>
                                </div>

                                {attachments.length > 0 && (
                                    <div className={styles.fileList}>
                                        {attachments.map((file, i) => (
                                            <div key={i} className={styles.fileItem}>
                                                <span>{file.name}</span>
                                                <button onClick={(e) => { e.stopPropagation(); removeFile(i); }}>✕</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Success */}
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
                                <button onClick={prevStep} className={styles.btnBack} disabled={isSubmitting}>Back</button>
                            ) : <div></div>}

                            <button onClick={nextStep} className="btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : (step === 2 ? 'Submit Request' : 'Next Step')}
                            </button>
                        </div>
                    )}

                </div>
            </div >
            <Footer />
        </main >
    );
}

