// Global variables
let selectedImageFile = null;
let selectedVideoFile = null;
let totalDetections = 0;
let processedImages = 0;
let processedVideos = 0;
let inferenceTimes = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeUploadAreas();
    loadModelInfo();
    updateStats();
});

// Initialize drag and drop functionality
function initializeUploadAreas() {
    // Image upload area
    const imageUploadArea = document.getElementById('imageUploadArea');
    const imageInput = document.getElementById('imageInput');
    const detectImageBtn = document.getElementById('detectImageBtn');

    imageUploadArea.addEventListener('click', () => imageInput.click());
    imageUploadArea.addEventListener('dragover', handleDragOver);
    imageUploadArea.addEventListener('drop', (e) => handleImageDrop(e));
    imageInput.addEventListener('change', handleImageSelect);
    detectImageBtn.addEventListener('click', detectObjects);

    // Video upload area
    const videoUploadArea = document.getElementById('videoUploadArea');
    const videoInput = document.getElementById('videoInput');
    const processVideoBtn = document.getElementById('processVideoBtn');

    videoUploadArea.addEventListener('click', () => videoInput.click());
    videoUploadArea.addEventListener('dragover', handleDragOver);
    videoUploadArea.addEventListener('drop', (e) => handleVideoDrop(e));
    videoInput.addEventListener('change', handleVideoSelect);
    processVideoBtn.addEventListener('click', processVideo);
}

// Drag and drop handlers
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleImageDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        selectedImageFile = files[0];
        updateImageUploadArea();
    }
}

function handleVideoDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('video/')) {
        selectedVideoFile = files[0];
        updateVideoUploadArea();
    }
}

// File selection handlers
function handleImageSelect(e) {
    if (e.target.files.length > 0) {
        selectedImageFile = e.target.files[0];
        updateImageUploadArea();
    }
}

function handleVideoSelect(e) {
    if (e.target.files.length > 0) {
        selectedVideoFile = e.target.files[0];
        updateVideoUploadArea();
    }
}

// Update upload areas
function updateImageUploadArea() {
    const uploadArea = document.getElementById('imageUploadArea');
    const detectBtn = document.getElementById('detectImageBtn');
    
    uploadArea.innerHTML = `
        <div class="upload-icon">
            <i class="fas fa-image"></i>
        </div>
        <p><strong>${selectedImageFile.name}</strong></p>
        <p>Size: ${(selectedImageFile.size / 1024 / 1024).toFixed(2)} MB</p>
    `;
    detectBtn.disabled = false;
}

function updateVideoUploadArea() {
    const uploadArea = document.getElementById('videoUploadArea');
    const processBtn = document.getElementById('processVideoBtn');
    
    uploadArea.innerHTML = `
        <div class="upload-icon">
            <i class="fas fa-video"></i>
        </div>
        <p><strong>${selectedVideoFile.name}</strong></p>
        <p>Size: ${(selectedVideoFile.size / 1024 / 1024).toFixed(2)} MB</p>
    `;
    processBtn.disabled = false;
}

// Load model information
async function loadModelInfo() {
    try {
        const response = await fetch('/api/cv/model_info');
        if (response.ok) {
            const data = await response.json();
            displayModelInfo(data);
        } else {
            document.getElementById('modelInfo').innerHTML = `
                <p style="color: red;">Failed to load model information</p>
            `;
        }
    } catch (error) {
        document.getElementById('modelInfo').innerHTML = `
            <p style="color: red;">Error: ${error.message}</p>
        `;
    }
}

// Display model information
function displayModelInfo(data) {
    const modelInfo = document.getElementById('modelInfo');
    const classTags = data.classes.map(cls => `<span class="class-tag">${cls}</span>`).join('');
    
    modelInfo.innerHTML = `
        <h3>Model Information</h3>
        <p><strong>Model:</strong> ${data.model_name}</p>
        <p><strong>Size:</strong> ${data.model_size}</p>
        <p><strong>Classes:</strong> ${data.num_classes} objects</p>
        <div class="class-tags">
            ${classTags}
        </div>
    `;
}

