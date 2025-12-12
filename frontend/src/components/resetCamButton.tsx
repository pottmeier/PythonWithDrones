"use client";

import { FoldVertical } from "lucide-react";

interface ResetCameraButtonProps {
  controlsRef: React.MutableRefObject<any>;
  startPosition: [number, number, number];
  startTarget: [number, number, number];
}

export default function ResetCameraButton({
  controlsRef,
  startPosition,
  startTarget
}: ResetCameraButtonProps) {
  const handleReset = () => {
    if (!controlsRef.current) return;
    const cam = controlsRef.current.object;
    const target = controlsRef.current.target;

    cam.position.set(...startPosition);
    target.set(...startTarget);
    controlsRef.current.update();
  };

  return (
    <button
      className="absolute top-4 left-4 text-md cursor-pointer"
      onClick={handleReset}
    >
      <FoldVertical size={20} />
    </button>
  );
}
