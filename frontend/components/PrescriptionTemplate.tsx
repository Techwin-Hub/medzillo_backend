// components/PrescriptionTemplate.tsx (Corrected Version)

import React from 'react';
import { Patient, Consultation, PharmacyInfo, Medicine, User } from '../types';
import { RxIcon } from './icons';

interface PrescriptionTemplateProps {
    patient: Patient;
    consultation: Consultation;
    doctor: User;
    pharmacyInfo: PharmacyInfo;
    medicines: Medicine[];
}

const parseIndianDate = (indianDateStr: string | undefined): Date | null => {
    if (!indianDateStr) return null;
    const parts = indianDateStr.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
    if (!parts) return null;
    const [, day, month, year] = parts;
    const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
    if (isNaN(date.getTime()) || date.getUTCDate() !== parseInt(day, 10)) return null;
    return date;
};

const getAge = (dob: string | undefined) => {
    if (!dob) return 'N/A';
    const birthDate = parseIndianDate(dob);
    if (!birthDate) return 'N/A';

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return `${Math.max(0, age)} years`;
};

const FullHeader: React.FC<Omit<PrescriptionTemplateProps, 'medicines'>> = ({ patient, consultation, doctor, pharmacyInfo }) => (
    <>
        <div className="text-center border-b-2 border-slate-400 pb-4">
            <h1 className="text-3xl font-bold text-brand-secondary">{pharmacyInfo.name}</h1>
            <p className="text-sm text-slate-600">{pharmacyInfo.address}, {pharmacyInfo.city} - {pharmacyInfo.pincode} | Phone: {pharmacyInfo.phone}</p>
            <p className="text-lg font-semibold mt-2">{doctor.name}</p>
            {doctor.specialty && <p className="text-sm text-slate-600">{doctor.specialty}</p>}
        </div>
        <div className="flex justify-between items-center my-4 text-sm border-b border-slate-200 pb-4">
            <div><span className="font-bold">Patient: </span> {patient.name}</div>
            <div><span className="font-bold">Age/Gender: </span> {getAge(patient.dob)} / {patient.gender}</div>
            <div><span className="font-bold">Date: </span> {new Date(consultation.date).toLocaleDateString('en-GB')}</div>
        </div>
        {/* THIS IS THE CORRECTED LINE WITH THE SAFETY CHECK */}
        {consultation.vitals && Object.values(consultation.vitals).some(v => v) && (
            <div className="text-xs mb-4">
                <span className="font-bold">Vitals: </span>
                {consultation.vitals.bloodPressure && `BP: ${consultation.vitals.bloodPressure} | `}
                {consultation.vitals.pulse && `Pulse: ${consultation.vitals.pulse} bpm | `}
                {consultation.vitals.temperature && `Temp: ${consultation.vitals.temperature}°F | `}
                {consultation.vitals.weight && `Weight: ${consultation.vitals.weight} kg`}
            </div>
        )}
        <div className="my-6 space-y-4 text-sm">
            {consultation.chiefComplaint && <div><h4 className="font-bold text-slate-700 border-b border-slate-200 pb-1 mb-1">Chief Complaint</h4><p className="text-slate-600">{consultation.chiefComplaint}</p></div>}
            {consultation.diagnosis && <div><h4 className="font-bold text-slate-700 border-b border-slate-200 pb-1 mb-1">Diagnosis</h4><p className="text-slate-600">{consultation.diagnosis}</p></div>}
            {consultation.notes && <div><h4 className="font-bold text-slate-700 border-b border-slate-200 pb-1 mb-1">Doctor's Notes</h4><p className="text-slate-600 whitespace-pre-wrap">{consultation.notes}</p></div>}
        </div>
    </>
);

const ContinuationHeader: React.FC<{ patient: Patient; consultation: Consultation; page: number; totalPages: number; }> = ({ patient, consultation, page, totalPages }) => (
    <div className="border-b-2 border-slate-400 pb-2 mb-4">
        <div className="flex justify-between items-baseline">
            <h2 className="text-xl font-bold">Prescription (Cont.)</h2>
            <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
        </div>
        <div className="flex justify-between items-center text-xs mt-1">
            <span><strong>Patient:</strong> {patient.name}</span>
            <span><strong>Date:</strong> {new Date(consultation.date).toLocaleDateString('en-GB')}</span>
        </div>
    </div>
);

const TableHeader: React.FC = () => (
    <thead>
        <tr className="border-b-2 border-slate-300">
            <th className="p-2 text-left font-semibold text-slate-700">Medicine</th>
            <th className="p-2 text-left font-semibold text-slate-700">Dosage</th>
            <th className="p-2 text-left font-semibold text-slate-700">Duration</th>
            <th className="p-2 text-left font-semibold text-slate-700">Notes</th>
        </tr>
    </thead>
);

const Footer: React.FC<{ consultation: Consultation }> = ({ consultation }) => (
    <>
        <div className="mt-24 flex justify-end text-right">
            <div>
                {consultation.nextReviewDate && (
                    <p className="text-sm font-semibold">
                        Next Review on: {new Date(consultation.nextReviewDate).toLocaleDateString('en-GB')}
                    </p>
                )}
            </div>
        </div>
        <div className="mt-12 text-center text-xs text-slate-500">
            <p>This is a computer-generated prescription.</p>
        </div>
    </>
);

export const PrescriptionTemplate = React.forwardRef<HTMLDivElement, PrescriptionTemplateProps>(
    ({ patient, consultation, doctor, pharmacyInfo, medicines }, ref) => {
    
    const ITEMS_PER_FIRST_PAGE = 8;
    const ITEMS_PER_SUBSEQUENT_PAGE = 18;

    const itemChunks: Consultation['prescription'][] = [];
    if (consultation.prescription.length > ITEMS_PER_FIRST_PAGE) {
        const itemsCopy = [...consultation.prescription];
        itemChunks.push(itemsCopy.splice(0, ITEMS_PER_FIRST_PAGE));
        while (itemsCopy.length > 0) {
            itemChunks.push(itemsCopy.splice(0, ITEMS_PER_SUBSEQUENT_PAGE));
        }
    } else {
        itemChunks.push(consultation.prescription);
    }
        
    return (
        <div ref={ref} className="bg-white">
            {itemChunks.map((chunk, pageIndex) => (
                <div key={pageIndex} className="prescription-page-container p-8 text-slate-800 bg-white" style={{ pageBreakAfter: pageIndex < itemChunks.length - 1 ? 'always' : 'auto', width: '794px', minHeight: '1123px', display: 'flex', flexDirection: 'column' }}>
                    <div className="flex-grow">
                        {pageIndex === 0 ? (
                            <FullHeader patient={patient} consultation={consultation} doctor={doctor} pharmacyInfo={pharmacyInfo} />
                        ) : (
                            <ContinuationHeader patient={patient} consultation={consultation} page={pageIndex + 1} totalPages={itemChunks.length} />
                        )}
                        <div className="flex mt-6">
                            <div className="w-16">
                               {pageIndex === 0 && <RxIcon className="w-12 h-12 text-brand-secondary"/>}
                            </div>
                            <div className="flex-1">
                                <table className="min-w-full text-sm">
                                    <TableHeader />
                                    <tbody>
                                        {chunk.map((item, index) => {
                                            const med = item.medicineId ? medicines.find(m => m.id === item.medicineId) : undefined;
                                            const stockAvailable = med ? med.totalStockInUnits : 0;
                                            const needsExternalPurchase = !item.medicineId || item.quantity > stockAvailable;
                                            const shortFall = item.quantity - stockAvailable;

                                            return (
                                                <tr key={index} className="border-b border-slate-200">
                                                    <td className="p-2 font-semibold">
                                                        {item.medicineName}
                                                        {needsExternalPurchase && (
                                                            <span className="text-xs text-slate-500 font-normal ml-2">
                                                                {stockAvailable > 0 && shortFall > 0
                                                                    ? `(${stockAvailable} available, purchase ${shortFall} outside)`
                                                                    : `(Purchase Outside)`}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-2">{item.dosage}</td>
                                                    <td className="p-2">{item.duration}</td>
                                                    <td className="p-2 text-xs">{item.notes}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    {pageIndex === itemChunks.length - 1 && (
                        <div className="shrink-0">
                             <Footer consultation={consultation} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
});