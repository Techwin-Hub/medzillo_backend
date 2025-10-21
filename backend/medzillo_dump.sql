--
-- PostgreSQL database dump
--

\restrict WH6Shd70t27gBTsWjm3ZasjTkf5jMK5a2gBUE0w1lvYGuHubL8Qadcjh88Tn2ew

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Appointment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Appointment" (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "doctorId" text NOT NULL,
    "patientName" text,
    "doctorName" text,
    "startTime" timestamp(3) without time zone NOT NULL,
    status text NOT NULL
);


ALTER TABLE public."Appointment" OWNER TO postgres;

--
-- Name: Batch; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Batch" (
    id text NOT NULL,
    "medicineId" text NOT NULL,
    "supplierId" text NOT NULL,
    "batchNumber" text NOT NULL,
    "purchaseDate" text NOT NULL,
    "expiryDate" text NOT NULL,
    "packQuantity" integer NOT NULL,
    "looseQuantity" integer NOT NULL,
    "purchaseRate" double precision NOT NULL,
    "sellingRate" double precision NOT NULL,
    "supplierName" text NOT NULL,
    "packSize" integer NOT NULL
);


ALTER TABLE public."Batch" OWNER TO postgres;

--
-- Name: Bill; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Bill" (
    id text NOT NULL,
    "billNumber" text NOT NULL,
    "clinicId" text NOT NULL,
    "patientId" text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "subTotal" double precision NOT NULL,
    "totalAmount" double precision NOT NULL,
    "paymentMode" text NOT NULL,
    "appointmentId" text,
    "taxDetails" jsonb NOT NULL
);


ALTER TABLE public."Bill" OWNER TO postgres;

--
-- Name: BillItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BillItem" (
    id text NOT NULL,
    "billId" text NOT NULL,
    "itemType" text NOT NULL,
    "itemName" text NOT NULL,
    quantity integer NOT NULL,
    rate double precision NOT NULL,
    amount double precision NOT NULL,
    "gstRate" double precision NOT NULL,
    "isRemovable" boolean NOT NULL,
    "medicineId" text,
    "hsnCode" text,
    "batchNumber" text
);


ALTER TABLE public."BillItem" OWNER TO postgres;

--
-- Name: ChatMessage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ChatMessage" (
    id text NOT NULL,
    "clinicId" text NOT NULL,
    "senderId" text NOT NULL,
    "receiverId" text NOT NULL,
    content text NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    read boolean DEFAULT false NOT NULL
);


ALTER TABLE public."ChatMessage" OWNER TO postgres;

--
-- Name: Clinic; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Clinic" (
    id text NOT NULL,
    name text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Clinic" OWNER TO postgres;

--
-- Name: Consultation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Consultation" (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "doctorId" text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "chiefComplaint" text NOT NULL,
    diagnosis text NOT NULL,
    notes text,
    "nextReviewDate" text,
    "appointmentId" text,
    temperature double precision,
    "bloodPressure" text,
    pulse integer,
    weight double precision,
    height double precision,
    "oxygenSaturation" double precision
);


ALTER TABLE public."Consultation" OWNER TO postgres;

--
-- Name: Medicine; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Medicine" (
    id text NOT NULL,
    "clinicId" text NOT NULL,
    name text NOT NULL,
    manufacturer text NOT NULL,
    composition text NOT NULL,
    strength text NOT NULL,
    form text NOT NULL,
    "unitType" text NOT NULL,
    "hsnCode" text NOT NULL,
    "gstRate" double precision NOT NULL,
    "minStockLevel" integer NOT NULL,
    "totalStockInUnits" integer NOT NULL
);


ALTER TABLE public."Medicine" OWNER TO postgres;

--
-- Name: Patient; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Patient" (
    id text NOT NULL,
    "clinicId" text NOT NULL,
    name text NOT NULL,
    mobile text NOT NULL,
    dob text,
    gender text,
    address text,
    "bloodGroup" text,
    allergies text,
    "skippedVaccinations" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "vaccinationOverrides" jsonb DEFAULT '[]'::jsonb NOT NULL
);


ALTER TABLE public."Patient" OWNER TO postgres;

--
-- Name: PharmacyInfo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PharmacyInfo" (
    id text NOT NULL,
    "clinicId" text NOT NULL,
    name text NOT NULL,
    "organizationType" text NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    pincode text NOT NULL,
    phone text NOT NULL,
    gstin text NOT NULL,
    "drugLicense" text NOT NULL,
    "isGstEnabled" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."PharmacyInfo" OWNER TO postgres;

