// api/apiService.ts

import { dbGet, dbSet } from '../utils/db';

const API_BASE_URL = 'https://medzillo-backend.onrender.com'; // Your live URL should be here

async function getAuthToken() {
    return await dbGet<string>('medzillo_authToken');
}

async function fetchApi(path: string, options: RequestInit = {}) {
    const token = await getAuthToken();
    
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unexpected error occurred.' }));
        console.error('API Error:', errorData);
        throw new Error(errorData.message || 'Network response was not ok');
    }
    
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    } else {
        return {};
    }
}

// --- Auth ---
export const login = (email: any, password: any) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const sendRegistrationOtp = (data: any) => fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(data) });
export const verifyOtpAndRegister = (email: any, otp: any, registrationData: any) => fetchApi('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp, ...registrationData }) });
export const sendPasswordResetOtp = (email: any) => fetchApi('/auth/forgot-password/send-otp', { method: 'POST', body: JSON.stringify({ email }) });
export const verifyPasswordResetOtp = (email: any, otp: any) => fetchApi('/auth/forgot-password/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) });
export const resetPassword = (email: any, newPassword: any) => fetchApi('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, newPassword }) });


// --- Data Fetching ---
export const fetchInitialData = () => {
    // This endpoint should ideally return patients with their consultations.
    // The frontend now works around this, but it's a note for a future backend optimization.
    const paths = ['/users', '/patients', '/medicines', '/suppliers', '/appointments', '/bills', '/clinic/profile', '/utilities/todos', '/utilities/chat/messages'];
    return Promise.all(paths.map(path => fetchApi(path)));
};

// --- Generic CRUD ---
const createCRUDApi = (endpoint: string) => ({
    getAll: () => fetchApi(`/${endpoint}`),
    getById: (id: string) => fetchApi(`/${endpoint}/${id}`),
    create: (data: any) => fetchApi(`/${endpoint}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchApi(`/${endpoint}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/${endpoint}/${id}`, { method: 'DELETE' }),
});

export const usersApi = createCRUDApi('users');
export const patientsApi = createCRUDApi('patients');
export const suppliersApi = createCRUDApi('suppliers');
export const medicinesApi = createCRUDApi('medicines');
export const appointmentsApi = createCRUDApi('appointments');
export const billsApi = createCRUDApi('bills');
export const todosApi = createCRUDApi('utilities/todos');

// --- Specific API calls ---
export const updateClinicProfile = (data: any) => fetchApi('/clinic/profile', { method: 'PUT', body: JSON.stringify(data) });
export const addBatch = (medicineId: any, batchData: any) => fetchApi(`/medicines/${medicineId}/batches`, { method: 'POST', body: JSON.stringify(batchData) });
export const deleteBatch = (medicineId: any, batchId: any) => fetchApi(`/medicines/${medicineId}/batches/${batchId}`, { method: 'DELETE' });
export const updateAppointmentStatus = (id: any, status: any) => fetchApi(`/appointments/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
export const sendMessage = (receiverId: any, content: any) => fetchApi('/utilities/chat/messages', { method: 'POST', body: JSON.stringify({ receiverId, content }) });
export const markMessagesAsRead = (senderId: any) => fetchApi('/utilities/chat/mark-read', { method: 'POST', body: JSON.stringify({ senderId }) });
export const createSharedLink = (appointmentId: any) => fetchApi('/utilities/share', { method: 'POST', body: JSON.stringify({ appointmentId }) });
export const bulkImportPatients = (data: any) => fetchApi('/patients/import', { method: 'POST', body: JSON.stringify(data) });
export const addVitals = (appointmentId: any, vitals: any) => fetchApi(`/appointments/${appointmentId}/vitals`, { method: 'POST', body: JSON.stringify({ vitals }) });

// --- UPDATED FUNCTIONS ---

// Corresponds to: POST /api/v1/consultations
// This now takes a single object, which matches the backend controller.
export const saveConsultation = (consultationData: any) =>
  fetchApi(`/consultations`, {
    method: 'POST',
    body: JSON.stringify(consultationData),
  });

// Corresponds to: POST /api/v1/consultations/:consultationId/schedule
export const scheduleAppointmentFromReview = (consultationId: string, appointmentData: any) =>
  fetchApi(`/consultations/${consultationId}/schedule`, {
    method: 'POST',
    body: JSON.stringify(appointmentData),
  });

// Corresponds to: POST /api/v1/medicines/import
export const importStock = (items: any[]) =>
  fetchApi('/medicines/import', {
    method: 'POST',
    body: JSON.stringify(items),
  });