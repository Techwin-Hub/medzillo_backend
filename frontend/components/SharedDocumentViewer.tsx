import React, { useRef } from 'react';
import { SharedLink, Clinic, Patient, Consultation, User, Medicine, PharmacyInfo, Bill, Appointment } from '../types';
import { PrescriptionTemplate } from './PrescriptionTemplate';
import { InvoiceTemplate } from './InvoiceTemplate';
import { ExclamationTriangleIcon, SpinnerIcon, ArrowDownTrayIcon } from './icons';
import { useToast } from '../hooks/useToast';


// Add type declarations for the window object to inform TypeScript about the CDN libraries
declare global {
    interface Window {
        html2canvas: any;
        jspdf: { jsPDF: new (options?: any) => any };
    }
}


interface ClinicData {
    users: User[];
    medicines: Medicine[];
    patients: Patient[];
    bills: Bill[];
    appointments: Appointment[];
    pharmacyInfo: PharmacyInfo;
    sharedLinks: SharedLink[];
    [key: string]: any;
}

interface SharedDocumentViewerProps {
    viewData: {
        link?: SharedLink;
        clinicData?: ClinicData;
        error?: string;
    } | null;
    allClinics: Clinic[];
}

const SharedError: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4 text-center">
        <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800">Access Denied</h1>
        <p className="text-slate-600 mt-2">{message}</p>
    </div>
);

export const SharedDocumentViewer: React.FC<SharedDocumentViewerProps> = ({ viewData, allClinics }) => {
    const [isDownloading, setIsDownloading] = React.useState<'prescription' | 'invoice' | null>(null);
    const { addToast } = useToast();
    
    const prescriptionRef = useRef<HTMLDivElement>(null);
    const invoiceRef = useRef<HTMLDivElement>(null);

    if (!viewData || viewData.error || !viewData.link || !viewData.clinicData) {
        return <SharedError message={viewData?.error || "The requested link is invalid or could not be found."} />;
    }

    const { link, clinicData } = viewData;

    if (new Date(link.expiresAt) < new Date()) {
        return <SharedError message="This share link has expired." />;
    }

    const appointment = clinicData.appointments.find(a => a.id === link.appointmentId);
    if (!appointment) {
        return <SharedError message="The associated appointment could not be found." />;
    }
    
    const patient = clinicData.patients.find(p => p.id === appointment.patientId);
    if (!patient) {
        return <SharedError message="The associated patient record could not be found." />;
    }

    const consultation = patient.consultations.find(c => c.id === `con_${appointment.id}`);
    if (!consultation) {
        return <SharedError message="The associated consultation record could not be found." />;
    }

    const doctor = clinicData.users.find(u => u.id === consultation.doctorId);
    if (!doctor) {
        return <SharedError message="The associated doctor's details could not be found." />;
    }
    
    const bill = clinicData.bills.find(b => b.appointmentId === appointment.id);

    const clinic = allClinics.find(c => c.id === link.clinicId);

    const loadPdfScripts = async () => {
        const scripts = [
            'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
        ];
        
        for (const src of scripts) {
            if (!document.querySelector(`script[src="${src}"]`)) {
                await new Promise<void>((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = src;
                    script.onload = () => resolve();
                    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
                    document.body.appendChild(script);
                });
            }
        }
    };

    const handleDownload = async (type: 'prescription' | 'invoice') => {
        const contentRef = type === 'prescription' ? prescriptionRef : invoiceRef;
        const filename = type === 'prescription' ? `Prescription-${patient.name}.pdf` : `Invoice-${bill?.billNumber}.pdf`;

        if (!contentRef.current) {
            addToast('Content not found for download.', 'error');
            return;
        }

        setIsDownloading(type);
        try {
            await loadPdfScripts();

            if (typeof window.html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
                throw new Error("PDF libraries did not load.");
            }

            const canvas = await window.html2canvas(contentRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgProps = pdf.getImageProperties(imgData);
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(filename);

        } catch (error) {
            console.error(`PDF generation failed for ${type}:`, error);
            addToast('Failed to generate PDF.', 'error');
        } finally {
            setIsDownloading(null);
        }
    };

    return (
        <div className="bg-slate-200 min-h-screen p-2 sm:p-6">
            <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
                <div className="p-6 bg-slate-50 rounded-t-lg border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-brand-secondary">{clinic?.name || 'Clinic Document'}</h1>
                        <p className="text-sm text-slate-600">Shared with {patient.name}</p>
                    </div>
                </div>
                
                <div className="p-4">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Prescription Details</h2>
                        <button onClick={() => handleDownload('prescription')} disabled={isDownloading === 'prescription'} className="flex items-center justify-center bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-blue-700 transition-colors text-sm min-w-[120px] disabled:bg-slate-400">
                            {isDownloading === 'prescription' ? <SpinnerIcon className="animate-spin w-5 h-5"/> : <><ArrowDownTrayIcon className="w-4 h-4 mr-2"/> Download</>}
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <div className="min-w-[40rem]">
                            <PrescriptionTemplate
                                ref={prescriptionRef}
                                patient={patient}
                                consultation={consultation}
                                doctor={doctor}
                                pharmacyInfo={clinicData.pharmacyInfo}
                                medicines={clinicData.medicines}
                            />
                        </div>
                    </div>
                </div>
                
                {bill && (
                     <div className="p-4 mt-4 border-t border-slate-200">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Invoice Details</h2>
                             <button onClick={() => handleDownload('invoice')} disabled={isDownloading === 'invoice'} className="flex items-center justify-center bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-blue-700 transition-colors text-sm min-w-[120px] disabled:bg-slate-400">
                                {isDownloading === 'invoice' ? <SpinnerIcon className="animate-spin w-5 h-5"/> : <><ArrowDownTrayIcon className="w-4 h-4 mr-2"/> Download</>}
                            </button>
                        </div>
                         <div className="overflow-x-auto">
                            <div className="min-w-[40rem]">
                                <InvoiceTemplate
                                    ref={invoiceRef}
                                    bill={bill}
                                    pharmacyInfo={clinicData.pharmacyInfo}
                                />
                            </div>
                         </div>
                    </div>
                )}
            </div>
            <footer className="text-center text-sm text-slate-500 mt-8">
                <p>Securely shared via Medzillo</p>
                <p>Link expires on: {new Date(link.expiresAt).toLocaleString()}</p>
            </footer>
        </div>
    );
};