--
-- Name: PrescriptionItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PrescriptionItem" (
    id text NOT NULL,
    "consultationId" text NOT NULL,
    "medicineName" text NOT NULL,
    quantity integer NOT NULL,
    dosage text NOT NULL,
    duration text NOT NULL,
    notes text
);


ALTER TABLE public."PrescriptionItem" OWNER TO postgres;

--
-- Name: SharedLink; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SharedLink" (
    id text NOT NULL,
    "appointmentId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SharedLink" OWNER TO postgres;

--
-- Name: SuperAdmin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SuperAdmin" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role text DEFAULT 'SuperAdmin'::text NOT NULL
);


ALTER TABLE public."SuperAdmin" OWNER TO postgres;

--
-- Name: Supplier; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Supplier" (
    id text NOT NULL,
    "clinicId" text NOT NULL,
    name text NOT NULL,
    "contactPerson" text NOT NULL,
    mobile text NOT NULL,
    address text NOT NULL,
    gstin text,
    "paymentTerms" text
);


ALTER TABLE public."Supplier" OWNER TO postgres;

--
-- Name: TodoItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TodoItem" (
    id text NOT NULL,
    "doctorId" text NOT NULL,
    task text NOT NULL,
    "isCompleted" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "dueDate" text
);


ALTER TABLE public."TodoItem" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    "clinicId" text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role text NOT NULL,
    "consultationFee" double precision,
    specialty text
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: VaccinationRecord; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."VaccinationRecord" (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "vaccineName" text NOT NULL,
    dose text NOT NULL,
    "dateGiven" text NOT NULL,
    "batchNumber" text
);


ALTER TABLE public."VaccinationRecord" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Data for Name: Appointment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Appointment" (id, "patientId", "doctorId", "patientName", "doctorName", "startTime", status) FROM stdin;
cmguq28wd000312rv4h7kik7j	cmguq1zz4000112rv41frw69f	cmguj9a7w00035p6efefddlj7	sethu	Mittai brothers	2025-10-17 03:30:00	Scheduled
\.


--
-- Data for Name: Batch; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Batch" (id, "medicineId", "supplierId", "batchNumber", "purchaseDate", "expiryDate", "packQuantity", "looseQuantity", "purchaseRate", "sellingRate", "supplierName", "packSize") FROM stdin;
\.


--
-- Data for Name: Bill; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Bill" (id, "billNumber", "clinicId", "patientId", date, "subTotal", "totalAmount", "paymentMode", "appointmentId", "taxDetails") FROM stdin;
\.


--
-- Data for Name: BillItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."BillItem" (id, "billId", "itemType", "itemName", quantity, rate, amount, "gstRate", "isRemovable", "medicineId", "hsnCode", "batchNumber") FROM stdin;
\.


--
-- Data for Name: ChatMessage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ChatMessage" (id, "clinicId", "senderId", "receiverId", content, "timestamp", read) FROM stdin;
\.


--
-- Data for Name: Clinic; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Clinic" (id, name, "isActive", "createdAt") FROM stdin;
cmguis74l0000z912pneuwus9	Sethangi	t	2025-10-17 07:21:01.462
\.


--
-- Data for Name: Consultation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Consultation" (id, "patientId", "doctorId", date, "chiefComplaint", diagnosis, notes, "nextReviewDate", "appointmentId", temperature, "bloodPressure", pulse, weight, height, "oxygenSaturation") FROM stdin;
con_vitals_cmguq28wd000312rv4h7kik7j	cmguq1zz4000112rv41frw69f	cmguj9a7w00035p6efefddlj7	2025-10-17 10:45:01.957	Vitals Recorded	Vitals Recorded	\N	\N	cmguq28wd000312rv4h7kik7j	1	1	1	1	1	1
\.


--
-- Data for Name: Medicine; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Medicine" (id, "clinicId", name, manufacturer, composition, strength, form, "unitType", "hsnCode", "gstRate", "minStockLevel", "totalStockInUnits") FROM stdin;
\.


--
-- Data for Name: Patient; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Patient" (id, "clinicId", name, mobile, dob, gender, address, "bloodGroup", allergies, "skippedVaccinations", "vaccinationOverrides") FROM stdin;
cmguq1zz4000112rv41frw69f	cmguis74l0000z912pneuwus9	sethu	9443410151	17-04-2003	Male	477/1	A1+ve		[]	[]
\.


