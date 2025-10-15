// components/InvoiceTemplate.tsx (Corrected Version)

import React from 'react';
import { Bill, PharmacyInfo } from '../types';

const toWords = (num: number): string => {
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const s = ['', 'Thousand', 'Lakh', 'Crore'];

    const inWords = (n: number): string => {
        let str = '';
        if (n > 19) {
            str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
        } else {
            str += a[n];
        }
        return str.trim();
    };

    let n = Math.floor(num);
    let output = '';
    let i = 0;
    while (n > 0) {
        let chunk = n % 1000;
        if (i === 1) chunk = n % 100;
        n = Math.floor(n / (i === 1 ? 100 : 1000));
        if (chunk > 0) {
            let chunkStr = '';
            if (i === 0) {
                if (chunk >= 100) {
                    chunkStr += a[Math.floor(chunk / 100)] + ' Hundred ';
                    chunk %= 100;
                }
                if (chunk > 0) chunkStr += inWords(chunk);
            } else {
                chunkStr = inWords(chunk) + ' ' + s[i];
            }
            output = chunkStr.trim() + ' ' + output;
        }
        i++;
    }

    const rupees = output.trim() || 'Zero';
    const paise = Math.round((num - Math.floor(num)) * 100);
    const paiseStr = paise > 0 ? ' and ' + inWords(paise) + ' Paise' : '';

    return (rupees + paiseStr).trim() + ' Only';
};


interface InvoiceTemplateProps {
    bill: Bill;
    pharmacyInfo: PharmacyInfo;
}

const InvoiceHeader: React.FC<{ pharmacyInfo: PharmacyInfo; bill: Bill }> = ({ pharmacyInfo, bill }) => (
    <>
        <div className="flex justify-between items-start mb-8">
            <div>
                <h1 className="text-2xl font-bold text-brand-secondary">{pharmacyInfo.name}</h1>
                <p className="text-sm text-slate-600">{pharmacyInfo.address}, {pharmacyInfo.city} - {pharmacyInfo.pincode}</p>
                <p className="text-sm text-slate-600">Phone: {pharmacyInfo.phone}</p>
                <p className="text-sm text-slate-600">DL No: {pharmacyInfo.drugLicense}</p>
                {pharmacyInfo.isGstEnabled && <p className="text-sm text-slate-600">GSTIN: {pharmacyInfo.gstin}</p>}
            </div>
            <div className="text-right">
                <h2 className="text-3xl font-bold uppercase text-brand-primary">Invoice</h2>
                <p><strong>Bill No:</strong> {bill.billNumber}</p>
                <p><strong>Date:</strong> {new Date(bill.date).toLocaleDateString('en-GB')}</p>
            </div>
        </div>

        <div className="mb-8 p-4 border rounded-lg bg-slate-50">
            <h4 className="font-semibold mb-2 text-slate-700">Bill To:</h4>
            <p className="font-bold">{bill.patient.name}</p>
            <p className="text-sm">Mobile: {bill.patient.mobile}</p>
            <p className="mt-2 text-sm"><strong>Payment Mode:</strong> {bill.paymentMode}</p>
        </div>
    </>
);

const InvoiceTableHeader: React.FC = () => (
    <thead className="bg-slate-100">
        <tr>
            <th className="p-2 text-left font-semibold text-slate-700 w-8">#</th>
            <th className="p-2 text-left font-semibold text-slate-700">Item Description</th>
            <th className="p-2 text-left font-semibold text-slate-700">Batch</th>
            <th className="p-2 text-right font-semibold text-slate-700">Qty</th>
            <th className="p-2 text-right font-semibold text-slate-700">Rate</th>
            <th className="p-2 text-right font-semibold text-slate-700">Amount</th>
        </tr>
    </thead>
);

