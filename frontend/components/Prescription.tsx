import React, { useRef, useState } from 'react';
import { Patient, Consultation, PharmacyInfo, Medicine, User } from '../types';
import { CloseIcon, PrintIcon, RxIcon, ArrowDownTrayIcon, ShareIcon, SpinnerIcon } from './icons';
import { PrescriptionTemplate } from './PrescriptionTemplate';
import { handlePrintContent } from '../utils/printUtils';

// Add type declarations for the window object to inform TypeScript about the CDN libraries
declare global {
    interface Window {
        html2canvas: any;
        jspdf: { jsPDF: new (options?: any) => any };
    }
}

interface PrescriptionProps {
    patient: Patient;
    consultation: Consultation;
    doctor: User;
    pharmacyInfo: PharmacyInfo;
    medicines: Medicine[];
    onClose: () => void;
}

export const Prescription: React.FC<PrescriptionProps> = ({ patient, consultation, doctor, pharmacyInfo, medicines, onClose }) => {
    const prescriptionContentRef = useRef<HTMLDivElement>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

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

    const handlePrint = () => {
        handlePrintContent(prescriptionContentRef.current, `Prescription for ${patient.name}`);
    };

    const generatePdfBlob = async (): Promise<Blob | null> => {
        try {
            await loadPdfScripts();
        } catch (error) {
            console.error(error);
            alert('Failed to load necessary libraries for PDF generation. Please check your internet connection and try again.');
            return null;
        }

        const contentNode = prescriptionContentRef.current;
        if (!contentNode || typeof window.html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
            console.error('PDF generation libraries not found or content node is missing.');
            alert('Could not generate PDF. Required libraries are missing or failed to load.');
            return null;
        }

        const prescriptionPages = contentNode.querySelectorAll<HTMLDivElement>('.prescription-page-container');
        if (!prescriptionPages || prescriptionPages.length === 0) {
            alert('Could not find prescription content to generate PDF.');
            return null;
        }

        const pdf = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();

        for (let i = 0; i < prescriptionPages.length; i++) {
            const pageElement = prescriptionPages[i];
            try {
                const canvas = await window.html2canvas(pageElement, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff'
                });

                const imgData = canvas.toDataURL('image/png');
                const imgProps = pdf.getImageProperties(imgData);
                const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

                if (i > 0) {
                    pdf.addPage();
                }
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight, undefined, 'FAST');

            } catch (error) {
                console.error(`Error generating canvas for prescription page ${i + 1}:`, error);
                alert(`Failed to process page ${i + 1} of the prescription.`);
            }
        }

        return pdf.output('blob');
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const pdfBlob = await generatePdfBlob();
            if (pdfBlob) {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(pdfBlob);
                link.download = `Prescription-${patient.name}-${consultation.date.split('T')[0]}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            }
        } catch (err) {
            console.error('Download failed:', err);
            alert('Failed to generate PDF for download.');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleShare = async () => {
        if (!navigator.share) {
            alert('Web Share API is not available on this browser. This feature requires a secure (HTTPS) connection.');
            return;
        }

        setIsSharing(true);
        try {
            const pdfBlob = await generatePdfBlob();
            if (!pdfBlob) throw new Error("PDF Blob generation failed.");

            const prescriptionFile = new File([pdfBlob], `Prescription-${patient.name}.pdf`, { type: 'application/pdf' });
            const shareData = {
                files: [prescriptionFile],
                title: `Prescription from ${pharmacyInfo.name}`,
                text: `Here is the prescription for ${patient.name} from Dr. ${consultation.doctorName}.`,
            };

            if (navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                 await navigator.share({
                     title: `Prescription from ${pharmacyInfo.name}`,
                     text: `Prescription for ${patient.name} from Dr. ${consultation.doctorName}.`,
                });
            }
        } catch (err) {
            console.error('Share failed:', err);
            if ((err as Error).name !== 'AbortError') {
                 alert('Could not share prescription as a PDF.');
            }
        } finally {
            setIsSharing(false);
        }
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col">
                <div className="p-4 border-b border-slate-200 flex justify-between items-start gap-3 no-print">
                    <div className="flex-1">
                        <h3 className="text-xl font-semibold text-brand-secondary">Prescription</h3>
                        <div className="flex items-center flex-wrap gap-2 sm:gap-3 mt-2">
                            <button
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className="flex items-center justify-center bg-blue-600 text-white px-3 py-2 sm:px-4 rounded-lg shadow-sm hover:bg-blue-700 transition-colors text-sm min-w-[120px] sm:min-w-[130px] disabled:bg-slate-400"
                            >
                                {isDownloading ? (
                                    <SpinnerIcon className="animate-spin w-5 h-5" />
                                ) : (
                                    <>
                                        <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                                        Download
                                    </>
                                )}
                            </button>
                           <button
                            onClick={handleShare}
                            disabled={isSharing}
                            className="flex items-center justify-center bg-green-600 text-white px-3 py-2 sm:px-4 rounded-lg shadow-sm hover:bg-green-700 transition-colors text-sm min-w-[90px] sm:min-w-[100px] disabled:bg-slate-400"
                          >
                                {isSharing ? (
                                    <SpinnerIcon className="animate-spin w-5 h-5" />
                                ) : (
                                    <>
                                        <ShareIcon className="w-5 h-5 mr-2" />
                                        Share
                                    </>
                                )}
                            </button>
                           <button onClick={handlePrint} className="flex items-center bg-brand-primary text-white px-3 py-2 sm:px-4 rounded-lg shadow-sm hover:bg-brand-primary-hover transition-colors text-sm">
                                <PrintIcon className="w-5 h-5 mr-2" />
                                Print
                            </button>
                        </div>
                    </div>
                     <button onClick={onClose} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="overflow-auto">
                    <div className="min-w-[40rem]">
                        <PrescriptionTemplate
                            ref={prescriptionContentRef}
                            patient={patient}
                            consultation={consultation}
                            doctor={doctor}
                            pharmacyInfo={pharmacyInfo}
                            medicines={medicines}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};