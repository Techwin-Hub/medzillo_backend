import { User, Medicine, Patient, Supplier, Bill, Appointment, Clinic, PharmacyInfo, Batch, Notification, TodoItem, ChatMessage, BillItem, TaxDetail, Consultation, Vitals, SuperAdmin, Banner, BannerInterest } from '../types';

// This hook now generates fully self-contained data for each clinic,
// including clinic-specific HSN codes.
export const useMockData = () => {
    
    // =================================================================
    // Shared Data
    // =================================================================
    const hsnCodesForClinic: { [key: string]: number } = {
        '30041010': 12, '30041020': 12, '30042011': 12, '30049099': 12,
        '30066020': 18, '90183100': 12, '30059040': 12,
        '21069099': 18, // Health supplements
        '33049990': 18, // Cosmetics
    };

    const clinics: Clinic[] = [
        { id: 'clinic1', name: 'Apollo Health Clinic', isActive: true },
        { id: 'clinic2', name: 'Max Care Pharma', isActive: true },
    ];
    
    const superAdmins: SuperAdmin[] = [
        { id: 'super_admin_1', name: 'Super Admin', email: 'superadmin@medzillo.com', password: 'password', role: 'SuperAdmin' },
    ];

    const banners: Banner[] = [
        {
            id: 'banner1',
            title: 'Summer Health Checkup Camp',
            image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAwIDQwMCIgd2lkdGg9IjEyMDAiIGhlaWdodD0iNDAwIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNDI5OWU1IiAvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0YW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjgwIiBmaWxsPSIjZmZmZmZmIj5TdW1tZXIgSGVhbHRoIENoZWNrdXAgQ2FtcDwvdGV4dD4KICA8dGV4dCB4PSI1MCUiIHk9IjcwJSIIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjQwIiBmaWxsPSIjZmZmZmZmIj41MCUgT0ZmIEJvb2sgTm93LCBCb29rIE5vdyw8L3RleHQ+Cjwvc3ZnPg==',
            isActive: true,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            targetCities: ['Mumbai'],
        },
        {
            id: 'banner2',
            title: 'Nationwide Vaccine Awareness',
            image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAwIDQwMCIgd2lkdGg9IjEyMDAiIGhlaWdodD0iNDAwIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNjA1ZmEiIC8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjgwIiBmaWxsPSIjZmZmZmZmIj5WYWNjaW5lIEF3YXJlbmVzcyBXZWVrPC90ZXh0PgogIDx0ZXh0IHg9IjUwJSIgeT0iNzAlIiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjQwIiBmaWxsPSIjZmZmZmZmIj5HZXQgeW91ciBzaG90IHRvZGF5ITwvdGV4dD4KPC9zdmc+',
            isActive: true,
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            targetCities: [], // Empty array means it's a global banner
        }
    ];
    
    const bannerInterests: BannerInterest[] = [];

    const dailySalesData = [
        { name: 'Mon', sales: 4000 },
        { name: 'Tue', sales: 3000 },
        { name: 'Wed', sales: 2000 },
        { name: 'Thu', sales: 2780 },
        { name: 'Fri', sales: 1890 },
        { name: 'Sat', sales: 2390 },
        { name: 'Sun', sales: 3490 },
    ];
    
    // =================================================================
    // Clinic 1: Apollo Health Clinic Data
    // =================================================================
    const clinic1Id = 'clinic1';
    const clinic1Users: User[] = [
        { id: 'user_admin_c1', clinicId: clinic1Id, name: 'Admin User', email: 'admin@apollo.com', password: 'password', role: 'Admin' },
        { id: 'user_doc_c1', clinicId: clinic1Id, name: 'Dr. John Doe', email: 'john.doe@apollo.com', password: 'password', role: 'Doctor', consultationFee: 800, specialty: 'Cardiologist' },
        { id: 'user_pharma_c1', clinicId: clinic1Id, name: 'Alice Smith', email: 'alice.smith@apollo.com', password: 'password', role: 'Pharmacist' },
    ];
    
    const clinic1Suppliers: Supplier[] = [
        { id: 'sup1_c1', clinicId: clinic1Id, name: 'Global Pharma Distributors', contactPerson: 'Rajesh Kumar', mobile: '+919876543210', address: '123 Pharma Lane, Mumbai', gstin: '27AAAAA0000A1Z5', paymentTerms: '30 Days' },
        { id: 'sup2_c1', clinicId: clinic1Id, name: 'MedLife Supplies', contactPerson: 'Priya Sharma', mobile: '+919123456789', address: '456 Health Ave, Delhi', gstin: '07BBBBB0000B1Z6', paymentTerms: 'Net 45' },
    ];

    const clinic1Medicines: Medicine[] = [
        { id: 'med1_c1', clinicId: clinic1Id, name: 'Paracetamol 500mg', manufacturer: 'GSK', composition: 'Paracetamol', strength: '500mg', form: 'Tablet', unitType: 'Tablet', hsnCode: '30049099', gstRate: 12, minStockLevel: 50, totalStockInUnits: 250, 
            batches: [
                { batchNumber: 'P001', purchaseDate: '2023-10-01', expiryDate: '2025-09-30', packQuantity: 15, looseQuantity: 0, purchaseRate: 20, sellingRate: 30, supplierId: 'sup1_c1', supplierName: 'Global Pharma Distributors', packSize: 10 },
                { batchNumber: 'P002', purchaseDate: '2023-11-15', expiryDate: '2025-10-31', packQuantity: 10, looseQuantity: 0, purchaseRate: 21, sellingRate: 30, supplierId: 'sup2_c1', supplierName: 'MedLife Supplies', packSize: 10 }
            ]
        },
        { id: 'med2_c1', clinicId: clinic1Id, name: 'Amoxicillin 250mg', manufacturer: 'Cipla', composition: 'Amoxicillin', strength: '250mg', form: 'Capsule', unitType: 'Capsule', hsnCode: '30041010', gstRate: 12, minStockLevel: 30, totalStockInUnits: 80, 
            batches: [
                { batchNumber: 'A001', purchaseDate: '2023-09-20', expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], packQuantity: 8, looseQuantity: 0, purchaseRate: 45, sellingRate: 60, supplierId: 'sup1_c1', supplierName: 'Global Pharma Distributors', packSize: 10 }
            ]
        },
        { id: 'med3_c1', clinicId: clinic1Id, name: 'Azithromycin 500mg', manufacturer: 'Sun Pharma', composition: 'Azithromycin', strength: '500mg', form: 'Tablet', unitType: 'Tablet', hsnCode: '30042011', gstRate: 12, minStockLevel: 25, totalStockInUnits: 20, 
            batches: [
                { batchNumber: 'Z001', purchaseDate: '2023-12-01', expiryDate: '2025-11-30', packQuantity: 4, looseQuantity: 0, purchaseRate: 80, sellingRate: 110, supplierId: 'sup2_c1', supplierName: 'MedLife Supplies', packSize: 5 }
            ]
        },
        { id: 'med4_c1', clinicId: clinic1Id, name: 'Atorvastatin 10mg', manufacturer: 'Pfizer', composition: 'Atorvastatin', strength: '10mg', form: 'Tablet', unitType: 'Tablet', hsnCode: '30049099', gstRate: 12, minStockLevel: 40, totalStockInUnits: 0, batches: [] },
        { id: 'med5_c1', clinicId: clinic1Id, name: 'Benadryl Cough Syrup', manufacturer: 'J&J', composition: 'Diphenhydramine', strength: '100ml', form: 'Syrup', unitType: 'Bottle', hsnCode: '30049099', gstRate: 12, minStockLevel: 10, totalStockInUnits: 8,
            batches: [
                 { batchNumber: 'B001', purchaseDate: '2024-01-10', expiryDate: '2026-01-09', packQuantity: 8, looseQuantity: 0, purchaseRate: 90, sellingRate: 125, supplierId: 'sup1_c1', supplierName: 'Global Pharma Distributors', packSize: 1 }
            ]
        },
        { id: 'med6_c1', clinicId: clinic1Id, name: 'Vitamin C 500mg', manufacturer: 'Abbott', composition: 'Ascorbic Acid', strength: '500mg', form: 'Tablet', unitType: 'Tablet', hsnCode: '21069099', gstRate: 18, minStockLevel: 50, totalStockInUnits: 1200,
            batches: [
                { batchNumber: 'VC001', purchaseDate: '2024-02-01', expiryDate: '2025-07-31', packQuantity: 60, looseQuantity: 0, purchaseRate: 35, sellingRate: 50, supplierId: 'sup2_c1', supplierName: 'MedLife Supplies', packSize: 20 }
            ]
        }
    ];
    
    const clinic1Consultations: { [patientId: string]: Consultation[] } = {
        'pat1_c1': [
            { id: 'con_apt1_c1', clinicId: clinic1Id, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), doctorId: 'user_doc_c1', doctorName: 'Dr. John Doe', chiefComplaint: 'Fever and body ache for 2 days', diagnosis: 'Viral Fever', notes: 'Advised rest and hydration.', vitals: { temperature: 38.5, bloodPressure: '120/80', pulse: 90 },
                prescription: [ { medicineId: 'med1_c1', medicineName: 'Paracetamol 500mg', quantity: 15, dosage: '1-1-1', duration: '5 days' } ],
                nextReviewDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            },
            { id: 'con_apt2_c1', clinicId: clinic1Id, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), doctorId: 'user_doc_c1', doctorName: 'Dr. John Doe', chiefComplaint: 'Follow-up for fever', diagnosis: 'Recovering from Viral Fever', vitals: { temperature: 37.2, bloodPressure: '118/78', pulse: 80 }, prescription: [] }
        ],
        'pat2_c1': [
            { id: 'con_apt3_c1', clinicId: clinic1Id, date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), doctorId: 'user_doc_c1', doctorName: 'Dr. John Doe', chiefComplaint: 'Persistent cough', diagnosis: 'Bronchitis', vitals: { temperature: 37.0, oxygenSaturation: 98 },
                prescription: [ { medicineId: 'med5_c1', medicineName: 'Benadryl Cough Syrup', quantity: 1, dosage: '1-1-1', duration: '5 days' } ]
            }
        ],
        'pat3_c1': [
             { id: 'con_apt4_c1', clinicId: clinic1Id, date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), doctorId: 'user_doc_c1', doctorName: 'Dr. John Doe', chiefComplaint: 'Sore throat and fever', diagnosis: 'Bacterial Infection', vitals: { temperature: 39.0 },
                prescription: [ { medicineId: 'med3_c1', medicineName: 'Azithromycin 500mg', quantity: 3, dosage: '1-0-0', duration: '3 days' } ]
            }
        ],
    };

    const clinic1Patients: Patient[] = [
        { id: 'pat1_c1', clinicId: clinic1Id, name: 'Anjali Sharma', mobile: '9820012345', dob: '15-08-1990', gender: 'Female', address: 'A-101, Marine Drive, Mumbai', bloodGroup: 'O+', consultations: clinic1Consultations['pat1_c1'], vaccinations: [], skippedVaccinations: [], vaccinationOverrides: [] },
        { id: 'pat2_c1', clinicId: clinic1Id, name: 'Rohan Verma', mobile: '9988776655', dob: '22-05-1985', gender: 'Male', address: 'B-202, Andheri West, Mumbai', consultations: clinic1Consultations['pat2_c1'], vaccinations: [], skippedVaccinations: [], vaccinationOverrides: [] },
        { id: 'pat3_c1', clinicId: clinic1Id, name: 'Priya Singh', mobile: '9123456780', dob: '30-11-2000', gender: 'Female', address: 'C-303, Bandra, Mumbai', allergies: 'Penicillin', consultations: clinic1Consultations['pat3_c1'], vaccinations: [], skippedVaccinations: [], vaccinationOverrides: [] },
    ];
    
    const clinic1Appointments: Appointment[] = [
        { id: 'apt1_c1', clinicId: clinic1Id, patientId: 'pat1_c1', patientName: 'Anjali Sharma', doctorId: 'user_doc_c1', doctorName: 'Dr. John Doe', startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), status: 'Completed' },
        { id: 'apt2_c1', clinicId: clinic1Id, patientId: 'pat1_c1', patientName: 'Anjali Sharma', doctorId: 'user_doc_c1', doctorName: 'Dr. John Doe', startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: 'Completed' },
        { id: 'apt3_c1', clinicId: clinic1Id, patientId: 'pat2_c1', patientName: 'Rohan Verma', doctorId: 'user_doc_c1', doctorName: 'Dr. John Doe', startTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), status: 'Completed' },
        { id: 'apt4_c1', clinicId: clinic1Id, patientId: 'pat3_c1', patientName: 'Priya Singh', doctorId: 'user_doc_c1', doctorName: 'Dr. John Doe', startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), status: 'Ready for Billing' },
        { id: 'apt5_c1', clinicId: clinic1Id, patientId: 'pat2_c1', patientName: 'Rohan Verma', doctorId: 'user_doc_c1', doctorName: 'Dr. John Doe', startTime: new Date().toISOString(), status: 'Scheduled' },
    ];
    
    const clinic1Bills: Bill[] = [
        { billNumber: 'INV-1700000000001', clinicId: clinic1Id, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), patient: clinic1Patients[0], items: [ { itemType: 'Consultation Fee', itemName: 'Consultation - Dr. John Doe', quantity: 1, rate: 800, amount: 800, gstRate: 0, isRemovable: false }, { itemType: 'Medicine', medicineId: 'med1_c1', itemName: 'Paracetamol 500mg', hsnCode: '30049099', quantity: 15, rate: 3, amount: 45, gstRate: 12, batchNumber: 'P001', isRemovable: true } ], subTotal: 845, taxDetails: [{ rate: 12, taxableAmount: 45, cgst: 2.7, sgst: 2.7 }], totalAmount: 850.4, paymentMode: 'UPI', appointmentId: 'apt1_c1' },
        { billNumber: 'INV-1700000000002', clinicId: clinic1Id, date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), patient: clinic1Patients[1], items: [ { itemType: 'Consultation Fee', itemName: 'Consultation - Dr. John Doe', quantity: 1, rate: 800, amount: 800, gstRate: 0, isRemovable: false }, { itemType: 'Medicine', medicineId: 'med5_c1', itemName: 'Benadryl Cough Syrup', hsnCode: '30049099', quantity: 1, rate: 125, amount: 125, gstRate: 12, batchNumber: 'B001', isRemovable: true } ], subTotal: 925, taxDetails: [{ rate: 12, taxableAmount: 125, cgst: 7.5, sgst: 7.5 }], totalAmount: 940, paymentMode: 'Cash', appointmentId: 'apt3_c1' },
    ];
    
    const clinic1Todos: TodoItem[] = [
        { id: 'todo1_c1', clinicId: clinic1Id, doctorId: 'user_doc_c1', task: 'Follow up with Anjali Sharma', isCompleted: false, createdAt: new Date().toISOString(), dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { id: 'todo2_c1', clinicId: clinic1Id, doctorId: 'user_doc_c1', task: 'Review lab reports for Rohan Verma', isCompleted: true, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), dueDate: null },
    ];

    const clinic1ChatMessages: ChatMessage[] = [
        { id: 'chat1_c1', clinicId: clinic1Id, senderId: 'user_doc_c1', receiverId: 'user_pharma_c1', content: 'Hi Alice, do we have Atorvastatin 10mg in stock?', timestamp: new Date(Date.now() - 60000 * 5).toISOString(), read: true },
        { id: 'chat2_c1', clinicId: clinic1Id, senderId: 'user_pharma_c1', receiverId: 'user_doc_c1', content: 'Hi Dr. Doe, no, it is currently out of stock. Should I place an order?', timestamp: new Date(Date.now() - 60000 * 4).toISOString(), read: true },
        { id: 'chat3_c1', clinicId: clinic1Id, senderId: 'user_doc_c1', receiverId: 'user_pharma_c1', content: 'Yes, please order 10 strips.', timestamp: new Date(Date.now() - 60000 * 3).toISOString(), read: false },
    ];

    // =================================================================
    // Clinic 2: Max Care Pharma Data
    // =================================================================
    const clinic2Id = 'clinic2';
    const clinic2Users: User[] = [
        { id: 'user_admin_c2', clinicId: clinic2Id, name: 'Admin MaxCare', email: 'admin@maxcare.com', password: 'password', role: 'Admin' },
        { id: 'user_doc_c2', clinicId: clinic2Id, name: 'Dr. Jane Roe', email: 'jane.roe@maxcare.com', password: 'password', role: 'Doctor', consultationFee: 600, specialty: 'General Physician' },
        { id: 'user_pharma_c2', clinicId: clinic2Id, name: 'Bob Johnson', email: 'bob.j@maxcare.com', password: 'password', role: 'Pharmacist' },
    ];
    
    const clinic2Suppliers: Supplier[] = [
        { id: 'sup1_c2', clinicId: clinic2Id, name: 'National Health Supply', contactPerson: 'Amit Patel', mobile: '+919876543211', address: '789 Business Park, Pune', gstin: '27CCCCC0000C1Z7', paymentTerms: 'Immediate' },
    ];
    
    const clinic2Medicines: Medicine[] = [
        { id: 'med1_c2', clinicId: clinic2Id, name: 'Metformin 500mg', manufacturer: 'Sun Pharma', composition: 'Metformin', strength: '500mg', form: 'Tablet', unitType: 'Tablet', hsnCode: '30049099', gstRate: 12, minStockLevel: 20, totalStockInUnits: 750, batches: [{ batchNumber: 'M001', purchaseDate: '2023-11-01', expiryDate: '2025-10-31', packQuantity: 50, looseQuantity: 0, purchaseRate: 25, sellingRate: 40, supplierId: 'sup1_c2', supplierName: 'National Health Supply', packSize: 15 }] },
        { id: 'med2_c2', clinicId: clinic2Id, name: 'Lisinopril 5mg', manufacturer: 'Lupin', composition: 'Lisinopril', strength: '5mg', form: 'Tablet', unitType: 'Tablet', hsnCode: '30049099', gstRate: 12, minStockLevel: 15, totalStockInUnits: 300, batches: [{ batchNumber: 'L001', purchaseDate: '2023-10-10', expiryDate: '2025-09-30', packQuantity: 30, looseQuantity: 0, purchaseRate: 15, sellingRate: 25, supplierId: 'sup1_c2', supplierName: 'National Health Supply', packSize: 10 }] },
    ];
    
    const clinic2Patients: Patient[] = [
        { id: 'pat1_c2', clinicId: clinic2Id, name: 'Vikram Rathod', mobile: '9112233445', dob: '10-01-1975', gender: 'Male', consultations: [{ id: 'con_apt1_c2', clinicId: clinic2Id, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), doctorId: 'user_doc_c2', doctorName: 'Dr. Jane Roe', chiefComplaint: 'High blood pressure reading', diagnosis: 'Hypertension', vitals: { bloodPressure: '140/90' }, prescription: [{ medicineId: 'med2_c2', medicineName: 'Lisinopril 5mg', quantity: 30, dosage: '1-0-0', duration: '30 days' }] }], vaccinations: [], skippedVaccinations: [], vaccinationOverrides: [] },
        { id: 'pat2_c2', clinicId: clinic2Id, name: 'Sunita Desai', mobile: '9223344556', dob: '05-06-1968', gender: 'Female', consultations: [{ id: 'con_apt2_c2', clinicId: clinic2Id, date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), doctorId: 'user_doc_c2', doctorName: 'Dr. Jane Roe', chiefComplaint: 'High blood sugar', diagnosis: 'Type 2 Diabetes', vitals: {}, prescription: [{ medicineId: 'med1_c2', medicineName: 'Metformin 500mg', quantity: 60, dosage: '1-0-1', duration: '30 days' }] }], vaccinations: [], skippedVaccinations: [], vaccinationOverrides: [] },
    ];
    
     const clinic2Appointments: Appointment[] = [
        { id: 'apt1_c2', clinicId: clinic2Id, patientId: 'pat1_c2', patientName: 'Vikram Rathod', doctorId: 'user_doc_c2', doctorName: 'Dr. Jane Roe', startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: 'Ready for Billing' },
        { id: 'apt2_c2', clinicId: clinic2Id, patientId: 'pat2_c2', patientName: 'Sunita Desai', doctorId: 'user_doc_c2', doctorName: 'Dr. Jane Roe', startTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), status: 'Completed' },
        { id: 'apt3_c2', clinicId: clinic2Id, patientId: 'pat1_c2', patientName: 'Vikram Rathod', doctorId: 'user_doc_c2', doctorName: 'Dr. Jane Roe', startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), status: 'Scheduled' },
    ];

    const clinic2Bills: Bill[] = [
        { billNumber: 'INV-1710000000001', clinicId: clinic2Id, date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), patient: clinic2Patients[1], items: [ { itemType: 'Consultation Fee', itemName: 'Consultation - Dr. Jane Roe', quantity: 1, rate: 600, amount: 600, gstRate: 0, isRemovable: false }, { itemType: 'Medicine', medicineId: 'med1_c2', itemName: 'Metformin 500mg', hsnCode: '30049099', quantity: 60, rate: 2.67, amount: 160.2, gstRate: 12, batchNumber: 'M001', isRemovable: true } ], subTotal: 760.2, taxDetails: [{ rate: 12, taxableAmount: 160.2, cgst: 9.61, sgst: 9.61 }], totalAmount: 779.42, paymentMode: 'Card', appointmentId: 'apt2_c2' },
    ];
    
    // =================================================================
    // Final Data Aggregation
    // =================================================================
    const dataByClinicId = {
        [clinic1Id]: {
            users: clinic1Users,
            medicines: clinic1Medicines,
            patients: clinic1Patients,
            suppliers: clinic1Suppliers,
            appointments: clinic1Appointments,
            bills: clinic1Bills,
            todos: clinic1Todos,
            chatMessages: clinic1ChatMessages,
            notifications: [], // Generated dynamically
            hsnCodes: { ...hsnCodesForClinic },
            pharmacyInfo: {
                clinicId: clinic1Id, name: 'Apollo Health Clinic', organizationType: 'Clinic' as const,
                address: "123 Health St, Wellness City", city: "Mumbai", pincode: "400001", phone: "+91 (22) 1234-5678",
                gstin: "27ABCDE1234F1Z5", drugLicense: "DL12345678", isGstEnabled: true,
            },
            sharedLinks: [],
            supplierMappingTemplates: {},
        },
        [clinic2Id]: {
            users: clinic2Users,
            medicines: clinic2Medicines,
            patients: clinic2Patients,
            suppliers: clinic2Suppliers,
            appointments: clinic2Appointments,
            bills: clinic2Bills,
            todos: [],
            chatMessages: [],
            notifications: [],
            hsnCodes: { ...hsnCodesForClinic },
            pharmacyInfo: {
                clinicId: clinic2Id, name: 'Max Care Pharma', organizationType: 'Pharmacy' as const,
                address: "456 Cure Avenue, Health Nagar", city: "Pune", pincode: "411001", phone: "+91 (20) 8765-4321",
                gstin: "27FGHIJ5678K1Z9", drugLicense: "DL87654321", isGstEnabled: true,
            },
            sharedLinks: [],
            supplierMappingTemplates: {},
        },
    };

    return { clinics, dataByClinicId, dailySalesData, superAdmins, banners, bannerInterests };
};