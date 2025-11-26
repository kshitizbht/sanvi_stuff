import React, { useState, useEffect, useCallback } from 'react';
import { Balloon } from '../types';

interface BalloonGameProps {
  onRestart: () => void;
}

const BalloonGame: React.FC<BalloonGameProps> = ({ onRestart }) => {
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [score, setScore] = useState(0);

  const spawnBalloon = useCallback(() => {
    const id = Date.now() + Math.random();
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
    const newBalloon: Balloon = {
      id,
      x: Math.random() * 80 + 10, // 10% to 90% width
      color: colors[Math.floor(Math.random() * colors.length)],
      // Super slow speed for kids: 0.5 to 1.0 (was 1.5 to 2.5)
      // Animation duration = 10 / speed. 
      // speed 0.5 = 20 seconds. speed 1.0 = 10 seconds.
      speed: Math.random() * 0.5 + 0.5, 
    };

    setBalloons((prev) => [...prev, newBalloon]);
  }, []);

  useEffect(() => {
    // Spawn a balloon every 1.5 seconds (slower spawn rate too)
    const interval = setInterval(spawnBalloon, 1500);
    return () => clearInterval(interval);
  }, [spawnBalloon]);

  const popBalloon = (id: number) => {
    setBalloons((prev) => prev.filter((b) => b.id !== id));
    setScore((s) => s + 1);
    
    // Play pop sound
    const audio = new AudioContext();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.frequency.setValueAtTime(400, audio.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audio.currentTime + 0.1);
    gain.gain.setValueAtTime(0.5, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audio.currentTime + 0.1);
    osc.start();
    osc.stop(audio.currentTime + 0.1);
  };

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden bg-sky-200 rounded-3xl shadow-inner border-4 border-sky-400">
      <div className="absolute top-4 left-4 z-10 bg-white/80 px-4 py-2 rounded-full text-2xl font-bold text-sky-700 shadow-lg">
        Score: {score}
      </div>
      
      <div className="absolute top-4 right-4 z-10">
        <button 
            onClick={onRestart}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-full shadow-lg transform transition hover:scale-105"
        >
            Read Again!
        </button>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sky-700/50 font-bold text-xl pointer-events-none">
        Pop the balloons!
      </div>

      {balloons.map((b) => (
        <div
          key={b.id}
          onClick={() => popBalloon(b.id)}
          className={`absolute cursor-pointer balloon-anim ${b.color} w-20 h-24 rounded-[50%_50%_50%_50%_/_40%_40%_60%_60%] shadow-lg hover:brightness-110 active:scale-90`}
          style={{ left: `${b.x}%`, animationDuration: `${10 / b.speed}s` }}
        >
          {/* Balloon string */}
          <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gray-600/50"></div>
          {/* Shine */}
          <div className="absolute top-4 left-4 w-4 h-8 bg-white/30 rounded-full -rotate-12"></div>
        </div>
      ))}
    </div>
  );
};

export default BalloonGame;