'use client';

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useState } from 'react';
import styles from './PaymentModal.module.css';

interface PaymentModalProps {
    amount: string;
    invoiceId: string;
    onClose: () => void;
    onSuccess: (details: any) => void;
}

export default function PaymentModal({ amount, invoiceId, onClose, onSuccess }: PaymentModalProps) {
    const [error, setError] = useState<string | null>(null);

    // Strip currency symbol for PayPal SDK (expects "150.00" not "$150.00")
    const numericAmount = amount.replace(/[^0-9.]/g, '');

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3>Secure Payment</h3>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>

                <div className={styles.body}>
                    <p className={styles.summary}>
                        Paying <strong>${numericAmount}</strong> for Invoice <strong>#{invoiceId}</strong>
                    </p>

                    <PayPalScriptProvider options={{ clientId: "test" }}>
                        <PayPalButtons
                            style={{ layout: "vertical" }}
                            createOrder={(data, actions) => {
                                return actions.order.create({
                                    intent: "CAPTURE",
                                    purchase_units: [
                                        {
                                            amount: {
                                                currency_code: "USD",
                                                value: numericAmount,
                                            },
                                            description: `Invoice #${invoiceId}`,
                                        },
                                    ],
                                });
                            }}
                            onApprove={(data, actions) => {
                                if (actions.order) {
                                    return actions.order.capture().then((details) => {
                                        onSuccess(details);
                                    });
                                }
                                return Promise.resolve();
                            }}
                            onError={(err) => {
                                setError("Payment failed. Please try again.");
                                console.error("PayPal Error:", err);
                            }}
                        />
                    </PayPalScriptProvider>

                    {error && <div className={styles.error}>{error}</div>}
                </div>

                <div className={styles.footer}>
                    <span className={styles.secureText}>🔒 TLS Encrypted Transaction</span>
                </div>
            </div>
        </div>
    );
}
