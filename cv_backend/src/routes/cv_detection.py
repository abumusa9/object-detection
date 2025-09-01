from flask import Blueprint, request, jsonify, current_app
from flask_cors import cross_origin
import cv2
import numpy as np
from ultralytics import YOLO
import base64
import io
from PIL import Image
import os
import time

cv_bp = Blueprint('cv', __name__)

# Global model variable
model = None

def load_model():
    """Load YOLO model - using YOLOv8n for lightweight deployment"""
    global model
    if model is None:
        try:
            # Use YOLOv8n (nano) for lightweight deployment
            model = YOLO('yolov8n.pt')
            print("YOLO model loaded successfully")
        except Exception as e:
            print(f"Error loading YOLO model: {e}")
            model = None
    return model

@cv_bp.route('/detect', methods=['POST'])
@cross_origin()
def detect_objects():
    """Detect objects in uploaded image"""
    try:
        # Load model if not already loaded
        yolo_model = load_model()
        if yolo_model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        # Get image from request
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        image_file = request.files['image']
        if image_file.filename == '':
            return jsonify({'error': 'No image selected'}), 400
        
        # Read and process image
        image_bytes = image_file.read()
        image = Image.open(io.BytesIO(image_bytes))
        image_np = np.array(image)
        
        # Convert RGB to BGR for OpenCV
        if len(image_np.shape) == 3:
            image_cv = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
        else:
            image_cv = image_np
        
        # Run inference
        start_time = time.time()
        results = yolo_model(image_cv)
        inference_time = time.time() - start_time
        
        # Process results
        detections = []
        annotated_image = image_cv.copy()
        
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    # Get box coordinates
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = box.conf[0].cpu().numpy()
                    class_id = int(box.cls[0].cpu().numpy())
                    class_name = yolo_model.names[class_id]
                    
                    # Filter by confidence threshold
                    if confidence > 0.5:
                        detections.append({
                            'class': class_name,
                            'confidence': float(confidence),
                            'bbox': [float(x1), float(y1), float(x2), float(y2)]
                        })
                        
                        # Draw bounding box on image
                        cv2.rectangle(annotated_image, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
                        cv2.putText(annotated_image, f'{class_name} {confidence:.2f}', 
                                  (int(x1), int(y1) - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        # Convert annotated image to base64
        _, buffer = cv2.imencode('.jpg', annotated_image)
        annotated_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return jsonify({
            'detections': detections,
            'inference_time': inference_time,
            'annotated_image': f'data:image/jpeg;base64,{annotated_base64}',
            'total_objects': len(detections)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@cv_bp.route('/detect_video', methods=['POST'])
@cross_origin()
def detect_video():
    """Process video for object detection"""
    try:
        yolo_model = load_model()
        if yolo_model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        if 'video' not in request.files:
            return jsonify({'error': 'No video provided'}), 400
        
        video_file = request.files['video']
        if video_file.filename == '':
            return jsonify({'error': 'No video selected'}), 400
        
        # Save uploaded video temporarily
        temp_video_path = '/tmp/uploaded_video.mp4'
        video_file.save(temp_video_path)
        
        # Process video
        cap = cv2.VideoCapture(temp_video_path)
        frame_count = 0
        total_detections = 0
        processing_times = []
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            # Process every 10th frame to reduce computation
            if frame_count % 10 == 0:
                start_time = time.time()
                results = yolo_model(frame)
                processing_time = time.time() - start_time
                processing_times.append(processing_time)
                
                # Count detections
                for result in results:
                    if result.boxes is not None:
                        total_detections += len(result.boxes)
        
        cap.release()
        os.remove(temp_video_path)  # Clean up
        
        avg_processing_time = np.mean(processing_times) if processing_times else 0
        
        return jsonify({
            'total_frames': frame_count,
            'processed_frames': len(processing_times),
            'total_detections': total_detections,
            'avg_processing_time': avg_processing_time,
            'fps': 1.0 / avg_processing_time if avg_processing_time > 0 else 0
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@cv_bp.route('/model_info', methods=['GET'])
@cross_origin()
def model_info():
    """Get information about the loaded model"""
    try:
        yolo_model = load_model()
        if yolo_model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        return jsonify({
            'model_name': 'YOLOv8n',
            'classes': list(yolo_model.names.values()),
            'num_classes': len(yolo_model.names),
            'model_size': 'nano (lightweight)'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@cv_bp.route('/health', methods=['GET'])
@cross_origin()
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'CV Detection API'})

