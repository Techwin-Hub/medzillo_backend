import React, { useRef, useState } from 'react';
import { Bill, PharmacyInfo } from '../types';
import { CloseIcon, PrintIcon, ShareIcon, ArrowDownTrayIcon, SpinnerIcon } from './icons';
import { InvoiceTemplate } from './InvoiceTemplate';
import { handlePrintContent } from '../utils/printUtils';


// Add type declarations for the window object to inform TypeScript about the CDN libraries
declare global {
    interface Window {
        html2canvas: any;
        jspdf: { jsPDF: new (options?: any) => any };
    }
}

interface InvoiceProps {
    bill: Bill;
    pharmacyInfo: PharmacyInfo;
    onClose: () => void;
}

export const Invoice: React.FC<InvoiceProps> = ({ bill, pharmacyInfo, onClose }) => {
    const invoiceContentRef = useRef<HTMLDivElement>(null);
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
        handlePrintContent(invoiceContentRef.current, `Invoice ${bill.billNumber}`);
    };

    const generatePdfBlob = async (): Promise<Blob | null> => {
        try {
            await loadPdfScripts();
        } catch (error) {
            console.error(error);
            alert('Failed to load necessary libraries for PDF generation. Please check your internet connection and try again.');
            return null;
        }

        const contentNode = invoiceContentRef.current;
        if (!contentNode || typeof window.html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
            console.error('PDF generation libraries not found or content node is missing.');
            alert('Could not generate PDF. Required libraries are missing or failed to load.');
            return null;
        }
        
        const canvas = await window.html2canvas(contentNode, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            height: contentNode.scrollHeight,
            windowHeight: contentNode.scrollHeight,
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new window.jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
            position -= pageHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pageHeight;
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
                link.download = `Invoice-${bill.billNumber}.pdf`;
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
            if (!pdfBlob) {
                throw new Error("PDF Blob generation failed.");
            }

            const invoiceFile = new File([pdfBlob], `Invoice-${bill.billNumber}.pdf`, {
                type: 'application/pdf',
            });

            const shareData = {
                files: [invoiceFile],
                title: `Invoice from ${pharmacyInfo.name}`,
                text: `Here is the invoice ${bill.billNumber}.`,
            };

            if (navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                console.warn("File sharing not supported, falling back to text sharing.");
                await navigator.share({
                     title: `Invoice from ${pharmacyInfo.name}`,
                     text: `Invoice Details:\nBill No: ${bill.billNumber}\nPatient: ${bill.patient.name}\nTotal Amount: ₹${bill.totalAmount.toFixed(2)}\nThank you!`,
                });
            }
        } catch (err) {
            console.error('Share failed:', err);
            if ((err as Error).name !== 'AbortError') {
                 alert('Could not share the invoice as a PDF. Sharing as text instead.');
                 await navigator.share({
                     title: `Invoice from ${pharmacyInfo.name}`,
                     text: `Invoice Details:\nBill No: ${bill.billNumber}\nPatient: ${bill.patient.name}\nTotal Amount: ₹${bill.totalAmount.toFixed(2)}\nThank you!`,
                });
            }
        } finally {
            setIsSharing(false);
        }
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[95vh] flex flex-col">
                <div className="p-4 border-b border-slate-200 flex justify-between items-start gap-3 no-print">
                    <div className="flex-1">
                        <h3 className="text-xl font-semibold text-brand-secondary">Invoice: {bill.billNumber}</h3>
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
                        <InvoiceTemplate ref={invoiceContentRef} bill={bill} pharmacyInfo={pharmacyInfo} />
                    </div>
                </div>
            </div>
        </div>
    );
};