import { forwardRef } from "react";

const Compass = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div className="relative w-28 h-28 rounded-full bg-black/20 backdrop-blur-md border border-white flex items-center justify-center pointer-events-none">
      <div className="absolute inset-1 rounded-full border border-white/30" />

      <div
        ref={ref}
        className="absolute w-full h-full flex items-center justify-center"
        style={{ transition: "transform 0.08s linear" }}
      >
        <div className="absolute top-3 flex flex-col items-center">
          <div className="w-0 h-0 border-l-[7px] border-r-[7px] border-b-[16px] border-l-transparent border-r-transparent border-b-red-500" />
          <div className="w-1 h-7 bg-red-500 rounded" />
        </div>

        <div className="absolute bottom-4 rotate-180 opacity-40">
          <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[14px] border-l-transparent border-r-transparent border-b-white" />
        </div>
      </div>

      <div className="absolute w-1.5 h-1.5 rounded-full bg-white/70" />

      <span className="absolute top-1 left-1/2 -translate-x-1/2 text-red-400 font-bold text-md">
        N
      </span>
      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white text-md">
        S
      </span>
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-md">
        E
      </span>
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white text-md">
        W
      </span>
    </div>
  );
});

export default Compass;
