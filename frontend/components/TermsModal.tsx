import React from 'react';
import { CloseIcon } from './icons';

interface TermsModalProps {
    onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
                    <h3 className="text-xl font-semibold text-brand-secondary dark:text-slate-100">Terms and Conditions of Service</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-2 text-slate-700 dark:text-slate-300 text-sm">
                    <p className="font-semibold">Last Updated: July 06, 2025</p>
                    <p className="font-bold">ATTENTION: THIS IS A LEGALLY BINDING AGREEMENT. CAREFULLY READ THESE TERMS AND CONDITIONS IN THEIR ENTIRETY BEFORE ACCESSING, REGISTERING FOR, BROWSING, OR UTILIZING THE MEDZILLO PLATFORM. YOUR CONTINUED ENGAGEMENT WITH OR USE OF THE MEDZILLO PLATFORM CONSTITUTES YOUR UNQUALIFIED ACKNOWLEDGMENT, COMPREHENSION, AND IRREVOCABLE AGREEMENT TO BE BOUND BY ALL PROVISIONS SET FORTH HEREIN, INCLUDING BUT NOT LIMITED TO, ALL ABSOLUTE DISCLAIMERS OF WARRANTIES, UNCONDITIONAL WAIVERS OF RIGHTS, AND EXTENSIVE LIMITATIONS OF LIABILITY. SHOULD YOU DISAGREE WITH ANY PART OF THESE TERMS AND CONDITIONS, OR LACK THE AUTHORITY TO BIND YOURSELF OR YOUR ENTITY, YOU ARE STRICTLY PROHIBITED FROM USING OR CONTINUING TO USE THE MEDZILLO PLATFORM.</p>
                    <p className="font-semibold">CRITICAL NOTICE REGARDING MODIFICATIONS: These Terms and Conditions are subject to rigorous and periodic modification by Medzillo at its sole and absolute discretion, without specific individual notice to You, as comprehensively detailed in Section 15. Your uninterrupted and continued use of the Medzillo Platform subsequent to the posting of any revisions shall be construed as Your unequivocal and binding acceptance of such newly revised Terms and Conditions. It is Your express, non-delegable responsibility to perpetually and assiduously review these Terms and Conditions for any and all updates, modifications, or amendments.</p>
                    
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 pt-2">1. DEFINITIONS AND INTERPRETATION</h2>
                    <p>For the avoidance of doubt and for the comprehensive understanding of this Agreement, the following terms shall bear the meanings ascribed to them hereunder:</p>
                    <ul className="list-disc list-inside space-y-2 pl-4">
                        <li><strong>"Account"</strong> refers to the unique, individualized user account created and maintained by a specific User on the Medzillo Platform, accessible through designated login credentials.</li>
                        <li><strong>"Affiliates"</strong> means, with respect to Medzillo, any entity that directly or indirectly controls, is controlled by, or is under common control with Medzillo.</li>
                        <li><strong>"Applicable Law"</strong> means, collectively and without limitation, any and all statutes, laws, ordinances, rules, regulations, judgments, decrees, injunctions, orders, directives, guidelines, policies, requirements, common law, equity, or other governmental restriction or any similar form of decision, interpretation, or ruling of or by any governmental, judicial, quasi-judicial, or regulatory authority having competent jurisdiction over the subject matter hereof, whether currently in effect or hereafter promulgated, enacted, or implemented.</li>
                        <li><strong>"Communication Features"</strong> refers to any functionalities within the Medzillo Platform that enable messaging, notification delivery, or other forms of interaction between Users, solely for the purpose of facilitating queue and appointment management.</li>
                        <li><strong>"Content"</strong> refers to any and all information, data, text, software, music, sound, photographs, graphics, video, messages, tags, digital assets, profiles, professional credentials, schedules, notes, listings, and any other materials, whether in text, audio, visual, or other format, that You (or any third party acting on Your behalf) upload, publish, transmit, display, or otherwise make available on, through, or in connection with the Medzillo Platform.</li>
                        <li><strong>"Doctor"</strong> refers to an individual who is a duly qualified, currently registered, and licensed medical practitioner, clinician, specialist, or healthcare provider recognized by the competent medical councils and regulatory bodies in India, who registers for and utilizes the Medzillo Platform exclusively for the management of patient queues and appointments for offline physical consultations, and for administrative functionalities strictly incidental thereto.</li>
                        <li><strong>"Medical Representative"</strong> (also referred to as "Med Rep") refers to an individual, acting in a professional capacity, who represents a pharmaceutical company, medical device manufacturer, healthcare product supplier, or other related entity, and who registers for and utilizes the Medzillo Platform exclusively for the purpose of scheduling and managing professional interactions or meetings with Doctors, and for the limited exchange of professional information related to products or services they represent.</li>
                        <li><strong>"Offline Consultation"</strong> means a physical, in-person consultation between a Doctor and a Patient occurring at the Doctor's clinic, hospital, or other designated physical premises, for which the Medzillo Platform is used solely to manage the patient queue and/or appointment scheduling.</li>
                        <li><strong>"Patient"</strong> refers to an individual who registers for and utilizes the Medzillo Platform exclusively for the purpose of booking, managing, or monitoring their position in a queue for an Offline Consultation with a Doctor, and for receiving notifications related to such queues or appointments.</li>
                        <li><strong>"Personal Data"</strong> means any information, whether true or not, that relates to an identified or identifiable natural person ('data principal'), including but not limited to, name, address, contact details, identification numbers, and Sensitive Personal Data, as defined under Applicable Law.</li>
                        <li><strong>"Services"</strong> refers exclusively to the queue management system, appointment booking functionalities, and limited Communication Features offered by Medzillo via the Medzillo Platform, solely for the purpose of facilitating Offline Consultations.</li>
                        <li><strong>"User," "You," or "Your"</strong> refers to any and all individuals or entities accessing, browsing, registering for, or utilizing the Medzillo Platform, encompassing, without limitation, Doctors, Patients, and Medical Representatives.</li>
                    </ul>

                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 pt-2">2. ACCEPTANCE OF TERMS AND SCOPE OF AGREEMENT</h2>
                    <p>2.1. By clicking "I Accept", "Register", "Sign Up", "Proceed", or any functionally equivalent button, or by the mere act of accessing, browsing, or utilizing any component, feature, or service of the Medzillo Platform, You irrevocably and unconditionally affirm that You have meticulously read, fully comprehended, and legally assented to be bound by the entirety of these Terms and Conditions, alongside Medzillo's Privacy Policy, and any and all other policies, guidelines, or additional terms that are referenced herein or conspicuously displayed and made accessible on the Medzillo Platform.</p>
                    <p>2.2. In the event that You are utilizing the Medzillo Platform on behalf of a distinct legal entity (e.g., a hospital, clinic, medical group, pharmaceutical company, or other organization), You hereby represent and warrant with absolute certainty that You possess the requisite legal authority and full power to bind that specific entity to the entirety of these Terms and Conditions. In such a scenario, the terms "You" and "Your" shall be construed to refer collectively to both Yourself as an individual and the legal entity You unequivocally represent, making both jointly and severally liable hereunder.</p>

                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 pt-2">3. ELIGIBILITY AND ACCOUNT REGISTRATION FORMALITIES</h2>
                    <p>3.1. <strong>Age and Legal Capacity Requirement:</strong> The Medzillo Platform is meticulously designed and intended for use exclusively by individuals who have attained the full legal age of majority, being at least eighteen (18) years of age... Should You be under the age of eighteen (18) years, Your engagement with the Medzillo Platform is strictly conditional upon the explicit supervision and unequivocal consent of a parent or legal guardian.</p>
                    <p>3.2. <strong>Mandatory Account Creation and Information Accuracy:</strong> You shall be unequivocally required to register for, and maintain, an active and valid Account. You hereby covenant and agree to furnish and perpetually maintain accurate, truthful, current, complete, and verifiable information.</p>
                    
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 pt-2">4. NATURE AND EXPLICIT LIMITATIONS OF MEDZILLO SERVICES: ABSOLUTE MEDICAL DISCLAIMER</h2>
                    <p>4.1. <strong>Medzillo as a Pure Technology Facilitator – No Healthcare Provision:</strong> The Medzillo Platform is a sophisticated and highly specialized technology platform engineered and designed with the singular and exclusive objective of facilitating the administrative aspects of queue management and appointment scheduling for offline, physical consultations between Patients and Doctors. MEDZILLO IS SOLELY, EXCLUSIVELY, AND UNAMBIGUOUSLY A TECHNOLOGY PLATFORM FACILITATOR AND DOES NOT, UNDER ANY CIRCUMSTANCES WHATSOEVER, PROVIDE, RENDER, ENDORSE, GUARANTEE, OR ASSUME RESPONSIBILITY FOR ANY MEDICAL ADVICE, CLINICAL DIAGNOSIS, PATIENT TREATMENT, PHARMACEUTICAL PRESCRIPTION, OR ANY OTHER FORM OF HEALTHCARE SERVICE OR PROFESSIONAL MEDICAL CARE WHATSOEVER.</p>

                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 pt-2">5. SPECIFIC TERMS AND CONDITIONS APPLICABLE TO PATIENTS</h2>
                    <p>5.1. <strong>Exclusively for Offline Queue and Appointment Management:</strong> As a Patient, Your permissible use of the Medzillo Platform is strictly and exclusively confined to the administrative functionalities for arranging Offline Consultations with Doctors.</p>
                    <p>5.2. <strong>Patient's Sole Responsibility for Information Accuracy and Consequences:</strong> You, as the Patient, bear the sole, absolute, and unmitigated responsibility for ensuring the veracity, accuracy, completeness, currency, and truthfulness of all Personal Data and Sensitive Personal Data that You provide or transmit.</p>

                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 pt-2">6. SPECIFIC TERMS AND CONDITIONS APPLICABLE TO DOCTORS</h2>
                    <p>6.1. <strong>Doctor's Absolute and Sole Professional Responsibility:</strong> You, as a Doctor, hereby represent and warrant that You are a duly qualified, currently registered, and actively licensed medical practitioner... MEDZILLO IS NOT RESPONSIBLE FOR YOUR PROFESSIONAL CONDUCT, CLINICAL JUDGMENTS, MEDICAL MALPRACTICE, NEGLIGENT ACTS OR OMISSIONS, OR THE OUTCOMES OF ANY MEDICAL SERVICES YOU RENDER OR FAIL TO RENDER TO PATIENTS.</p>

                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 pt-2">7. SPECIFIC TERMS AND CONDITIONS APPLICABLE TO MEDICAL REPRESENTATIVES</h2>
                    <p>7.3. <strong>Absolute Prohibition on Patient Data Access:</strong> You, as a Medical Representative, unequivocally acknowledge, understand, and expressly agree that the Medzillo Platform DOES NOT, AND SHALL NOT, GRANT YOU ANY ACCESS WHATSOEVER TO ANY PATIENT PERSONAL DATA OR SENSITIVE PERSONAL DATA.</p>

                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 pt-2">8. ABSOLUTELY PROHIBITED USES AND CONDUCT</h2>
                    <p>You unequivocally covenant and agree that You shall not utilize the Medzillo Platform for any purpose that is unlawful, explicitly prohibited by these Terms and Conditions, or in any manner whatsoever harmful, detrimental, disruptive, or damaging.</p>

                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 pt-2">9. INTELLECTUAL PROPERTY RIGHTS: OWNERSHIP AND LICENSES</h2>
                    <p>The Medzillo Platform, in its entirety, is the exclusive and sole property of Medzillo (and/or its licensors) and are meticulously protected by Indian and international Intellectual Property Rights laws.</p>

                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 pt-2">10. ABSOLUTE DISCLAIMER OF WARRANTIES</h2>
                    <p>THE MEDZILLO PLATFORM IS FURNISHED TO YOU ON AN "AS IS," "WHERE IS," AND "AS AVAILABLE" BASIS, WITHOUT ANY WARRANTIES, REPRESENTATIONS, OR GUARANTEES OF ANY KIND WHATSOEVER.</p>
                    
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 pt-2">11. ABSOLUTE LIMITATION OF LIABILITY AND DAMAGES</h2>
                    <p>IN NO EVENT SHALL MEDZILLO BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE, CONSEQUENTIAL, OR MULTIPLIED DAMAGES WHATSOEVER.</p>
                    
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 pt-2">12. COMPREHENSIVE INDEMNIFICATION OBLIGATION</h2>
                    <p>You hereby agree to irrevocably and perpetually defend, indemnify, and hold harmless Medzillo and its Indemnified Parties from and against any and all claims, demands, actions, suits, proceedings, liabilities, damages, and losses.</p>
                    
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 pt-2">13. THIRD-PARTY LINKS AND EXTERNAL SERVICES</h2>
                    <p>The Medzillo Platform may contain links to third-party websites or services that are not owned or controlled by Medzillo. Medzillo has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third-party websites or services.</p>
                    
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 pt-2">14. TERMINATION OF ACCOUNT AND ACCESS</h2>
                    <p>You possess the right to terminate Your Account at any time. Medzillo reserves the right to suspend or terminate Your Account at its sole discretion, without notice, for conduct that it believes violates these Terms and Conditions.</p>
                    
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 pt-2">15. ABSOLUTE RIGHT TO MODIFY TERMS AND CONDITIONS</h2>
                    <p>Medzillo reserves and retains the absolute, unfettered, and unilateral right, at its sole and exclusive discretion, to modify, amend, replace, or update these Terms and Conditions at any time.</p>
                    
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 pt-2">16. GOVERNING LAW AND MANDATORY DISPUTE RESOLUTION</h2>
                    <p>These Terms and Conditions shall be exclusively governed by, interpreted, and construed in strict accordance with the substantive laws of India. Any disputes shall be exclusively and finally settled by binding arbitration in Chennai, Tamil Nadu, India.</p>
                    
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 pt-2">22. GRIEVANCE REDRESSAL MECHANISM</h2>
                    <p>In strict adherence to and compliance with Applicable Law, including specifically the Digital Personal Data Protection Act, 2023 (DPDP Act), Medzillo is firmly committed to establishing and maintaining a robust, transparent, and efficient mechanism for addressing Your questions, concerns, complaints, clarifications, or grievances. Contact our designated Grievance Officer:</p>
                    <div className="pl-4">
                        <p><strong>Grievance Officer:</strong> Raghul Anandan</p>
                        <p><strong>Email:</strong> raghul@medzillo.com</p>
                        <p><strong>Phone:</strong> 97100 79100</p>
                        <p><strong>Location:</strong> Chennai, Tamil Nadu, India.</p>
                    </div>
                    
                    <p className="font-bold pt-3">BY CONTINUING TO ACCESS, BROWSE, REGISTER FOR, OR USE THE MEDZILLO PLATFORM, YOU IRREVOCABLY AFFIRM YOUR COMPREHENSION OF, AND UNCONDITIONAL AGREEMENT TO BE BOUND BY, THESE EXHAUSTIVE TERMS AND CONDITIONS OF SERVICE IN THEIR ENTIRETY.</p>
                </div>
                 <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end shrink-0">
                    <button type="button" onClick={onClose} className="px-6 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover font-semibold">Done</button>
                </div>
            </div>
        </div>
    );
};