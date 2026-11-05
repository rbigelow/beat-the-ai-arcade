import { lazy } from 'react'

// Adding a game: 1) create a component in src/games, 2) add an entry here.
export const GAMES = [
  { id: 'human-or-ai', title: 'Human or AI?', icon: '🧠', category: 'Generative AI', tagline: 'Can you tell what AI created?', component: lazy(() => import('../games/HumanOrAI.jsx')) },
  { id: 'train-your-own-ai', title: 'Train Your Own AI', icon: '🤖', category: 'Machine Learning', tagline: 'Teach a model and test it.', component: lazy(() => import('../games/TrainYourOwnAI.jsx')) },
  { id: 'tic-tac-ai', title: 'Tic-Tac-AI', icon: '❌', category: 'Search Algorithms', tagline: 'Can you beat an unbeatable AI?', component: lazy(() => import('../games/TicTacAI.jsx')) },
  { id: 'cyber-detective', title: 'Cyber Detective', icon: '🔐', category: 'AI + Cybersecurity', tagline: 'Can you spot the attack?', component: lazy(() => import('../games/CyberDetective.jsx')) },
  { id: 'rock-paper-scissors', title: 'Rock Paper Scissors AI', icon: '✋', category: 'Computer Vision', tagline: 'Challenge computer vision.', component: lazy(() => import('../games/RockPaperScissors.jsx')) },
  { id: 'drawing-recognition', title: 'Drawing Recognition', icon: '🎨', category: 'Computer Vision', tagline: 'Can AI recognize your drawing?', component: lazy(() => import('../games/DrawingRecognition.jsx')) },
  { id: 'flappy-ai', title: 'Flappy AI', icon: '🐦', category: 'Evolutionary AI', tagline: 'Watch an AI learn to fly.', component: lazy(() => import('../games/FlappyAI.jsx')) },
  { id: 'maze-escape', title: 'AI Maze Escape', icon: '🧩', category: 'Search Algorithms', tagline: 'Watch AI find the fastest route.', component: lazy(() => import('../games/AIMazeEscape.jsx')) },
  { id: 'sound-detective', title: 'AI Sound Detective', icon: '🎤', category: 'Audio Classification', tagline: 'Can AI identify your sound?', component: lazy(() => import('../games/AISoundDetective.jsx')) },
]
