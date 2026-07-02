'use client';

import { useState, useRef, useEffect } from 'react';

interface ShotResult {
  status: string;
  message: string;
  meta: {
    frames: number;
    fps: number;
    resolution: string;
  };
  analysis: {
    speed_kmh: number;
    accuracy_zone: string;
    score: number;
  };
}

export default function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const [result, setResult] = useState<ShotResult | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const currentVideoRef = videoRef.current;

    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }, 
          audio: false 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError('Camera access denied or unavailable.');
        console.error(err);
      }
    }
    setupCamera();

    return () => {
      if (currentVideoRef?.srcObject) {
        const stream = currentVideoRef.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = () => {
    if (!videoRef.current?.srcObject) return;
    
    setIsRecording(true);
    setResult(null);
    setError('');
    
    const stream = videoRef.current.srcObject as MediaStream;
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorderRef.current = mediaRecorder;
    
    const chunks: BlobPart[] = [];
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      await uploadVideo(blob);
    };

    mediaRecorder.start();

    setTimeout(() => {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        setIsRecording(false);
      }
    }, 3000);
  };

  const uploadVideo = async (blob: Blob) => {
    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append('file', blob, 'shot.webm'); 

    try {
      const response = await fetch('http://localhost:8000/api/analyze-shot', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to analyze shot');
      
      const data: ShotResult = await response.json();
      setResult(data);
    } catch (err) {
      setError('Error connecting to backend. Is it running?');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto space-y-4">
      <div className="relative w-full aspect-3/4 bg-black rounded-xl overflow-hidden border-2 border-slate-800">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="object-cover w-full h-full"
        />
        
        {isRecording && (
          <div className="absolute top-4 right-4 flex items-center space-x-2 bg-black/50 px-3 py-1 rounded-full">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white text-sm font-bold">REC</span>
          </div>
        )}
      </div>

      <button
        onClick={startRecording}
        disabled={isRecording || isAnalyzing}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
          isRecording 
            ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
            : 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95'
        }`}
      >
        {isRecording ? 'Recording (3s)...' : isAnalyzing ? 'Analyzing Shot...' : '🔴 Record Shot'}
      </button>

      {error && <p className="text-red-500 font-medium">{error}</p>}
      
      {result && (
        <div className="w-full bg-slate-100 p-4 rounded-xl border border-slate-200">
          <h3 className="text-xl font-black text-slate-800 mb-2">Shot Results</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-slate-500">Speed</p>
              <p className="text-2xl font-bold text-emerald-600">{result.analysis.speed_kmh} <span className="text-sm text-slate-400">km/h</span></p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-slate-500">Score</p>
              <p className="text-2xl font-bold text-blue-600">{result.analysis.score} <span className="text-sm text-slate-400">pts</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}