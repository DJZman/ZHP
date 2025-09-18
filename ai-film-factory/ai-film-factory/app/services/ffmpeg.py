import subprocess, shlex, tempfile, os
from typing import List

def _run(cmd: str) -> None:
    proc = subprocess.run(shlex.split(cmd), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.decode("utf-8", errors="ignore"))

def grab_frame(video_path: str, t: float, out_path: str) -> str:
    cmd = f'ffmpeg -y -ss {t} -i "{video_path}" -frames:v 1 "{out_path}"'
    _run(cmd)
    return out_path

def concat_clips(clip_paths: List[str], out_path: str, audio_path: str = None) -> str:
    # Use concat demuxer
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".txt") as f:
        for p in clip_paths:
            f.write(f"file '{p}'\\n")
        list_path = f.name
    cmd = f'ffmpeg -y -f concat -safe 0 -i "{list_path}" -c copy "{out_path}"'
    _run(cmd)
    # Optionally merge audio
    if audio_path:
        merged = out_path.replace(".mp4", "_mux.mp4")
        cmd2 = f'ffmpeg -y -i "{out_path}" -i "{audio_path}" -c:v copy -c:a aac -shortest "{merged}"'
        _run(cmd2)
        return merged
    return out_path