--
-- Data for Name: PharmacyInfo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PharmacyInfo" (id, "clinicId", name, "organizationType", address, city, pincode, phone, gstin, "drugLicense", "isGstEnabled") FROM stdin;
cmguis78x0003z9122b32whf2	cmguis74l0000z912pneuwus9	Sethangi	Clinic							t
\.


--
-- Data for Name: PrescriptionItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PrescriptionItem" (id, "consultationId", "medicineName", quantity, dosage, duration, notes) FROM stdin;
\.


--
-- Data for Name: SharedLink; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SharedLink" (id, "appointmentId", "expiresAt") FROM stdin;
\.


--
-- Data for Name: SuperAdmin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SuperAdmin" (id, name, email, password, role) FROM stdin;
cmguiozk800007qkpuu2840i5	Super Admin	superadmin@medzillo.com	$2a$10$rltfPgWNTHXVeLp.L3uPGOBXMZhQKAQZn6TUiPhoVi4W7m2gKNw82	SuperAdmin
\.


--
-- Data for Name: Supplier; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Supplier" (id, "clinicId", name, "contactPerson", mobile, address, gstin, "paymentTerms") FROM stdin;
cmgujd3ut00085p6eilg5whon	cmguis74l0000z912pneuwus9	Early Bird Sale	sethu	9443410151	gwuifuwh	ALQPK678LK452TH	30 Days
\.


--
-- Data for Name: TodoItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TodoItem" (id, "doctorId", task, "isCompleted", "createdAt", "dueDate") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, "clinicId", name, email, password, role, "consultationFee", specialty) FROM stdin;
cmguis74m0001z912kmqypnrf	cmguis74l0000z912pneuwus9	mathangi	sethuramanvr046@gmail.com	$2a$10$aSzLtEFf3JhjHL//s63bB.PAgXHz9868j5B54qTyjCgwuHG5L3Gx6	Admin	\N	\N
cmguj9a7w00035p6efefddlj7	cmguis74l0000z912pneuwus9	Mittai brothers	techwin.projects@gmail.com	$2a$10$fnj9n0UjCWXJv5E/NbRxVuwvtq25v1Z258Ye51L0UW.BhT7QazbLC	Doctor	100	MBBS
\.


--
-- Data for Name: VaccinationRecord; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."VaccinationRecord" (id, "patientId", "vaccineName", dose, "dateGiven", "batchNumber") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
3439d683-e745-4380-ac32-ac61e57c21b8	b4561577e6a75eafcd0e00aa0e44a6c4a38e396ea0eed963b4bba6e753458b93	2025-10-17 12:48:31.061337+05:30	20251017071830_add_super_admin_role	\N	\N	2025-10-17 12:48:30.976409+05:30	1
\.


--
-- Name: Appointment Appointment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_pkey" PRIMARY KEY (id);


--
-- Name: Batch Batch_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Batch"
    ADD CONSTRAINT "Batch_pkey" PRIMARY KEY (id);


--
-- Name: BillItem BillItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BillItem"
    ADD CONSTRAINT "BillItem_pkey" PRIMARY KEY (id);


--
-- Name: Bill Bill_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bill"
    ADD CONSTRAINT "Bill_pkey" PRIMARY KEY (id);


--
-- Name: ChatMessage ChatMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChatMessage"
    ADD CONSTRAINT "ChatMessage_pkey" PRIMARY KEY (id);


--
-- Name: Clinic Clinic_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Clinic"
    ADD CONSTRAINT "Clinic_pkey" PRIMARY KEY (id);


--
-- Name: Consultation Consultation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Consultation"
    ADD CONSTRAINT "Consultation_pkey" PRIMARY KEY (id);


--
-- Name: Medicine Medicine_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Medicine"
    ADD CONSTRAINT "Medicine_pkey" PRIMARY KEY (id);


--
-- Name: Patient Patient_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Patient"
    ADD CONSTRAINT "Patient_pkey" PRIMARY KEY (id);


--
-- Name: PharmacyInfo PharmacyInfo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PharmacyInfo"
    ADD CONSTRAINT "PharmacyInfo_pkey" PRIMARY KEY (id);


--
-- Name: PrescriptionItem PrescriptionItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PrescriptionItem"
    ADD CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY (id);


