    Advanced Computer Vision System for Autonomous Vehicles
  Project Overview
This project implements an advanced computer vision system for autonomous vehicles using the YOLO (You Only Look Once) architecture. 
The system provides real-time object detection and tracking capabilities, specifically designed for deployment on AWS Docker Free Tier with interactive dashboards for insights and monitoring.

  Key Features
•Real-time Object Detection: Uses YOLOv8n (nano) for lightweight, fast inference
•Multi-object Recognition: Detects 80 different object classes including vehicles, pedestrians, traffic signs
•Interactive Dashboard: Modern web interface with drag-and-drop functionality
•Docker Containerized: Easy deployment and scaling
•REST API: Complete API for integration with other systems
•Performance Monitoring: Real-time statistics and inference time tracking

  Backend Components
•Flask Web Server: Serves both API endpoints and frontend
•YOLO Model: YOLOv8n for object detection
•Image Processing: OpenCV for image manipulation
•API Endpoints: RESTful services for detection and system info

  Frontend Components
•Interactive Dashboard: HTML5/CSS3/JavaScript interface
•File Upload: Drag-and-drop image and video upload
•Real-time Results: Live detection results with confidence scores
•Statistics Display: Performance metrics and system information

  Quick Start
Prerequisites
•Python 3.11+
•Docker (optional)
•1GB+ RAM
•Internet connection for model download

# Clone the repository
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
# Install dependencies
pip install -r requirements.txt
# Run the application
python main.py
# Access the application at http://localhost:5000

  # Docker Deployment
# Build the Docker image
docker build -t cv-backend:latest .
# Run the container
docker run -d --name cv-backend -p 5000:5000 cv-backend:latest

  # API Documentation
  Health Check
  GET /api/cv/health
  Returns system health status.

  Model Information
  GET /api/cv/model_info
  Returns information about the loaded YOLO model.

  Image Detection
  POST /api/cv/detect
  Content-Type: multipart/form-data
  Body: image file
  Performs object detection on uploaded image.

  Video Processing
  POST /api/cv/detect_video
  Content-Type: multipart/form-data
  Body: video file
  Processes video for object detection statistics.

