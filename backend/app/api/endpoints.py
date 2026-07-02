from fastapi import APIRouter, UploadFile, File, HTTPException
import cv2
import os
import shutil

router = APIRouter()

TEMP_DIR = "temp_videos"
os.makedirs(TEMP_DIR, exist_ok=True)

@router.post("/analyze-shot")
async def analyze_shot(file: UploadFile = File(...)):
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a video")
    
    file_path = os.path.join(TEMP_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        cap = cv2.VideoCapture(file_path)
        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="OpenCV2 could not open file")
        
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        cap.release()

        if os.path.exists(file_path):
            os.remove(file_path)
        
        return {
            "status": "success",
            "message": "Video uploaded and verified successfully!",
            "meta": {
                "frames": frame_count,
                "fps": round(fps, 2),
                "resolution": f"{width}x{height}"
            },
            "analysis": {
                "speed_kmh": 72.5,
                "accuracy_zone": "top_left",
                "score": 10
            }
        }
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")