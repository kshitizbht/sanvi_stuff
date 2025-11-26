import React, { useState, useEffect } from 'react';
import { generateStoryContent, generateStoryImage, editStoryImage } from './services/geminiService';
import { Story, StoryPage } from './types';
import Word from './components/Word';
import BalloonGame from './components/BalloonGame';
import Confetti from './components/Confetti';
import { BookOpen, Sparkles, ChevronLeft, ChevronRight, RefreshCcw, Wand2, Gamepad2, Volume2, Pencil, Star } from 'lucide-react';

enum AppState {
  SETUP,
  LOADING_STORY,
  READING,
  FINISHED
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [topic, setTopic] = useState('');
  const [story, setStory] = useState<Story | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [cachedImages, setCachedImages] = useState<Record<number, string>>({});
  
  // Image Editing State
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditingImage, setIsEditingImage] = useState(false);

  // Reset state to start over
  const handleRestart = () => {
    setAppState(AppState.SETUP);
    setStory(null);
    setCurrentPageIndex(0);
    setCachedImages({});
    setTopic('');
    setEditPrompt('A funny cat who is a fix-it all.');
    setIsEditingImage(false);
  };

  const handleGenerateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setAppState(AppState.LOADING_STORY);
    try {
      const generatedStory = await generateStoryContent(topic);
      setStory(generatedStory);
      setAppState(AppState.READING);
      // Immediately start fetching the first image
      fetchImageForPage(0, generatedStory.pages[0].imageDescription);
      // Pre-fetch second image if it exists
      if(generatedStory.pages.length > 1) {
         fetchImageForPage(1, generatedStory.pages[1].imageDescription);
      }
    } catch (err) {
      console.error(err);
      alert("Oops! The magic wand slipped. Please try again.");
      setAppState(AppState.SETUP);
    }
  };

  const fetchImageForPage = async (index: number, prompt: string) => {
    if (cachedImages[index]) return; // Already cached
    
    // Set loading state only if we are waiting for the CURRENT page
    if (index === currentPageIndex) setIsLoadingImage(true);
    
    try {
      const imageUrl = await generateStoryImage(prompt);
      setCachedImages(prev => ({ ...prev, [index]: imageUrl }));
    } catch (e) {
      console.error("Failed to load image", e);
    } finally {
      if (index === currentPageIndex) setIsLoadingImage(false);
    }
  };

  const handleEditImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrompt.trim() || !cachedImages[currentPageIndex]) return;

    setIsEditingImage(true);
    try {
        const currentImage = cachedImages[currentPageIndex];
        const newImage = await editStoryImage(currentImage, editPrompt);
        // Update cache with edited image
        setCachedImages(prev => ({ ...prev, [currentPageIndex]: newImage }));
        setEditPrompt(''); // Clear input on success
    } catch (err) {
        console.error(err);
        alert("Oops! Couldn't change the picture. Try a different spell!");
    } finally {
        setIsEditingImage(false);
    }
  };

  useEffect(() => {
    // When current page changes, ensure we have the image or fetch it
    if (appState === AppState.READING && story) {
      const page = story.pages[currentPageIndex];
      // Reset edit prompt when changing pages
      setEditPrompt('');
      
      if (!cachedImages[currentPageIndex]) {
        fetchImageForPage(currentPageIndex, page.imageDescription);
      }
      
      // Prefetch next page
      const nextIndex = currentPageIndex + 1;
      if (nextIndex < story.pages.length && !cachedImages[nextIndex]) {
        fetchImageForPage(nextIndex, story.pages[nextIndex].imageDescription);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageIndex, appState, story]); // Intentionally excluding cachedImages to avoid loops

  const goToNextPage = () => {
    if (!story) return;
    if (currentPageIndex < story.pages.length - 1) {
      setCurrentPageIndex(prev => prev + 1);
    } else {
      setAppState(AppState.FINISHED);
    }
  };

  const goToPrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  // Render Helpers
  const renderSetup = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center relative overflow-hidden">
      {/* Background Stars for the 'Black' theme */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              animationDuration: `${Math.random() * 3 + 2}s`
            }}
          />
        ))}
      </div>

      <div className="z-10 bg-slate-900/80 backdrop-blur-md p-8 md:p-12 rounded-3xl shadow-[0_0_40px_rgba(74,222,128,0.2)] border border-slate-700 max-w-lg w-full transform transition hover:scale-[1.01]">
        <div className="mb-6 flex justify-center">
            <div className="bg-slate-800 p-5 rounded-full ring-4 ring-green-400/30">
                <BookOpen size={64} className="text-green-400" />
            </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
          Story Magic
        </h1>
        <p className="text-xl text-slate-300 mb-8 font-medium">
          What should we read about tonight?
        </p>
        
        <form onSubmit={handleGenerateStory} className="space-y-6">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., A funny cat, A brave dog"
            className="w-full bg-slate-800 text-white text-2xl p-4 border-4 border-slate-600 rounded-2xl focus:border-green-400 focus:outline-none focus:ring-4 focus:ring-green-400/20 transition-all text-center placeholder:text-slate-500 font-bold"
            autoFocus
          />
          <button
            type="submit"
            disabled={!topic.trim()}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-2xl font-bold py-4 px-8 rounded-2xl shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Wand2 className="w-8 h-8 animate-pulse text-yellow-300" />
            Make Magic!
          </button>
        </form>
      </div>
    </div>
  );

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="bg-white p-10 rounded-3xl shadow-xl flex flex-col items-center animate-bounce">
        <Sparkles size={64} className="text-yellow-400 mb-4 animate-spin-slow" />
        <h2 className="text-3xl font-bold text-gray-700">Writing your story...</h2>
        <p className="text-gray-500 mt-2">Our magical elves are thinking!</p>
      </div>
    </div>
  );

  const renderReading = () => {
    if (!story) return null;
    const page = story.pages[currentPageIndex];
    const image = cachedImages[currentPageIndex];
    const isImageLoading = !image || (isLoadingImage && !image);

    return (
      <div className="min-h-screen flex flex-col items-center py-6 px-4 md:px-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="w-full flex justify-between items-center mb-6">
           <button onClick={handleRestart} className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition">
             <RefreshCcw size={24} />
           </button>
           <h2 className="text-xl md:text-2xl font-bold text-gray-600 bg-white px-4 py-1 rounded-full shadow-sm">
             Page {currentPageIndex + 1} of {story.pages.length}
           </h2>
           <div className="w-10"></div> {/* Spacer */}
        </div>

        {/* Book Content */}
        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden w-full flex-grow flex flex-col border-b-8 border-gray-200">
           {/* Image Area */}
           <div className="w-full aspect-square md:aspect-video bg-gray-100 relative group overflow-hidden">
              {(isImageLoading || isEditingImage) ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-50/80 backdrop-blur-sm z-10">
                  <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="font-medium animate-pulse">{isEditingImage ? "Applying magic..." : "Drawing picture..."}</p>
                </div>
              ) : null}
              
              {image && (
                <img 
                  src={image} 
                  alt={page.imageDescription} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
              )}
           </div>

           {/* Magic Edit Bar - Only visible if we have an image */}
           {image && !isImageLoading && !isEditingImage && (
             <div className="bg-gray-50 border-b border-gray-100 p-2 flex justify-center">
                <form onSubmit={handleEditImage} className="flex gap-2 w-full max-w-md">
                    <input 
                        type="text" 
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        placeholder="Magic edit: e.g. 'Add a hat' or 'Make it sunny'"
                        className="flex-grow px-4 py-2 rounded-xl border border-gray-300 focus:border-green-500 focus:outline-none text-sm text-gray-700"
                    />
                    <button 
                        type="submit" 
                        disabled={!editPrompt.trim()}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Pencil size={14} /> Edit
                    </button>
                </form>
             </div>
           )}

           {/* Text Area */}
           <div className="p-6 md:p-12 flex flex-col items-center justify-center flex-grow bg-white min-h-[200px]">
             <div className="flex flex-wrap justify-center gap-y-2 leading-tight">
               {page.text.split(' ').map((word, idx) => (
                 <Word key={`${currentPageIndex}-${idx}`} text={word} />
               ))}
             </div>
             
             <div className="mt-8 flex items-center gap-2 text-gray-400 text-sm">
               <Volume2 size={16} />
               <span>Tap or hover words to hear them</span>
             </div>
           </div>
        </div>

        {/* Navigation */}
        <div className="w-full flex justify-between items-center mt-8 px-4">
           <button 
             onClick={goToPrevPage} 
             disabled={currentPageIndex === 0 || isEditingImage}
             className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-lg transition-all ${
               currentPageIndex === 0 || isEditingImage
                 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                 : 'bg-white text-green-600 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
             }`}
           >
             <ChevronLeft size={28} /> Previous
           </button>

           <button 
             onClick={goToNextPage}
             disabled={isEditingImage}
             className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-xl text-white shadow-lg transition-all ${
                isEditingImage 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600 hover:shadow-xl hover:scale-105 active:scale-95'
             }`}
           >
             {currentPageIndex === story.pages.length - 1 ? (
               <>Finish Book <Sparkles className="animate-pulse" /></>
             ) : (
               <>Next Page <ChevronRight size={28} /></>
             )}
           </button>
        </div>
      </div>
    );
  };

  const renderFinished = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden relative">
      <Confetti />
      
      <div className="z-10 w-full max-w-4xl bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-2xl border-4 border-yellow-300 animate-fade-in-up">
        <div className="text-center mb-6">
          <h2 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
            Congratulations!
          </h2>
          <p className="text-2xl text-gray-600 font-bold">You read the whole story!</p>
        </div>

        {/* The Game Area */}
        <div className="h-[500px] w-full mb-6">
          <BalloonGame onRestart={handleRestart} />
        </div>
        
        <div className="text-center">
            <p className="text-gray-500 mb-2 flex items-center justify-center gap-2">
                <Gamepad2 size={20} />
                Pop balloons for fun!
            </p>
        </div>
      </div>
    </div>
  );

  // Dynamic background based on state
  const getBackgroundClass = () => {
    switch (appState) {
      case AppState.SETUP: return 'bg-black'; // Pure black for setup as requested
      case AppState.LOADING_STORY: return 'bg-blue-50';
      case AppState.READING: return 'bg-gradient-to-b from-green-50 to-blue-50';
      case AppState.FINISHED: return 'bg-gradient-to-r from-purple-100 to-pink-100';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className={`min-h-screen selection:bg-yellow-200 transition-colors duration-1000 ${getBackgroundClass()}`}>
      {appState === AppState.SETUP && renderSetup()}
      {appState === AppState.LOADING_STORY && renderLoading()}
      {appState === AppState.READING && renderReading()}
      {appState === AppState.FINISHED && renderFinished()}
    </div>
  );
};

export default App;