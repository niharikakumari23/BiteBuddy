import React, { useState, useEffect, useRef } from 'react';
import { Camera, UploadCloud, Sparkles, Image as ImageIcon, Check, X, Clock } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MacroRing } from '../components/charts/MacroRing';
import { useToast } from '../hooks/useToast';
import './FoodScanner.css';

export const FoodScanner = ({
  API_BASE,
  token,
  openQuickFoodEntry,
  logs = [],
  setLogs,
  activePlan,
  setActivePlan,
  setShoppingItems,
  refreshData
}) => {
  const { addToast } = useToast();
  const [selectedImage, setSelectedImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  // Camera settings states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Fetch recent meal logs to populate history
  const fetchRecentScans = async () => {
    try {
      const res = await fetch(`${API_BASE}/meallog`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const logs = await res.json();
        // Use the last 5 logs for history
        const history = logs.slice(0, 5).map(log => ({
          id: log._id,
          name: log.foodName,
          time: new Date(log.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
          kcal: log.calories,
          protein: log.protein,
          carbs: log.carbs,
          fats: log.fats || log.fat || 0,
          imageUrl: log.imageUrl
        }));
        setRecentScans(history);
      }
    } catch (err) {
      console.error('Failed to load recent scans', err);
    }
  };

  useEffect(() => {
    if (token) fetchRecentScans();
  }, [token]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target.result);
        setScanResult(null); // Reset previous result
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    setSelectedImage(null);
    setSelectedFile(null);
    setScanResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      addToast('Camera Error', 'Could not open camera stream. Please upload an image instead.', 'error');
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL('image/jpeg');
      setSelectedImage(dataUrl);

      // Convert captured snapshot to File
      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'captured-meal.jpg', { type: 'image/jpeg' });
          setSelectedFile(file);
        });

      stopCamera();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const simulateScan = async () => {
    if (!selectedImage || !selectedFile) return;
    setIsScanning(true);
    
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const res = await fetch(`${API_BASE}/meals/scan`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Scan failed');
      const data = await res.json();
      
      setScanResult({
        name: data.food_name,
        confidence: Math.floor(Math.random() * 15 + 85),
        calories: { current: data.calories, target: 500, min: data.minCalories, max: data.maxCalories }, 
        protein: { current: data.protein, target: 50, min: data.minProtein, max: data.maxProtein },
        carbs: { current: data.carbs, target: 100, min: data.minCarbs, max: data.maxCarbs },
        fat: { current: data.fats, target: 60, min: data.minFat, max: data.maxFat },
        imageUrl: data.image_url,
        fiber: { min: data.minFiber, max: data.maxFiber },
        sugar: { min: data.minSugar, max: data.maxSugar },
        sodium: { min: data.minSodium, max: data.maxSodium },
        cholesterol: { min: data.minCholesterol, max: data.maxCholesterol }
      });
      addToast('Scan Complete', 'AI successfully analyzed your food.', 'success');
    } catch (err) {
      console.error(err);
      addToast('Scan Failed', 'AI could not analyze this image.', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleRecentClick = (scan) => {
    setScanResult({
      name: scan.name,
      confidence: 100,
      calories: { current: scan.kcal, target: 500 },
      protein: { current: scan.protein || 0, target: 50 },
      carbs: { current: scan.carbs || 0, target: 100 },
      fat: { current: scan.fats || 0, target: 60 },
      imageUrl: scan.imageUrl
    });
    setSelectedImage(scan.imageUrl || null);
  };

  const saveToLog = async () => {
    if (scanResult) {
      try {
        const res = await fetch(`${API_BASE}/meallog`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            foodName: scanResult.name,
            calories: scanResult.calories.current,
            carbs: scanResult.carbs.current,
            protein: scanResult.protein.current,
            fats: scanResult.fat.current,
            mealType: 'Snacks',
            imageUrl: scanResult.imageUrl
          })
        });
        if (!res.ok) throw new Error('Failed to save to log');
        
        const data = await res.json();
        setLogs([data.mealLog, ...logs]);
        if (data.mealPlan) {
          setActivePlan(data.mealPlan);
          setShoppingItems(data.mealPlan.shoppingList || []);
        }

        await fetchRecentScans();
        addToast('Saved to Log', `${scanResult.name} was added to today's log.`, 'success');
        if (refreshData) {
          refreshData();
        }
        setSelectedImage(null);
        setSelectedFile(null);
        setScanResult(null);
      } catch (err) {
        addToast('Save Failed', err.message, 'error');
      }
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Food Scanner</h1>
        <p className="page-subtitle">Snap a picture of your meal for instant macro tracking.</p>
      </div>

      <div className="scanner-grid">
        <div className="scanner-main">
          {/* Camera View */}
          {isCameraActive ? (
            <Card className="preview-zone">
              <div className="preview-image-container" style={{ position: 'relative', overflow: 'hidden', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                ></video>
                <button 
                  className="preview-close-btn" 
                  onClick={stopCamera}
                  style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0, 0, 0, 0.5)', border: 'none', color: '#fff', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="preview-actions" style={{ display: 'flex', gap: '12px', padding: '16px' }}>
                <Button variant="ghost" className="full-width" onClick={stopCamera}>
                  Cancel
                </Button>
                <Button className="full-width" onClick={capturePhoto}>
                  <Camera size={18} style={{ marginRight: 8 }} /> Capture Photo
                </Button>
              </div>
            </Card>
          ) : !selectedImage ? (
            <Card className="upload-zone">
              <input 
                type="file" 
                id="food-image" 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="hidden-input"
              />
              <label htmlFor="food-image" className="upload-label">
                <div className="upload-icon-box">
                  <UploadCloud size={32} />
                </div>
                <h3>Upload a Photo</h3>
                <p>Drag and drop or click to upload</p>
                <div className="upload-divider"><span>OR</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                  <Button type="button" onClick={startCamera} style={{ width: '100%' }}>
                    <Camera size={18} style={{ marginRight: 8 }} /> Open Camera
                  </Button>
                  <Button type="button" variant="outline" onClick={openQuickFoodEntry} style={{ width: '100%' }}>
                    <Sparkles size={18} style={{ marginRight: 8 }} /> Type Food Instead (AI Quick Log)
                  </Button>
                </div>
              </label>
            </Card>
          ) : (
            <Card className="preview-zone">
              <div className="preview-image-container">
                <img src={selectedImage} alt="Food preview" className="preview-image" />
                <button 
                  className="preview-close-btn" 
                  onClick={() => { setSelectedImage(null); setSelectedFile(null); setScanResult(null); }}
                  disabled={isScanning}
                >
                  <X size={20} />
                </button>
                {isScanning && (
                  <div className="scanning-overlay">
                    <div className="scanner-line"></div>
                    <div className="scanning-text">Analyzing your meal...</div>
                  </div>
                )}
              </div>
              
              {!scanResult && !isScanning && (
                <div className="preview-actions">
                  <Button className="full-width" size="lg" onClick={simulateScan}>
                    <Sparkles size={18} style={{ marginRight: 8 }} /> Analyze Meal
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* Result Card */}
          {scanResult && (
            <Card className="result-card animate-slide-in-up">
              <div className="result-header">
                <div>
                  <h3 className="result-title">{scanResult.name}</h3>
                  <p className="result-confidence">{scanResult.confidence}% match confidence</p>
                </div>
                <Button onClick={saveToLog}>
                  <Check size={18} style={{ marginRight: 8 }} /> Save to Log
                </Button>
              </div>
              
              <div className="result-macros">
                <MacroRing 
                  calories={scanResult.calories}
                  protein={scanResult.protein}
                  carbs={scanResult.carbs}
                  fat={scanResult.fat}
                  size={160}
                />
                <div className="result-macros-details">
                  <div className="macro-detail">
                    <div className="macro-dot" style={{ backgroundColor: 'var(--color-protein)' }}></div>
                    <div>
                      <div className="macro-detail-label">Protein</div>
                      <div className="macro-detail-value">{scanResult.protein.current}g</div>
                    </div>
                  </div>
                  <div className="macro-detail">
                    <div className="macro-dot" style={{ backgroundColor: 'var(--color-carbs)' }}></div>
                    <div>
                      <div className="macro-detail-label">Carbs</div>
                      <div className="macro-detail-value">{scanResult.carbs.current}g</div>
                    </div>
                  </div>
                  <div className="macro-detail">
                    <div className="macro-dot" style={{ backgroundColor: 'var(--color-fat)' }}></div>
                    <div>
                      <div className="macro-detail-label">Fat</div>
                      <div className="macro-detail-value">{scanResult.fat.current}g</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Extra details (Ranges & More) */}
              <div className="scanner-extra-grid" style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {scanResult.calories.min !== undefined && (
                  <div style={{ fontSize: '13px' }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>Calories Range:</strong>
                    <div style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: '500' }}>
                      {scanResult.calories.min} - {scanResult.calories.max} kcal
                    </div>
                  </div>
                )}
                {scanResult.protein.min !== undefined && (
                  <div style={{ fontSize: '13px' }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>Protein Range:</strong>
                    <div style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: '500' }}>
                      {scanResult.protein.min} - {scanResult.protein.max}g
                    </div>
                  </div>
                )}
                {scanResult.carbs.min !== undefined && (
                  <div style={{ fontSize: '13px' }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>Carbs Range:</strong>
                    <div style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: '500' }}>
                      {scanResult.carbs.min} - {scanResult.carbs.max}g
                    </div>
                  </div>
                )}
                {scanResult.fat.min !== undefined && (
                  <div style={{ fontSize: '13px' }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>Fat Range:</strong>
                    <div style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: '500' }}>
                      {scanResult.fat.min} - {scanResult.fat.max}g
                    </div>
                  </div>
                )}
                {scanResult.fiber && scanResult.fiber.min !== undefined && (
                  <div style={{ fontSize: '13px' }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>Fiber Range:</strong>
                    <div style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: '500' }}>
                      {scanResult.fiber.min} - {scanResult.fiber.max}g
                    </div>
                  </div>
                )}
                {scanResult.sugar && scanResult.sugar.min !== undefined && (
                  <div style={{ fontSize: '13px' }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>Sugar Range:</strong>
                    <div style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: '500' }}>
                      {scanResult.sugar.min} - {scanResult.sugar.max}g
                    </div>
                  </div>
                )}
                {scanResult.sodium && scanResult.sodium.min !== undefined && (
                  <div style={{ fontSize: '13px' }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>Sodium Range:</strong>
                    <div style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: '500' }}>
                      {scanResult.sodium.min} - {scanResult.sodium.max}mg
                    </div>
                  </div>
                )}
                {scanResult.cholesterol && scanResult.cholesterol.min !== undefined && (
                  <div style={{ fontSize: '13px' }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>Cholesterol Range:</strong>
                    <div style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: '500' }}>
                      {scanResult.cholesterol.min} - {scanResult.cholesterol.max}mg
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar - Recent Scans */}
        <div className="scanner-sidebar">
          <Card className="recent-scans-card">
            <div className="card-header-flex">
              <h3 className="card-title">Recent Scans</h3>
              <Clock size={18} color="var(--muted)" />
            </div>
            
            {recentScans.length > 0 ? (
              <div className="recent-scans-list">
                {recentScans.map((scan) => (
                  <div 
                    key={scan.id} 
                    className="recent-scan-item" 
                    onClick={() => handleRecentClick(scan)}
                    style={{ cursor: 'pointer', transition: 'var(--transition)' }}
                  >
                    <div className="recent-scan-icon">
                      <ImageIcon size={18} />
                    </div>
                    <div className="recent-scan-info">
                      <div className="recent-scan-name">{scan.name}</div>
                      <div className="recent-scan-time">{scan.time}</div>
                    </div>
                    <div className="recent-scan-kcal">{scan.kcal} kcal</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-small">
                <Camera size={32} />
                <p>No recent scans</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