const InvoiceFooter: React.FC<{ bill: Bill }> = ({ bill }) => (
    <>
        <div className="flex justify-between pt-4">
            <div className="max-w-xs">
                <p className="font-semibold">Amount in Words:</p>
                <p className="text-xs italic text-slate-600">{toWords(bill.totalAmount)}</p>
            </div>
            <div className="w-72">
                <div className="flex justify-between mb-1"><span className="text-slate-600">Subtotal:</span> <span>₹{bill.subTotal.toFixed(2)}</span></div>
                {/* THIS IS A CORRECTED LINE WITH A SAFETY CHECK */}
                {(bill.taxDetails || []).map((tax, index) => (
                    <div key={index} className="text-slate-500 text-xs">
                        <div className="flex justify-between">
                            <span>CGST @{(tax.rate / 2).toFixed(2)}% on ₹{tax.taxableAmount.toFixed(2)}</span>
                            <span>₹{tax.cgst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>SGST @{(tax.rate / 2).toFixed(2)}% on ₹{tax.taxableAmount.toFixed(2)}</span>
                            <span>₹{tax.sgst.toFixed(2)}</span>
                        </div>
                    </div>
                ))}
                <div className="flex justify-between font-bold text-lg border-t border-slate-300 pt-2 mt-2"><span className="text-brand-secondary">Grand Total:</span> <span className="text-brand-secondary">₹{bill.totalAmount.toFixed(2)}</span></div>
            </div>
        </div>

        <div className="mt-16 text-center text-xs text-slate-500">
            <p>This is a computer-generated invoice and does not require a signature.</p>
            <p>Thank you for your business!</p>
        </div>
    </>
);

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ bill, pharmacyInfo }, ref) => {
    const ITEMS_PER_FIRST_PAGE = 15;
    const ITEMS_PER_SUBSEQUENT_PAGE = 25;

    // THIS IS THE CORRECTED CODE BLOCK WITH A SAFETY CHECK
    const items = bill.items || [];
    const itemChunks: Bill['items'][] = [];
    if (items.length > ITEMS_PER_FIRST_PAGE) {
        const itemsCopy = [...items];
        itemChunks.push(itemsCopy.splice(0, ITEMS_PER_FIRST_PAGE));
        while (itemsCopy.length > 0) {
            itemChunks.push(itemsCopy.splice(0, ITEMS_PER_SUBSEQUENT_PAGE));
        }
    } else {
        itemChunks.push(items);
    }

    let itemCounter = 1;

    return (
        <div ref={ref} className="bg-white">
            {itemChunks.map((chunk, pageIndex) => (
                <div key={pageIndex} className="p-8 text-slate-800" style={{ pageBreakAfter: pageIndex < itemChunks.length -1 ? 'always' : 'auto' }}>
                    {pageIndex === 0 && <InvoiceHeader pharmacyInfo={pharmacyInfo} bill={bill} />}
                    
                    {pageIndex > 0 && (
                        <div className="text-right mb-4">
                            <h2 className="text-2xl font-bold uppercase text-brand-primary">Invoice (Cont.)</h2>
                            <p><strong>Bill No:</strong> {bill.billNumber}</p>
                             <p>Page {pageIndex + 1} of {itemChunks.length}</p>
                        </div>
                    )}

                    <table className="min-w-full mb-8 text-sm">
                        <InvoiceTableHeader />
                        <tbody>
                            {(chunk || []).map((item) => (
                                <tr key={`${item.itemName}-${item.batchNumber}-${itemCounter}`} className="border-b border-slate-200">
                                    <td className="p-2">{itemCounter++}</td>
                                    <td className="p-2">{item.itemName}</td>
                                    <td className="p-2">{item.batchNumber || '—'}</td>
                                    <td className="p-2 text-right">{item.quantity}</td>
                                    <td className="p-2 text-right">{item.rate.toFixed(2)}</td>
                                    <td className="p-2 text-right font-medium">{item.amount.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {pageIndex === itemChunks.length - 1 && <InvoiceFooter bill={bill} />}
                </div>
            ))}
        </div>
    );
});