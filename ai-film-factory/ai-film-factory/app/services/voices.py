# ElevenLabs adapter stubs
# Implement with requests to ElevenLabs API. Keep signatures stable.
from typing import Optional

def tts(text: str, voice_id: str, model: str = "eleven_multilingual_v2", latency: str = "normal") -> str:
    # TODO: implement HTTP call; return audio URL
    return "https://storage/dialog.wav"

def sfx(prompt: str) -> str:
    # TODO: implement; return audio URL
    return "https://storage/sfx.wav"

def music(prompt: str) -> str:
    # TODO: implement; return audio URL
    return "https://storage/music.wav"
