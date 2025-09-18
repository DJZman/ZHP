IF OBJECT_ID('dbo.Projects','U') IS NULL
CREATE TABLE dbo.Projects (
    ProjectID        INT IDENTITY PRIMARY KEY,
    Title            NVARCHAR(200),
    Premise          NVARCHAR(MAX),
    TargetDuration_s INT,
    Style            NVARCHAR(200),
    Genre            NVARCHAR(200),
    State            NVARCHAR(50),
    CreatedAt        DATETIME2 DEFAULT SYSUTCDATETIME()
)

IF OBJECT_ID('dbo.Scenes','U') IS NULL
CREATE TABLE dbo.Scenes (
    SceneID      INT IDENTITY PRIMARY KEY,
    ProjectID    INT NOT NULL FOREIGN KEY REFERENCES dbo.Projects(ProjectID),
    SceneOrder   INT,
    Summary      NVARCHAR(MAX),
    State        NVARCHAR(50),
    CreatedAt    DATETIME2 DEFAULT SYSUTCDATETIME()
)

IF OBJECT_ID('dbo.Clips','U') IS NULL
CREATE TABLE dbo.Clips (
    ClipID         INT IDENTITY PRIMARY KEY,
    SceneID        INT NOT NULL FOREIGN KEY REFERENCES dbo.Scenes(SceneID),
    ClipOrder      INT,
    BeginFrameUrl  NVARCHAR(500),
    EndFrameUrl    NVARCHAR(500),
    CameraMoves    NVARCHAR(MAX),
    Actions        NVARCHAR(MAX),
    Dialog         NVARCHAR(MAX),
    PromptJson     NVARCHAR(MAX),
    State          NVARCHAR(50),
    KlingTaskID    NVARCHAR(100),
    VideoUrl       NVARCHAR(500),
    CreatedAt      DATETIME2 DEFAULT SYSUTCDATETIME()
)

IF OBJECT_ID('dbo.Characters','U') IS NULL
CREATE TABLE dbo.Characters (
    CharacterID    INT IDENTITY PRIMARY KEY,
    ProjectID      INT NULL FOREIGN KEY REFERENCES dbo.Projects(ProjectID),
    FranchiseID    INT NULL,
    CanonicalKey   NVARCHAR(100) NULL,
    Name           NVARCHAR(200),
    Description    NVARCHAR(MAX),
    CardImageUrl   NVARCHAR(500),
    PromptJson     NVARCHAR(MAX),
    State          NVARCHAR(50),
    CreatedAt      DATETIME2 DEFAULT SYSUTCDATETIME()
)

IF OBJECT_ID('dbo.Revisions','U') IS NULL
CREATE TABLE dbo.Revisions (
    RevisionID     INT IDENTITY PRIMARY KEY,
    EntityType     NVARCHAR(50),
    EntityID       INT,
    DiffJson       NVARCHAR(MAX),
    UserNote       NVARCHAR(MAX),
    CreatedAt      DATETIME2 DEFAULT SYSUTCDATETIME()
)

IF OBJECT_ID('dbo.AudioAssets','U') IS NULL
CREATE TABLE dbo.AudioAssets (
    AudioID        INT IDENTITY PRIMARY KEY,
    ClipID         INT NOT NULL FOREIGN KEY REFERENCES dbo.Clips(ClipID),
    AudioType      NVARCHAR(20),
    VoiceID        NVARCHAR(100),
    TextOrPrompt   NVARCHAR(MAX),
    AudioUrl       NVARCHAR(500),
    CreatedAt      DATETIME2 DEFAULT SYSUTCDATETIME()
)

IF OBJECT_ID('dbo.Renders','U') IS NULL
CREATE TABLE dbo.Renders (
    RenderID       INT IDENTITY PRIMARY KEY,
    ProjectID      INT NOT NULL FOREIGN KEY REFERENCES dbo.Projects(ProjectID),
    State          NVARCHAR(50),
    TimelineJson   NVARCHAR(MAX),
    OutputUrl      NVARCHAR(500),
    CreatedAt      DATETIME2 DEFAULT SYSUTCDATETIME()
)
