export interface Resource {
  id: number;
  title: string;
  description: string;
  category: 'blog' | 'video' | 'article' | 'tool';
  url: string;
  imageUrl?: string;
  date?: string;
}

export const resources: Resource[] = [
  {
    id: 1,
    title: "Understanding Heart Disease: A Comprehensive Guide",
    description: "Learn about different types of heart diseases, their symptoms, and prevention methods.",
    category: "blog",
    url: "#",
    imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef",
    date: "2024-03-15"
  },
  {
    id: 2,
    title: "Heart-Healthy Diet: What to Eat and Avoid",
    description: "Discover the best foods for heart health and which ones to limit in your diet.",
    category: "article",
    url: "#",
    imageUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352"
  },
  {
    id: 3,
    title: "Exercise for Heart Health: A Beginner's Guide",
    description: "Simple exercises and routines to improve your cardiovascular health.",
    category: "video",
    url: "#",
    imageUrl: "https://i.ytimg.com/vi/dj03_VDetdw/hqdefault.jpg?sqp=-oaymwEnCNACELwBSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLBM7xC6ZvwMvE0zz2b6sSfRGXLePQ"
  }
]; 