'use client';

export default function PhoneMockup() {
  return (
    <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2 z-10 animate-float">
      <div className="relative">
        <div className="w-[280px] bg-[#131A14] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="flex justify-between items-center px-5 pt-3.5 pb-2 text-xs font-medium">
            <span>9:41</span>
            <div className="flex gap-1 items-center">
              <div className="w-3.5 h-2 border border-white/40 rounded-sm relative">
                <div className="absolute left-0.5 top-0.5 bottom-0.5 w-[70%] bg-green-500 rounded-[1px]" />
              </div>
            </div>
          </div>
          
          <div className="relative h-[220px] bg-[#0D1510] overflow-hidden">
            {/* Grid lines */}
            <div className="absolute left-0 right-0 top-1/3 h-px bg-white/5" />
            <div className="absolute left-0 right-0 top-2/3 h-px bg-white/5" />
            <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/5" />
            <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/5" />
            
            {/* Roads */}
            <div className="absolute left-0 right-0 top-1/2 h-1.5 bg-green-500/15 -translate-y-1/2" />
            <div className="absolute top-0 bottom-0 left-1/2 w-1.5 bg-green-500/15 -translate-x-1/2" />
            
            {/* Buildings */}
            <div className="absolute left-[12%] top-[15%] w-[22%] h-[14%] bg-white/5 rounded-sm" />
            <div className="absolute left-[60%] top-[15%] w-[18%] h-[18%] bg-white/5 rounded-sm" />
            <div className="absolute left-[12%] top-[65%] w-[16%] h-[12%] bg-white/5 rounded-sm" />
            <div className="absolute left-[65%] top-[65%] w-[20%] h-[15%] bg-white/5 rounded-sm" />
            
            {/* Pin */}
            <div className="absolute left-[42%] top-[28%] w-7 h-7 bg-green-500 rounded-[50%_50%_50%_0] -rotate-45 flex items-center justify-center shadow-lg">
              <div className="w-2 h-2 rounded-full bg-bg rotate-45" />
            </div>
            
            {/* Moving moto */}
            <div className="absolute w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-[10px] animate-drive shadow-lg">
              🏍
            </div>
          </div>
          
          <div className="p-4 bg-[#131A14]">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3.5">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-[11px] font-semibold text-green-500 uppercase tracking-wide">Ride in progress</span>
                <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">2 min away</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  KG 11 Ave, Kacyiru
                </div>
                <div className="w-px h-3 bg-border ml-1" />
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  Kigali Convention Centre
                </div>
              </div>
              <div className="flex gap-3 mt-3 pt-2.5 border-t border-border">
                <div className="flex items-center gap-1.5 text-[11px] text-muted">
                  <div className="w-3.5 h-3.5 rounded-full bg-green-500/20" />
                  RWF 1,800
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted">
                  <div className="w-3.5 h-3.5 rounded-full bg-green-500/20" />
                  8 min ETA
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted">
                  <div className="w-3.5 h-3.5 rounded-full bg-green-500/20" />
                  4.9 ★
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}