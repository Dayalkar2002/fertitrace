-- ============================================================================
-- FERTITRACE QR Code Tracking, Witnessing & Consumable Inventory Schema
-- Compliant with ISO 15189, ART Act 2022, and FertiTrace V1 QR Specifications
-- ============================================================================

-- 1. QR Master Table (Permanent QR records - NEVER DELETED)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FT_QR_Master')
BEGIN
    CREATE TABLE FT_QR_Master (
        QrId VARCHAR(60) NOT NULL PRIMARY KEY,                 -- e.g. FT-QR-2026-0001
        QrString NVARCHAR(500) NOT NULL,                        -- FT|V1|CL001|CASE...|CY...|SP...|...
        SystemCode VARCHAR(10) NOT NULL DEFAULT 'FT',
        QrVersion VARCHAR(10) NOT NULL DEFAULT 'V1',
        ClinicId VARCHAR(30) NOT NULL DEFAULT 'CL001',
        PatientId INT NULL,
        CaseId VARCHAR(60) NOT NULL,                            -- De-identified Case/Patient ID
        CycleId VARCHAR(60) NOT NULL,                           -- Cycle identifier
        SpecimenId VARCHAR(60) NOT NULL,                        -- Core Specimen tracking key
        SpecimenType VARCHAR(40) NOT NULL,                      -- EMBRYO, SEMEN, OOCYTES
        ContainerType VARCHAR(60) NOT NULL,                     -- e.g. 01 to 13 / DISH, STRAW, CRYOVIAL
        ContainerUnitNo VARCHAR(20) NOT NULL DEFAULT '01',
        ProcedureName VARCHAR(80) NULL,                         -- e.g. IVF CYCLE, ICSI, FET CYCLE
        CompactCode VARCHAR(100) NULL,                          -- Alphanumeric label code (e.g. 56101041220BA52C9GOBL...)
        LabelSize VARCHAR(10) NOT NULL DEFAULT 'A',             -- A, B, C, D, E, F
        StorageLocation NVARCHAR(200) NULL,                     -- Tank/Canister/Cane/Goblet/Visotube code
        Checksum VARCHAR(50) NOT NULL,
        Status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',           -- ACTIVE, IN_PROCESS, CRYOPRESERVED, THAWED, TRANSFERRED, DISPOSED, CANCELLED
        IsPreassigned BIT NOT NULL DEFAULT 0,                   -- 1 if pre-barcoded market consumable
        PreassignedVendorCode NVARCHAR(120) NULL,
        CreatedBy NVARCHAR(100) NOT NULL DEFAULT 'System',
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        ClosedAt DATETIME NULL,
        CloseReason NVARCHAR(250) NULL,
        Notes NVARCHAR(500) NULL
    );

    CREATE INDEX IX_FT_QR_Master_SpecimenId ON FT_QR_Master (SpecimenId);
    CREATE INDEX IX_FT_QR_Master_CaseId ON FT_QR_Master (CaseId);
    CREATE INDEX IX_FT_QR_Master_CycleId ON FT_QR_Master (CycleId);
    CREATE INDEX IX_FT_QR_Master_Status ON FT_QR_Master (Status);
END;
GO

-- 2. Specimen Master (Biological material and lifecycle status)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FT_Specimen_Master')
BEGIN
    CREATE TABLE FT_Specimen_Master (
        SpecimenId VARCHAR(60) NOT NULL PRIMARY KEY,
        PatientId INT NULL,
        CaseId VARCHAR(60) NOT NULL,
        CycleId VARCHAR(60) NOT NULL,
        SpecimenType VARCHAR(40) NOT NULL,                      -- EMBRYO, SEMEN, OOCYTES
        CurrentStatus VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
        CurrentContainer VARCHAR(60) NOT NULL,
        ContainerUnitNo VARCHAR(20) NOT NULL DEFAULT '01',
        Stage VARCHAR(50) NOT NULL DEFAULT 'OPU',               -- OPU, OOCYTE, FERTILISATION, ZYGOTE, EMBRYO, BIOPSY, CRYO, THAW, ET
        ParentSpecimenId VARCHAR(60) NULL,                      -- Lineage reference (e.g. Oocyte -> Embryo)
        CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME NOT NULL DEFAULT GETDATE()
    );

    CREATE INDEX IX_FT_Specimen_Master_Patient ON FT_Specimen_Master (PatientId, CycleId);
END;
GO

