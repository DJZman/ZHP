IF OBJECT_ID('dbo.FranchiseVoices','U') IS NULL
CREATE TABLE dbo.FranchiseVoices (
    FranchiseVoiceID INT IDENTITY PRIMARY KEY,
    FranchiseID INT NOT NULL FOREIGN KEY REFERENCES dbo.Franchises(FranchiseID),
    CanonicalKey NVARCHAR(100) NOT NULL,
    ElevenVoiceID NVARCHAR(200) NOT NULL,
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
)

CREATE INDEX IX_FranchiseVoices_FranchiseKey ON dbo.FranchiseVoices(FranchiseID, CanonicalKey)
