IF OBJECT_ID('dbo.Franchises','U') IS NULL
CREATE TABLE dbo.Franchises (
    FranchiseID   INT IDENTITY PRIMARY KEY,
    Title         NVARCHAR(200),
    Description   NVARCHAR(MAX),
    BibleJson     NVARCHAR(MAX),
    Version       INT NOT NULL DEFAULT 1,
    CreatedAt     DATETIME2 DEFAULT SYSUTCDATETIME()
)

IF COL_LENGTH('dbo.Projects','FranchiseID') IS NULL
ALTER TABLE dbo.Projects ADD FranchiseID INT NULL
    CONSTRAINT FK_Projects_Franchises FOREIGN KEY (FranchiseID) REFERENCES dbo.Franchises(FranchiseID)

IF COL_LENGTH('dbo.Projects','FranchiseVersion') IS NULL
ALTER TABLE dbo.Projects ADD FranchiseVersion INT NULL

IF COL_LENGTH('dbo.Projects','BibleJsonSnapshot') IS NULL
ALTER TABLE dbo.Projects ADD BibleJsonSnapshot NVARCHAR(MAX) NULL

IF COL_LENGTH('dbo.Characters','FranchiseID') IS NULL
ALTER TABLE dbo.Characters ADD FranchiseID INT NULL
    CONSTRAINT FK_Characters_Franchises FOREIGN KEY (FranchiseID) REFERENCES dbo.Franchises(FranchiseID)

IF COL_LENGTH('dbo.Characters','CanonicalKey') IS NULL
ALTER TABLE dbo.Characters ADD CanonicalKey NVARCHAR(100) NULL
