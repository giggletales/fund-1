import { useEffect, useRef } from 'react';
import { BarChart3 } from 'lucide-react';

interface Snapshot {
  snapshot_time: string;
  equity: number;
  balance: number;
}

interface AccountPerformanceChartProps {
  snapshots: Snapshot[];
  initialBalance: number;
}

export default function AccountPerformanceChart({ snapshots, initialBalance }: AccountPerformanceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || snapshots.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = 40;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    ctx.clearRect(0, 0, width, height);

    const allValues = [initialBalance, ...snapshots.map(s => s.equity)];
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);
    const range = maxValue - minValue || 1;

    const gradient = ctx.createLinearGradient(0, 0, 0, graphHeight);
    gradient.addColorStop(0, 'rgba(0, 242, 254, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 242, 254, 0.05)');

    ctx.beginPath();
    ctx.moveTo(padding, padding + graphHeight);

    snapshots.forEach((snapshot, index) => {
      const x = padding + (index / (snapshots.length - 1 || 1)) * graphWidth;
      const y = padding + graphHeight - ((snapshot.equity - minValue) / range) * graphHeight;

      if (index === 0) {
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.lineTo(padding + graphWidth, padding + graphHeight);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    snapshots.forEach((snapshot, index) => {
      const x = padding + (index / (snapshots.length - 1 || 1)) * graphWidth;
      const y = padding + graphHeight - ((snapshot.equity - minValue) / range) * graphHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.strokeStyle = '#00F2FE';
    ctx.lineWidth = 2;
    ctx.stroke();

    snapshots.forEach((snapshot, index) => {
      const x = padding + (index / (snapshots.length - 1 || 1)) * graphWidth;
      const y = padding + graphHeight - ((snapshot.equity - minValue) / range) * graphHeight;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#00F2FE';
      ctx.fill();
      ctx.strokeStyle = '#0a0f1e';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding + graphHeight);
    ctx.lineTo(padding + graphWidth, padding + graphHeight);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + graphHeight);
    ctx.stroke();

  }, [snapshots, initialBalance]);

  if (snapshots.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="text-gray-400" size={32} />
        </div>
        <p className="text-gray-400 text-lg">No performance data yet</p>
        <p className="text-gray-500 text-sm mt-2">Account equity tracking will appear here</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-xl font-bold mb-6 flex items-center">
        <BarChart3 className="mr-2 text-electric-blue" size={24} />
        Account Performance
      </h3>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-64"
          style={{ display: 'block' }}
        />
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <div>
          <span className="text-gray-400">Initial Balance: </span>
          <span className="font-semibold">${initialBalance.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-gray-400">Current Equity: </span>
          <span className="font-semibold text-neon-green">
            ${snapshots[snapshots.length - 1]?.equity.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
