export interface StoryPage {
  text: string;
  imageDescription: string;
  imageUrl?: string; // Populated after generation
}

export interface Story {
  title: string;
  pages: StoryPage[];
}

export interface Balloon {
  id: number;
  x: number;
  color: string;
  speed: number;
}