// Detect objects in image
async function detectObjects() {
    if (!selectedImageFile) return;

    const detectBtn = document.getElementById('detectImageBtn');
    const resultsArea = document.getElementById('imageResults');
    
    detectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    detectBtn.disabled = true;

    const formData = new FormData();
    formData.append('image', selectedImageFile);

    try {
        const response = await fetch('/api/cv/detect', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            displayImageResults(data);
            updateGlobalStats(data);
            resultsArea.style.display = 'block';
        } else {
            const error = await response.json();
            alert(`Error: ${error.error}`);
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    } finally {
        detectBtn.innerHTML = '<i class="fas fa-search"></i> Detect Objects';
        detectBtn.disabled = false;
    }
}

// Display image detection results
function displayImageResults(data) {
    const detectionList = document.getElementById('detectionList');
    const annotatedImage = document.getElementById('annotatedImage');

    // Display annotated image
    annotatedImage.src = data.annotated_image;

    // Display detection list
    if (data.detections.length === 0) {
        detectionList.innerHTML = '<p>No objects detected</p>';
    } else {
        detectionList.innerHTML = data.detections.map(detection => `
            <div class="detection-item">
                <div style="flex: 1;">
                    <strong>${detection.class}</strong>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${detection.confidence * 100}%"></div>
                    </div>
                </div>
                <div style="margin-left: 15px; font-weight: bold;">
                    ${(detection.confidence * 100).toFixed(1)}%
                </div>
            </div>
        `).join('');
    }
}

// Process video
async function processVideo() {
    if (!selectedVideoFile) return;

    const processBtn = document.getElementById('processVideoBtn');
    const resultsArea = document.getElementById('videoResults');
    
    processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    processBtn.disabled = true;

    const formData = new FormData();
    formData.append('video', selectedVideoFile);

    try {
        const response = await fetch('/api/cv/detect_video', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            displayVideoResults(data);
            updateVideoStats(data);
            resultsArea.style.display = 'block';
        } else {
            const error = await response.json();
            alert(`Error: ${error.error}`);
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    } finally {
        processBtn.innerHTML = '<i class="fas fa-play"></i> Process Video';
        processBtn.disabled = false;
    }
}

// Display video processing results
function displayVideoResults(data) {
    const videoStats = document.getElementById('videoStats');
    
    videoStats.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${data.total_frames}</div>
            <div class="stat-label">Total Frames</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.processed_frames}</div>
            <div class="stat-label">Processed Frames</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.total_detections}</div>
            <div class="stat-label">Total Detections</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.fps.toFixed(1)}</div>
            <div class="stat-label">Processing FPS</div>
        </div>
    `;
}

// Update global statistics
function updateGlobalStats(data) {
    totalDetections += data.total_objects;
    processedImages += 1;
    inferenceTimes.push(data.inference_time);
    updateStats();
}

function updateVideoStats(data) {
    totalDetections += data.total_detections;
    processedVideos += 1;
    inferenceTimes.push(data.avg_processing_time);
    updateStats();
}

// Update statistics display
function updateStats() {
    document.getElementById('totalDetections').textContent = totalDetections;
    document.getElementById('processedImages').textContent = processedImages;
    document.getElementById('processedVideos').textContent = processedVideos;
    
    const avgTime = inferenceTimes.length > 0 
        ? inferenceTimes.reduce((a, b) => a + b, 0) / inferenceTimes.length 
        : 0;
    document.getElementById('avgInferenceTime').textContent = `${(avgTime * 1000).toFixed(0)}ms`;
}

// Remove dragover class when dragging leaves
document.addEventListener('dragleave', function(e) {
    if (e.target.classList.contains('upload-area')) {
        e.target.classList.remove('dragover');
    }
});

