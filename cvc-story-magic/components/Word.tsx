import React, { useCallback } from 'react';

interface WordProps {
  text: string;
}

const Word: React.FC<WordProps> = ({ text }) => {
  const speak = useCallback(() => {
    // Clean text for speech (remove punctuation)
    const cleanText = text.replace(/[^a-zA-Z0-9]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1; // Slightly slower for kids
    utterance.pitch = 1.1; // Slightly higher pitch
    window.speechSynthesis.cancel(); // Stop previous
    window.speechSynthesis.speak(utterance);
  }, [text]);

  return (
    <span
      onMouseEnter={speak}
      onClick={speak}
      className="inline-block mx-1.5 px-1 py-0.5 rounded-lg cursor-pointer hover:bg-yellow-200 hover:scale-110 hover:text-blue-600 transition-all duration-200 select-none text-3xl md:text-5xl font-bold text-gray-800"
    >
      {text}
    </span>
  );
};

export default Word;
