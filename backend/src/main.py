"""
If you are deploying on Vercel, you can delete this file.

This app puts together the frontend UI and backend API for deployment on Render.
For local development, the app for just the API should be run on its own:
$ fastapi dev src/api.py

The provided Dockerfile will handle putting everything together for deployment.
When used, the application bundle from building the React app with `npm run build`
is placed at the public directory defined below for FastAPI to serve as static assets.
That means any requests for existing files will be served the contents of those files,
and any requests for the API paths will be sent to the API routes defined in the API.
"""

from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.exceptions import HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

import api

from squat_detector import SquatDetector
from pydantic import BaseModel

from fastapi.middleware.cors import CORSMiddleware

class LandmarksInput(BaseModel):
    landmarks: list

PUBLIC_DIRECTORY = Path("public")

# Create a main app under which the API will be mounted as a sub-app
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # 允许你的前端地址
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有方法 (POST, GET, OPTIONS 等)
    allow_headers=["*"],  # 允许所有请求头
)
# Send all requests to paths under `/api/*` to the API router
app.mount("/api/", api.app)


# Make the public files (HTML, JS, CSS, etc.) accessible on the server
# With HTML mode, `index.html` is automatically loaded
# app.mount("/", StaticFiles(directory=PUBLIC_DIRECTORY, html=True), name="public")


@app.exception_handler(status.HTTP_404_NOT_FOUND)
async def not_found(req: Request, exc: HTTPException) -> FileResponse:
    """
    Serve the frontend app for all other requests not directed to `/api/` or `/`.

    This allows the single-page application to do client-side routing where the browser
    process the URL path in the React App. Otherwise, users would see 404 Not Found when
    navigating directly to a virtual path.

    This should be removed if the frontend app does not handle different URL paths.
    """
    return FileResponse(PUBLIC_DIRECTORY / "index.html")

# Squat detector object
detector = SquatDetector()

@app.post("/analyze-squat")
def analyze_squat(data: LandmarksInput):
    result = detector.process_frame(data.landmarks)
    return result
