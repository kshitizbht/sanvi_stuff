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
    setEditPrompt('');
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
      // Create fallback story with user input
      const fallbackStory = createFallbackStory(topic);
      setStory(fallbackStory);
      setAppState(AppState.READING);
      // Cache the placeholder image
      setCachedImages({ 0: fallbackStory.pages[0].imageUrl! });
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

  // Create a fallback story when generation fails
  const createFallbackStory = (userInput: string): Story => {
    const placeholderImageUrl = 'data:image/png;base64,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';
    
    return {
      title: userInput,
      pages: [
        {
          text: 'Story generation failed - please try again later (likely rate limits issue)',
          imageDescription: 'Story generation failed - please try again later (likely rate limits issue)',
          imageUrl: placeholderImageUrl
        }
      ]
    };
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
      <div className="h-screen flex flex-col items-center py-3 px-2 md:py-4 md:px-4 lg:px-8 max-w-5xl mx-auto overflow-hidden">
        {/* Header */}
        <div className="w-full flex justify-between items-center mb-2 md:mb-3">
           <button onClick={handleRestart} className="p-1.5 md:p-2 rounded-full hover:bg-gray-200 text-gray-500 transition">
             <RefreshCcw size={18} className="md:w-6 md:h-6" />
           </button>
           <h2 className="text-xs md:text-base lg:text-xl font-bold text-gray-600 bg-white px-2 md:px-3 py-0.5 rounded-full shadow-sm">
             Page {currentPageIndex + 1} of {story.pages.length}
           </h2>
           <div className="w-8 md:w-10"></div> {/* Spacer */}
        </div>

        {/* Book Content */}
        <div className="bg-white rounded-xl md:rounded-2xl lg:rounded-[40px] shadow-lg md:shadow-2xl overflow-hidden w-full flex-grow flex flex-col border-b-4 md:border-b-8 border-gray-200">
           {/* Image Area */}
           <div className="w-full aspect-video bg-gray-100 relative group overflow-hidden max-h-[40vh]">
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
           <div className="p-2 md:p-4 lg:p-8 flex flex-col items-center justify-center flex-grow bg-white">
             <div className="flex flex-wrap justify-center gap-y-1 md:gap-y-2 leading-tight text-xs md:text-sm lg:text-base">
               {page.text.split(' ').map((word, idx) => (
                 <Word key={`${currentPageIndex}-${idx}`} text={word} />
               ))}
             </div>
             
             <div className="mt-2 md:mt-4 flex items-center gap-1 md:gap-2 text-gray-400 text-xs">
               <Volume2 size={12} className="md:w-4 md:h-4" />
               <span className="text-xs md:text-sm">Tap or hover words to hear them</span>
             </div>
           </div>
        </div>

        {/* Navigation */}
        <div className="w-full flex justify-between items-center mt-2 md:mt-4 px-2 md:px-4 gap-2">
           <button 
             onClick={goToPrevPage} 
             disabled={currentPageIndex === 0 || isEditingImage}
             className={`flex items-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-2xl font-bold text-xs md:text-lg transition-all ${
               currentPageIndex === 0 || isEditingImage
                 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                 : 'bg-white text-green-600 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
             }`}
           >
             <ChevronLeft size={18} className="md:w-7 md:h-7" /> <span className="hidden sm:inline">Previous</span>
           </button>

           <button 
             onClick={goToNextPage}
             disabled={isEditingImage}
             className={`flex items-center gap-1 md:gap-2 px-3 md:px-8 py-2 md:py-4 rounded-lg md:rounded-2xl font-bold text-xs md:text-xl text-white shadow-lg transition-all ${
                isEditingImage 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600 hover:shadow-xl hover:scale-105 active:scale-95'
             }`}
           >
             {currentPageIndex === story.pages.length - 1 ? (
               <><span className="hidden sm:inline">Finish Book</span> <span className="sm:hidden">Finish</span> <Sparkles size={16} className="md:w-6 md:h-6 animate-pulse" /></>
             ) : (
               <><span className="hidden sm:inline">Next Page</span> <span className="sm:hidden">Next</span> <ChevronRight size={18} className="md:w-7 md:h-7" /></>
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