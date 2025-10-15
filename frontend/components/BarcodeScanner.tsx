import React from 'react';
import { CloseIcon } from './icons';

interface BarcodeScannerProps {
    onScan: (scannedCode: string) => void;
    onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
    
    // In a real application, this would use a library like react-qr-reader
    // or the Barcode Detection API to process the camera stream.
    // For this simulation, we'll use a button to emulate a successful scan.
    const handleSimulateScan = () => {
        const mockBarcode = `3004${Math.floor(1000 + Math.random() * 9000)}`;
        onScan(mockBarcode);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-[100] flex flex-col justify-center items-center p-4">
            <div className="absolute top-4 right-4">
                <button onClick={onClose} className="text-white hover:text-slate-300">
                    <CloseIcon className="w-8 h-8" />
                </button>
            </div>

            <div className="w-full max-w-md text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Scan Barcode</h2>
                <p className="text-slate-300 mb-6">Point your camera at the medicine's barcode.</p>
                
                <div className="relative w-full aspect-video bg-slate-900 rounded-lg overflow-hidden border-4 border-slate-600">
                    {/* This would be the video feed from the camera */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-slate-500">Camera feed would appear here</p>
                    </div>

                    {/* Viewfinder overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10/12 h-1/2 border-4 border-brand-primary rounded-lg" style={{
                            clipPath: 'polygon(0% 0%, 0% 20px, 20px 20px, 20px 0%, 100% 0%, 100% 20px, calc(100% - 20px) 20px, calc(100% - 20px) 100%, 100% 100%, 100% calc(100% - 20px), calc(100% - 20px) calc(100% - 20px), calc(100% - 20px) 100%, 0% 100%, 0% calc(100% - 20px), 20px calc(100% - 20px), 20px 100%, 0% 100%, 0% 0%)'
                        }}></div>
                    </div>
                     <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 animate-scan"></div>
                </div>

                <div className="mt-6">
                    <button 
                        onClick={handleSimulateScan}
                        className="w-full px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-primary-hover transition-colors"
                    >
                        Simulate Successful Scan
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes scan {
                    0% { transform: translateY(-50px); }
                    50% { transform: translateY(50px); }
                    100% { transform: translateY(-50px); }
                }
                .animate-scan {
                    animation: scan 2s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};
