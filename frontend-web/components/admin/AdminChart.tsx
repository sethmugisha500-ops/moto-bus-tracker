'use client';

import { useState, useEffect } from 'react';

export default function AdminChart() {
  const [chartData] = useState([12, 28, 45, 62, 55, 48, 72, 88, 95, 82, 74, 61, 55, 68, 78, 85, 90, 75]);
  const [cancelData] = useState([2, 4, 6, 8, 5, 4, 7, 10, 9, 8, 6, 5, 4, 6, 7, 8, 9, 6]);
  const [max, setMax] = useState(0);

  useEffect(() => {
    setMax(Math.max(...chartData));
  }, [chartData]);

  return (
    <div className="bg-bg3 border border-border rounded-lg p-5 mb-4">
      <div className="flex justify-between items-center mb-5">
        <span className="text-xs font-medium">Rides per hour — today</span>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[11px] text-muted">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-[11px] text-muted">Cancelled</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-end gap-1 h-20">
        {chartData.map((val, i) => (
          <div key={i} className="flex-1 flex flex-col gap-0.5 items-center h-full justify-end">
            <div
              className="w-full rounded-t-sm bg-green-500/70 transition-all hover:opacity-80"
              style={{ height: `${(val / max) * 100}%`, minHeight: '4px' }}
            />
            <div
              className="w-full rounded-t-sm bg-orange-500/60 transition-all hover:opacity-80"
              style={{ height: `${(cancelData[i] / max) * 100}%`, minHeight: '4px' }}
            />
          </div>
        ))}
      </div>
      
      <div className="flex justify-between text-[10px] text-muted mt-2 px-0.5">
        <span>6am</span><span>8am</span><span>10am</span><span>12pm</span><span>2pm</span><span>4pm</span><span>6pm</span><span>8pm</span><span>10pm</span>
      </div>
    </div>
  );
}