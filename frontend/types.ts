import React from 'react';

// Common props for icons
export type IconProps = React.SVGProps<SVGSVGElement>;

// Navigation and view types
export type View =
  | 'dashboard'
  | 'medicines'
  | 'billing'
  | 'billing-history'
  | 'suppliers'
  | 'reports'
  | 'settings'
  | 'patients'
  | 'appointments'
  | 'doctor-dashboard'
  | 'clinic-dashboard'
  | 'todays-appointments'
  | 'to-be-billed'
  | 'consultation-reports'
  | 'clinic-reports'
  | 'chat';

// State for components that have an initial loading skeleton
export type InitialLoadState = 'grace' | 'loading' | 'done';

// User and Clinic types
export type UserRole = 'Admin' | 'Doctor' | 'Pharmacist';

export interface User {
  id: string;
  clinicId: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  consultationFee?: number;
  specialty?: string;
}

/**
 * Defines the structure for a Super Admin user.
 * This user is not associated with a specific clinicId and has system-wide access.
 */
export interface SuperAdmin {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'SuperAdmin';
}

export interface Clinic {
  id: string;
  name: string;
  isActive: boolean;
}

export interface PharmacyInfo {
  clinicId: string;
  name: string;
  organizationType: 'Pharmacy' | 'Clinic' | 'Small Scale Hospital';
  address: string;
  city: string;
  pincode: string;
  phone: string;
  gstin: string;
  drugLicense: string;
  isGstEnabled: boolean;
}

// Medicine and Inventory types
export interface Batch {
  batchNumber: string;
  purchaseDate: string;
  expiryDate: string;
  packQuantity: number;
  looseQuantity: number;
  purchaseRate: number;
  sellingRate: number;
  supplierId: string;
  supplierName: string;
  packSize: number;
}

export interface Medicine {
  id: string;
  clinicId: string;
  name: string;
  manufacturer: string;
  composition: string;
  strength: string;
  form: string;
  unitType: string;
  hsnCode: string;
  gstRate: number;
  minStockLevel: number;
  totalStockInUnits: number;
  batches: Batch[];
}

export interface Supplier {
  id: string;
  clinicId: string;
  name: string;
  contactPerson: string;
  mobile: string;
  address: string;
  gstin: string;
  paymentTerms: string;
}

// Patient and Consultation types
export interface Vitals {
  temperature?: number;
  bloodPressure?: string;
  pulse?: number;
  weight?: number;
  height?: number;
  oxygenSaturation?: number;
}

export interface PrescriptionItem {
  medicineId: string | null;
  medicineName: string;
  quantity: number;
  dosage: string;
  duration: string;
  notes?: string;
}

export interface Consultation {
  id: string;
  clinicId: string;
  date: string;
  doctorId: string;
  doctorName: string;
  chiefComplaint: string;
  diagnosis: string;
  notes?: string;
  vitals: Vitals;
  prescription: PrescriptionItem[];
  nextReviewDate?: string;
}

export interface VaccinationRecord {
  vaccineName: string;
  dose: number | string;
  dateGiven: string;
  batchNumber?: string;
}

export interface VaccinationOverride {
    vaccineName: string;
    dose: number | string;
    newDueDate: string;
}

export interface Patient {
  id: string;
  clinicId: string;
  name: string;
  mobile: string;
  dob?: string;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
  bloodGroup?: string;
  allergies?: string;
  consultations: Consultation[];
  vaccinations: VaccinationRecord[];
  skippedVaccinations: { vaccineName: string; dose: number | string }[];
  vaccinationOverrides?: VaccinationOverride[];
}

// Billing types
export type BillItemType = 'Medicine' | 'Consultation Fee' | 'Service' | 'Product';

export interface BillItem {
  itemType: BillItemType;
  itemName: string;
  quantity: number;
  rate: number;
  amount: number;
  gstRate: number;
  isRemovable: boolean;
  medicineId?: string | null;
  hsnCode?: string;
  batchNumber?: string;
}

export interface TaxDetail {
  rate: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
}

export interface Bill {
  billNumber: string;
  clinicId: string;
  date: string;
  patient: Patient;
  items: BillItem[];
  subTotal: number;
  taxDetails: TaxDetail[];
  totalAmount: number;
  paymentMode: 'Cash' | 'Card' | 'UPI';
  appointmentId?: string;
}

export interface DraftBill {
  clinicId: string;
  patientId: string | null;
  patientTab: 'existing' | 'new';
  newPatientName: string;
  newPatientMobile: string;
  items: BillItem[];
  paymentMode: 'Cash' | 'Card' | 'UPI';
  appointmentId?: string;
}

// Appointment types
export type AppointmentStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'No Show' | 'Ready for Billing';

export interface Appointment {
  id: string;
  clinicId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  startTime: string;
  status: AppointmentStatus;
}

// Communication and Utility types
export interface Notification {
  id: string;
  clinicId: string;
  type: 'expiry' | 'low-stock' | 'out-of-stock' | 'general';
  message: string;
  timestamp: string;
  read: boolean;
}

export interface TodoItem {
  id: string;
  clinicId: string;
  doctorId: string;
  task: string;
  isCompleted: boolean;
  createdAt: string;
  dueDate: string | null;
}

export interface ChatMessage {
  id: string;
  clinicId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface SharedLink {
  id: string;
  appointmentId: string;
  clinicId: string;
  expiresAt: string;
}

export interface DraftConsultation {
    appointmentId: string;
    vitals: Vitals;
    chiefComplaint: string;
    diagnosis: string;
    notes: string;
    prescription: PrescriptionItem[];
    nextReviewDate: string;
}

export interface ProcessedStockItem {
    status: 'new_medicine' | 'new_batch' | 'error';
    data: {
        medicineName: string;
        strength: string;
        manufacturer: string;
        composition: string;
        form: string;
        hsnCode: string;
        batchNumber: string;
        expiryDate: string;
        packQuantity: number;
        unitsPerPack: number;
        purchaseRate: number;
        mrp: number;
        supplierName: string;
    };
    medicineId?: string;
    error?: string;
    lineNumber: number;
}

export interface ProcessedPatientItem {
    status: 'ok' | 'duplicate' | 'invalid';
    data: {
        name: string;
        mobile: string;
        gender?: 'Male' | 'Female' | 'Other';
        dob?: string; // Stored as DD-MM-YYYY
        address?: string;
    };
    error?: string;
    lineNumber: number;
}

export interface Banner {
  id: string;
  title: string;
  image: string; // base64 encoded image
  isActive: boolean;
  createdAt: string; // ISO string
  targetCities?: string[];
}

export interface BannerInterest {
  id: string;
  bannerId: string;
  doctorId: string;
  doctorName: string;
  clinicId: string;
  clinicName: string;
  timestamp: string; // ISO string
}