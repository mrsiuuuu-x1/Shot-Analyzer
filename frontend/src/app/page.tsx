import CameraCapture from '@/components/CameraCapture';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 p-4 flex flex-col items-center">
      <div className="w-full max-w-md mt-4 mb-8 text-center">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          Shot<span className="text-emerald-500">Analyzer</span>
        </h1>
        <p className="text-slate-500 font-medium mt-1">Measure speed & accuracy</p>
      </div>

      <CameraCapture />
    </main>
  );
}