-- 3. Traceability Event / Audit Log (Immutable, append-only log of every scan)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FT_Traceability_Audit_Log')
BEGIN
    CREATE TABLE FT_Traceability_Audit_Log (
        LogId BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        SpecimenId VARCHAR(60) NOT NULL,
        QrString NVARCHAR(500) NULL,
        WorkstationId VARCHAR(50) NULL,                         -- WS-LAF-01, WS-ICSI-01, LF-1, CRYOCAN
        EventType VARCHAR(60) NOT NULL,                         -- SCAN_VALIDATE, OPU_COLLECTION, INSEMINATION, CRYO_PLUNGE, THAW, ET, DISPOSAL, CANCEL
        VerificationResult VARCHAR(30) NOT NULL,                -- MATCH_OK, MISMATCH, BLOCKED, OVERRIDE
        PrimaryUser NVARCHAR(100) NOT NULL,
        WitnessUser NVARCHAR(100) NULL,
        Details NVARCHAR(MAX) NULL,
        Timestamp DATETIME NOT NULL DEFAULT GETDATE(),
        DigitalSignature VARCHAR(128) NULL
    );

    CREATE INDEX IX_FT_Audit_Specimen ON FT_Traceability_Audit_Log (SpecimenId);
    CREATE INDEX IX_FT_Audit_Timestamp ON FT_Traceability_Audit_Log (Timestamp DESC);
END;
GO

-- 4. Consumable Inventory Master
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FT_Consumable_Inventory')
BEGIN
    CREATE TABLE FT_Consumable_Inventory (
        ItemCode VARCHAR(20) NOT NULL PRIMARY KEY,              -- 01 to 13
        ItemName NVARCHAR(120) NOT NULL,
        Category VARCHAR(50) NOT NULL DEFAULT 'Lab Consumable',
        StockOnHand INT NOT NULL DEFAULT 200,
        AllocatedCount INT NOT NULL DEFAULT 0,
        ConsumedCount INT NOT NULL DEFAULT 0,
        UnitOfMeasure VARCHAR(20) NOT NULL DEFAULT 'PIECE',
        ReorderLevel INT NOT NULL DEFAULT 25,
        LastUpdated DATETIME NOT NULL DEFAULT GETDATE()
    );

    -- Seed 13 Consumable types from FertiTrace specifications
    INSERT INTO FT_Consumable_Inventory (ItemCode, ItemName, Category, StockOnHand, ReorderLevel)
    VALUES
        ('01', 'SEMEN CONTAINER JAR', 'Andrology', 250, 30),
        ('02', 'CONICAL TUBE', 'General Lab', 500, 50),
        ('03', 'FALCON TUBE 5ML', 'General Lab', 400, 40),
        ('04', 'APPENDROFF (EPPENDORF)', 'General Lab', 600, 60),
        ('05', 'IUI CATHETER', 'Clinical Transfer', 150, 20),
        ('06', 'FALCON TUBE 15ML', 'General Lab', 350, 35),
        ('07', 'PETRIDISH', 'Culture', 300, 30),
        ('08', 'CENTRE WELL', 'Culture', 300, 30),
        ('09', 'ICSI DISH', 'Micromanipulation', 250, 25),
        ('10', 'FOUR WELL', 'Culture', 300, 30),
        ('11', 'EMBRYO TRANSFER CATHETER', 'Clinical Transfer', 120, 15),
        ('12', 'VITRIFICATION STRAW', 'Cryopreservation', 450, 50),
        ('13', 'VITRIFICATION CRYOVIAL', 'Cryopreservation', 350, 40);
END;
GO

-- 5. Consumable Inventory Movements Log
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FT_Consumable_Movement')
BEGIN
    CREATE TABLE FT_Consumable_Movement (
        MovementId BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        ItemCode VARCHAR(20) NOT NULL,
        SpecimenId VARCHAR(60) NULL,
        CycleId VARCHAR(60) NULL,
        MovementType VARCHAR(40) NOT NULL,                      -- PRINT_ALLOCATE, PROCEDURE_CONSUMED, RESTOCK, DISCARDED
        Quantity INT NOT NULL,
        DoneBy NVARCHAR(100) NOT NULL,
        Notes NVARCHAR(250) NULL,
        Timestamp DATETIME NOT NULL DEFAULT GETDATE()
    );

    CREATE INDEX IX_FT_Consumable_Movements ON FT_Consumable_Movement (ItemCode, Timestamp DESC);
END;
GO