--
-- Name: SharedLink SharedLink_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SharedLink"
    ADD CONSTRAINT "SharedLink_pkey" PRIMARY KEY (id);


--
-- Name: SuperAdmin SuperAdmin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SuperAdmin"
    ADD CONSTRAINT "SuperAdmin_pkey" PRIMARY KEY (id);


--
-- Name: Supplier Supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Supplier"
    ADD CONSTRAINT "Supplier_pkey" PRIMARY KEY (id);


--
-- Name: TodoItem TodoItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TodoItem"
    ADD CONSTRAINT "TodoItem_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: VaccinationRecord VaccinationRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."VaccinationRecord"
    ADD CONSTRAINT "VaccinationRecord_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Appointment_doctorId_startTime_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Appointment_doctorId_startTime_idx" ON public."Appointment" USING btree ("doctorId", "startTime");


--
-- Name: Batch_medicineId_batchNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Batch_medicineId_batchNumber_key" ON public."Batch" USING btree ("medicineId", "batchNumber");


--
-- Name: Bill_appointmentId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Bill_appointmentId_key" ON public."Bill" USING btree ("appointmentId");


--
-- Name: Bill_billNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Bill_billNumber_key" ON public."Bill" USING btree ("billNumber");


--
-- Name: Consultation_appointmentId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Consultation_appointmentId_key" ON public."Consultation" USING btree ("appointmentId");


--
-- Name: Patient_clinicId_name_mobile_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Patient_clinicId_name_mobile_key" ON public."Patient" USING btree ("clinicId", name, mobile);


--
-- Name: PharmacyInfo_clinicId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PharmacyInfo_clinicId_key" ON public."PharmacyInfo" USING btree ("clinicId");


--
-- Name: SharedLink_appointmentId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SharedLink_appointmentId_key" ON public."SharedLink" USING btree ("appointmentId");


--
-- Name: SuperAdmin_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SuperAdmin_email_key" ON public."SuperAdmin" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Appointment Appointment_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Appointment Appointment_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Batch Batch_medicineId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Batch"
    ADD CONSTRAINT "Batch_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES public."Medicine"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Batch Batch_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Batch"
    ADD CONSTRAINT "Batch_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public."Supplier"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BillItem BillItem_billId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BillItem"
    ADD CONSTRAINT "BillItem_billId_fkey" FOREIGN KEY ("billId") REFERENCES public."Bill"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Bill Bill_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bill"
    ADD CONSTRAINT "Bill_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES public."Appointment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Bill Bill_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bill"
    ADD CONSTRAINT "Bill_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public."Clinic"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Bill Bill_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bill"
    ADD CONSTRAINT "Bill_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChatMessage ChatMessage_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChatMessage"
    ADD CONSTRAINT "ChatMessage_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public."Clinic"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChatMessage ChatMessage_receiverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChatMessage"
    ADD CONSTRAINT "ChatMessage_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChatMessage ChatMessage_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChatMessage"
    ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Consultation Consultation_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Consultation"
    ADD CONSTRAINT "Consultation_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES public."Appointment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Consultation Consultation_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Consultation"
    ADD CONSTRAINT "Consultation_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Consultation Consultation_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Consultation"
    ADD CONSTRAINT "Consultation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Medicine Medicine_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Medicine"
    ADD CONSTRAINT "Medicine_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public."Clinic"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Patient Patient_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Patient"
    ADD CONSTRAINT "Patient_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public."Clinic"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PharmacyInfo PharmacyInfo_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PharmacyInfo"
    ADD CONSTRAINT "PharmacyInfo_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public."Clinic"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PrescriptionItem PrescriptionItem_consultationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PrescriptionItem"
    ADD CONSTRAINT "PrescriptionItem_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES public."Consultation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SharedLink SharedLink_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SharedLink"
    ADD CONSTRAINT "SharedLink_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES public."Appointment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Supplier Supplier_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Supplier"
    ADD CONSTRAINT "Supplier_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public."Clinic"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TodoItem TodoItem_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TodoItem"
    ADD CONSTRAINT "TodoItem_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public."Clinic"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: VaccinationRecord VaccinationRecord_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."VaccinationRecord"
    ADD CONSTRAINT "VaccinationRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict WH6Shd70t27gBTsWjm3ZasjTkf5jMK5a2gBUE0w1lvYGuHubL8Qadcjh88Tn2ew

