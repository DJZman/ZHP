from __future__ import annotations
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey
)
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func

Base = declarative_base()
NVARCHAR_MAX = Text

class Franchise(Base):
    __tablename__ = "Franchises"
    FranchiseID = Column(Integer, primary_key=True)
    Title = Column(String(200))
    Description = Column(NVARCHAR_MAX)
    BibleJson = Column(NVARCHAR_MAX)
    Version = Column(Integer, nullable=False, default=1)
    CreatedAt = Column(DateTime, server_default=func.sysutcdatetime())

    projects = relationship("Project", back_populates="franchise")
    characters = relationship("Character", back_populates="franchise")

class Project(Base):
    __tablename__ = "Projects"
    ProjectID = Column(Integer, primary_key=True)
    Title = Column(String(200))
    Premise = Column(NVARCHAR_MAX)
    TargetDuration_s = Column(Integer)
    Style = Column(String(200))
    Genre = Column(String(200))
    State = Column(String(50))
    CreatedAt = Column(DateTime, server_default=func.sysutcdatetime())

    FranchiseID = Column(Integer, ForeignKey("Franchises.FranchiseID"))
    FranchiseVersion = Column(Integer)
    BibleJsonSnapshot = Column(NVARCHAR_MAX)

    franchise = relationship("Franchise", back_populates="projects")
    scenes = relationship("Scene", back_populates="project", cascade="all, delete-orphan")
    characters = relationship("Character", back_populates="project")

class Scene(Base):
    __tablename__ = "Scenes"
    SceneID = Column(Integer, primary_key=True)
    ProjectID = Column(Integer, ForeignKey("Projects.ProjectID"), nullable=False)
    SceneOrder = Column(Integer)
    Summary = Column(NVARCHAR_MAX)
    State = Column(String(50))
    CreatedAt = Column(DateTime, server_default=func.sysutcdatetime())

    project = relationship("Project", back_populates="scenes")
    clips = relationship("Clip", back_populates="scene", cascade="all, delete-orphan")

class Clip(Base):
    __tablename__ = "Clips"
    ClipID = Column(Integer, primary_key=True)
    SceneID = Column(Integer, ForeignKey("Scenes.SceneID"), nullable=False)
    ClipOrder = Column(Integer)
    BeginFrameUrl = Column(String(500))
    EndFrameUrl = Column(String(500))
    CameraMoves = Column(NVARCHAR_MAX)
    Actions = Column(NVARCHAR_MAX)
    Dialog = Column(NVARCHAR_MAX)
    PromptJson = Column(NVARCHAR_MAX)
    State = Column(String(50))
    KlingTaskID = Column(String(100))
    VideoUrl = Column(String(500))
    CreatedAt = Column(DateTime, server_default=func.sysutcdatetime())

    scene = relationship("Scene", back_populates="clips")
    audios = relationship("AudioAsset", back_populates="clip", cascade="all, delete-orphan")

class Character(Base):
    __tablename__ = "Characters"
    CharacterID = Column(Integer, primary_key=True)
    ProjectID = Column(Integer, ForeignKey("Projects.ProjectID"))
    FranchiseID = Column(Integer, ForeignKey("Franchises.FranchiseID"))
    CanonicalKey = Column(String(100))
    Name = Column(String(200))
    Description = Column(NVARCHAR_MAX)
    CardImageUrl = Column(String(500))
    PromptJson = Column(NVARCHAR_MAX)
    State = Column(String(50))
    CreatedAt = Column(DateTime, server_default=func.sysutcdatetime())

    project = relationship("Project", back_populates="characters")
    franchise = relationship("Franchise", back_populates="characters")

class AudioAsset(Base):
    __tablename__ = "AudioAssets"
    AudioID = Column(Integer, primary_key=True)
    ClipID = Column(Integer, ForeignKey("Clips.ClipID"), nullable=False)
    AudioType = Column(String(20))     # Dialog | SFX | Music
    VoiceID = Column(String(100))
    TextOrPrompt = Column(NVARCHAR_MAX)
    AudioUrl = Column(String(500))
    CreatedAt = Column(DateTime, server_default=func.sysutcdatetime())

    clip = relationship("Clip", back_populates="audios")

class Render(Base):
    __tablename__ = "Renders"
    RenderID = Column(Integer, primary_key=True)
    ProjectID = Column(Integer, ForeignKey("Projects.ProjectID"), nullable=False)
    State = Column(String(50))
    TimelineJson = Column(NVARCHAR_MAX)
    OutputUrl = Column(String(500))
    CreatedAt = Column(DateTime, server_default=func.sysutcdatetime())
