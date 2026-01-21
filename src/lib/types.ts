export interface Enquiry {
    id: string;
    clientName: string;
    email: string;
    type: 'Strategy' | 'Indicator' | 'Modification';
    status: 'New' | 'Quote Sent' | 'Approved' | 'Rejected' | 'Converted';
    submittedDate: string;
    description: string;
}

export interface Project {
    id: string;
    enquiryId: string;
    clientName: string;
    title: string;
    price: number;
    status: 'Awaiting Payment' | 'In Progress' | 'Delivered' | 'Completed';
    deadline: string;
    notes?: string;
    paymentStatus: 'Paid' | 'Pending';
}

export type StatCardProps = {
    title: string;
    value: string | number;
    trend?: string;
    color?: string;
};
