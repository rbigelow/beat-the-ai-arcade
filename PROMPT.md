# GitHub Copilot Project Prompt
# Open House: Beat the AI Arcade
## PROJECT OVERVIEW
Create a polished, production-ready interactive web application called:
# BEAT THE AI ARCADE
Tagline:
> Can you beat the AI?
The application is intended for an Applied AI program exhibit at a Georgian College open house.
The experience should feel like a modern interactive technology exhibit or digital arcade rather than a traditional academic website.
Visitors should be able to approach a touchscreen or laptop, immediately understand the experience, select an AI challenge, play or observe for approximately 1 to 3 minutes, understand what the AI is doing behind the scenes, learn the AI concept demonstrated by the activity, and return to the Arcade home screen.
The application must be:
- Visually exciting
- Touchscreen friendly
- Responsive
- Accessible
- Easy for high-school students and prospective students to understand
- Suitable for a large open-house display
- Fast to reset between visitors
- Kiosk friendly
- Modular and maintainable
- Capable of running locally using Vite
- Built primarily with browser/client-side technologies
- Designed so additional games can be added later
- Honest about which demonstrations use AI models, algorithms, simulations, or educational approximations
- Fully functional and self-contained wherever practical
The primary educational goal is:
> Make AI visible.
Visitors should not only see the result. They should also see, in simple visual terms, what information the AI receives, what it does with that information, and how it arrives at a decision.

# 1. TECHNOLOGY STACK
Use:
- React
- Vite
- JavaScript/JSX
- Tailwind CSS
- Framer Motion
- Lucide React
- MediaPipe Tasks Vision
- TensorFlow.js
- TensorFlow.js Speech Commands where appropriate
- Web Audio API
- HTML Canvas API
- ESLint
Do not use TypeScript.
Install required packages:
 bash
npm install
npm install framer-motion lucide-react
npm install @mediapipe/tasks-vision
npm install @tensorflow/tfjs
npm install @tensorflow-models/speech-commands
npm install tailwindcss @tailwindcss/vite
 
The application should run with:
 bash
npm run dev
 
It must produce a production build with:
 bash
npm run build
 
It must pass:
 bash
npm run lint
 
Do not require a backend server for the initial implementation.
All demonstrations should run primarily in the browser.
Where practical, package model assets locally for open-house reliability.

# 2. BRANDING
The application should visually align with Georgian College branding.
Use the following Georgian College brand colours as CSS design tokens.
## Primary colours
Georgian Blue:#004B87
 
Georgian Green:#64A70B
 
## Secondary colours
Teal:#00778B

Light Blue:#77C5D5
Dark Grey:#333F48
 
## Accent colours
Orange:#E57200
Yellow:#F3D03E
Neutral:#C4BFB6
 
## Supporting colours
White:#FFFFFF
Very dark navy arcade background:#061523
 
Dark card background:#0B2235
 
Use Georgian blue and green as the dominant institutional accents.
Use teal and light blue for AI/data visualizations.
Use yellow and orange sparingly for:
- Scores
- Achievements
- Warnings
- Important AI decisions
- Highlighted search states


# 3. BRAND DESIGN TOKENS
Define reusable CSS variables.
Example:
 css
:root {
  --georgian-blue: #004b87;
  --georgian-green: #64a70b;
  --georgian-teal: #00778b;
  --georgian-light-blue: #77c5d5;
  --georgian-dark-grey: #333f48;
  --georgian-orange: #e57200;
  --georgian-yellow: #f3d03e;
  --georgian-neutral: #c4bfb6;
  --arcade-background: #061523;
  --arcade-card: #0b2235;
}
 
Use these tokens consistently.
Do not scatter approximations of Georgian colours throughout individual components.

# 4. LOGO PLACEHOLDER
Assume the authorized logo will eventually be placed at:
 public/logo.png

on every primary screen.
The header on every page/game should contain:
 
[ logo.png ]
BEAT THE AI ARCADE
Can you beat the AI?
 
The footer may also display the logo.
If `logo.png` cannot be loaded, the application must remain functional.
Provide a neutral placeholder preserving the intended logo dimensions.


# 5. VISUAL DESIGN
Design the experience as:
> A futuristic AI arcade combined with Georgian College branding.
Use:
Use large headings, generous spacing, rounded cards, subtle shadows, and high-contrast, touch-friendly controls. Add smooth hover states and clear icons. Use Georgian blue/green accents, teal data visuals, dark arcade backgrounds, and yellow/orange highlights.

Avoid excessive neon or gradients, tiny text, dense navigation, clutter, generic dashboard styling, and long game-screen copy.
Cards should generally use:
 
border-radius: 24px to 32px
Buttons should have minimum touch heights around:48px to 56px
 

# 6. TYPOGRAPHY
Use a modern, highly readable sans-serif stack unless authorized brand fonts are provided.
Fallback:
 css
font-family:
  Arial,
  Helvetica,
  system-ui,
  sans-serif;
 
Use:
- Large bold headings
- Short explanatory copy
- High readability
- Strong visual hierarchy
Do not download proprietary brand fonts unless font files and permissions are provided.

# 7. GLOBAL HEADER
Create reusable:
 
ArcadeHeader
It must appear on:
- Home
- Human or AI?
- Train Your Own AI
- Tic-Tac-AI
- Cyber Detective
- Rock Paper Scissors AI
- Drawing Recognition
- Flappy AI
- AI Maze Escape
- AI Sound Detective
Header:
 
[ LOGO.PNG ]
BEAT THE AI ARCADE
Can you beat the AI?
 
When inside a game include:
 
← Back to Arcade
 

# 8. HOME SCREEN
Heading:
# BEAT THE AI ARCADE
Tagline:
# Can you beat the AI?
Supporting copy:
> Test your skills against artificial intelligence through a collection of quick, interactive challenges. Discover how AI sees, learns, searches, listens, predicts and sometimes gets things wrong.
Display:
 
CHOOSE YOUR CHALLENGE
 
There are now NINE game cards.
## Desktop
 
3 × 3 grid
 
## Tablet
 
2 cards per row
 
## Mobile
 
1 card per row
 
Cards:
🧠
HUMAN OR AI?
Can you tell what AI created?
GENERATIVE AI
 
🤖
TRAIN YOUR OWN AI
Teach a model and test it.
MACHINE LEARNING
 
❌
TIC-TAC-AI
Can you beat an unbeatable AI?
SEARCH ALGORITHMS
 
🔐
CYBER DETECTIVE
Can you spot the attack?
AI + CYBERSECURITY
 
✋
ROCK PAPER SCISSORS AI
Challenge computer vision.
COMPUTER VISION
 
🎨
DRAWING RECOGNITION
Can AI recognize your drawing?
COMPUTER VISION
 
🐦
FLAPPY AI
Watch an AI learn to fly.
EVOLUTIONARY AI
 
🧩
AI MAZE ESCAPE
Watch AI find the fastest route.
SEARCH ALGORITHMS
 
🎤
AI SOUND DETECTIVE
Can AI identify your sound?
AUDIO CLASSIFICATION
 
# 9. BEHIND-THE-SCENES REQUIREMENT
Every demonstration must include:
# BEHIND THE SCENES
The panel must visually answer:
 
What information does the AI receive?
What processing happens?
What decision is being made?
How was the decision selected?
How confident is the model?
What might cause the system to fail?
 
Use a visual pipeline:
 
INPUT
  ↓
PROCESSING
  ↓
MODEL / ALGORITHM
  ↓
DECISION
  ↓
RESULT
 
Each stage should:
- Highlight while active
- Use plain language
- Show live values where appropriate
- Animate data moving through the process
- Provide optional deeper explanations
Include:
 
LEARN MORE
 
The default explanation should be understandable in about 15 seconds.
Do not overwhelm visitors with unexplained raw technical information.

# 10. GAME 1: HUMAN OR AI?
Card:
 
🧠
HUMAN OR AI?
Can you tell what AI created?
GENERATIVE AI
 
Create five rounds.
Each round:
 
OPTION A
VS.
OPTION B
 
Ask:
 
Which one was generated by AI?
 
Categories:
1. Product description
2. Short story
3. Python code
4. Resume statement
5. Social media post
Reveal:
 
CORRECT!
 
or:
 
NOT THIS TIME
 
Then identify:
 
AI GENERATED
 
and:
 
HUMAN
 
Track:
 
Round 1 / 5
Score: 1
 
Final screen:
 
AI DETECTIVE
YOUR SCORE
4 / 5
 
Include:
 
PLAY AGAIN
BACK TO ARCADE
 
Teaching message:
> AI-generated content can sometimes contain stylistic patterns, but style alone cannot reliably prove authorship.
Behind the scenes:
 
CONTENT
   ↓
PATTERN CLUES
   ↓
YOUR DECISION
   ↓
REVEAL
 
Clearly explain that this game teaches AI literacy and is not a reliable AI-content detector.

# 11. GAME 2: TRAIN YOUR OWN AI
Card:
 
🤖
TRAIN YOUR OWN AI
Teach a model and test it.
MACHINE LEARNING
 
Show:
 
TRAINING DATA
      ↓
LABELS
      ↓
TRAINING
      ↓
MODEL
      ↓
PREDICTION
 
Categories:
 
😀 Positive
😐 Neutral
😡 Negative
 
Provide starter examples.
Visitors can:
- Add examples
- Select labels
- Train
- Enter new sentences
- Classify
Display:
 
Training model...
████████████████ 100%
MODEL READY
 
Then:
 
AI PREDICTION
😀 POSITIVE
Confidence: 86%
 
Teaching message:
> Machine-learning systems learn patterns from labelled examples and use those patterns to classify new data.
If keyword-based, display:
 
EDUCATIONAL CLASSIFIER
 
Do not claim a neural network was trained unless a genuine neural-network model is implemented.
Behind the scenes visualize:
 
EXAMPLES
   ↓
WORDS / FEATURES
   ↓
CATEGORY SCORES
   ↓
HIGHEST SCORE
   ↓
PREDICTION
 

# 12. GAME 3: TIC-TAC-AI
Card:
 
❌
TIC-TAC-AI
Can you beat an unbeatable AI?
SEARCH ALGORITHMS
Visitor:X
AI:O
 
Implement:Minimax
 
The AI should be mathematically unbeatable.
Display:
 
YOUR TURN
 
then:
 
AI THINKING...
 
End states:
 
AI WINS
 
 
TIE GAME
 
or, if a bug allows it:
 
YOU BEAT THE AI!
 
Behind the scenes display a simplified decision tree:
 
CURRENT BOARD
    ↓
POSSIBLE MOVES
    ↓
FUTURE BOARDS
    ↓
WIN / LOSS / TIE SCORES
    ↓
BEST MOVE
 
Show calculated metrics where possible:
 
Boards evaluated
Search depth
Decision time
 
Do not fabricate metrics.
Teaching message:
> Minimax explores possible future moves and chooses the move that leads to the best outcome against an optimal opponent.
Transparency:
 
SEARCH ALGORITHM
Minimax
 
Do not describe Minimax as a neural network.

# 13. GAME 4: CYBER DETECTIVE
Card:
 
🔐
CYBER DETECTIVE
Can you spot the attack?
AI + CYBERSECURITY
 
Create five rounds.
Present safe simulated messages.
Example:
 
Your Microsoft 365 account expires TODAY.
Verify your password immediately.
[ fictional suspicious link ]
 
Visitor selects:
 
🚨 PHISHING
 
or:
 
✓ LEGITIMATE
 
Display:
 
AI ANALYSIS
⚠ Urgency
⚠ Credential request
⚠ Suspicious URL
 
Use fictional/non-operational domains.
Never include a real malicious URL.
Behind the scenes:
 
MESSAGE
   ↓
SECURITY SIGNALS
   ↓
RISK SCORE
   ↓
CLASSIFICATION
 
Final:
 
CYBER DETECTIVE
4 / 5
 
Teaching message:
> Security systems can use multiple signals to help identify suspicious messages, but people still need to think critically.

# 14. GAME 5: ROCK PAPER SCISSORS AI
Card:
 
✋
ROCK PAPER SCISSORS AI
Challenge computer vision.
COMPUTER VISION
 
Use REAL webcam gesture recognition.
Technology:
 
@mediapipe/tasks-vision
GestureRecognizer
 
Map:
 
Closed_Fist → Rock
Open_Palm → Paper
Victory → Scissors
 
Display mirrored webcam preview.
Display:
 
AI SEES
✊ ROCK
Confidence: 91%
 
Controls:
 
START CAMERA
STOP CAMERA
PLAY ROUND
RESET SCORE
 
Countdown:
 
3
2
1
GO!
 
Show:
 
YOU
✊ ROCK
AI
✌️ SCISSORS
YOU WIN!
 
Track:
 
YOU: 3
AI: 2
TIES: 1
 
Behind the scenes:
 
WEBCAM FRAME
     ↓
HAND DETECTION
     ↓
HAND LANDMARKS
     ↓
GESTURE MODEL
     ↓
CLASS PROBABILITIES
     ↓
ROCK / PAPER / SCISSORS
 
Visually show hand landmark points when practical.
Display:
 
LIVE AI MODEL
MediaPipe Gesture Recognition
 
Privacy:
> Camera images are processed live for gesture recognition and are not saved by this application.
Do not:
- Save frames
- Upload video
- Identify users
- Perform facial recognition
- Analyze demographics
Stop all camera tracks when leaving the game.

# 15. GAME 6: DRAWING RECOGNITION
Card:
 
🎨
DRAWING RECOGNITION
Can AI recognize your drawing?
COMPUTER VISION
 
Prompts:
 
cat
car
house
tree
fish
star
pizza
bicycle
cup
apple
 
Provide large white canvas.
Support:
- Mouse
- Touch
- Stylus where supported
Use thick dark strokes.
Controls:
 
RECOGNIZE
CLEAR
NEXT OBJECT
 
Display:
 
AI THINKS...
CAT
Confidence: 87%
 
Show top 3 predictions:
 
Cat        87%
Dog         8%
Rabbit      5%
 
Behind the scenes:
 
DRAWING
   ↓
RESIZE
   ↓
NORMALIZE
   ↓
IMAGE MODEL
   ↓
CLASS PROBABILITIES
   ↓
PREDICTION
 
If simulated:
 
DEMO MODE
Recognition is simulated for this prototype.
 
Do not pretend simulated recognition is AI.
Design the component so the classifier can later be replaced with TensorFlow.js.
If genuine:
 
LIVE AI MODEL
 

# 16. GAME 7: FLAPPY AI
Card:
 
🐦
FLAPPY AI
Watch an AI learn to fly.
EVOLUTIONARY AI
 
Create an original Flappy Bird-style learning simulation.
Do not copy:
- Flappy Bird graphics
- Sprites
- Sounds
- Branding
- Background artwork
Use an original Georgian-branded flying-agent environment.
The demo must run WITHOUT human intervention.
When opened:
1. Create AI population.
2. Start simulation.
3. Agents attempt to travel through gates.
4. Measure fitness.
5. Select successful agents.
6. Create next generation.
7. Apply mutation.
8. Start next generation.
9. Continue automatically.
Preferred implementation:
 
Genetic Algorithm + small neural network
 
The agent receives:
 
Current vertical position
Vertical speed
Distance to next gate
Gap centre
Difference between agent and gap centre
 
Output:
 
FLAP
 
or:
 
DO NOT FLAP
 
Rewards/fitness should include genuine implemented values such as:
 
+1 survive
+25 pass gate
-100 collision
 
Displayed values must match implementation.
Controls:
 
PAUSE
RESUME
RESTART LEARNING
 
Simulation speeds:
 
1×
2×
5×
10×
 
Default:
 
2×
 
## Behind the scenes
Show:
 
WHAT THE AI SEES
 
Visualize:
 
Agent height
Vertical velocity
Distance to gate
Target gap
Difference from target
 
Use animated lines and bars.
Show neural-network pipeline:
 
SENSORS
   ↓
INPUT NEURONS
   ↓
HIDDEN LAYER
   ↓
OUTPUT
   ↓
FLAP / DON'T FLAP
 
Show:
 
FLAP PROBABILITY
██████████████ 78%
DECISION: FLAP
 
## Live learning statistics
Display live values:
 
Generation
Population
Agents alive
Best fitness
Average fitness
Best gates passed
Mutation rate
 
Never fabricate metrics.
When generation ends:
 
GENERATION COMPLETE
Evaluate
   ↓
Select
   ↓
Copy
   ↓
Mutate
   ↓
Try Again
 
Show:
 
THE AI IS LEARNING!
 
when meaningful improvement occurs.
Teaching message:
> The agents are not told exactly when to flap. Strategies that travel farther receive higher fitness. Better strategies are copied and slightly changed to create the next generation.
Transparency:
 
LIVE LEARNING SIMULATION
Neuroevolution / Genetic Algorithm
 
Use the exact label matching the implementation.

# 17. GAME 8: AI MAZE ESCAPE
Card:
 
🧩
AI MAZE ESCAPE
Watch AI find the fastest route.
SEARCH ALGORITHMS
 
This demo must run WITHOUT human intervention.
Implement:
 
Breadth-First Search
Dijkstra
A*
 
Optional:
 
Depth-First Search
Greedy Best-First Search
 
Default:
 
Breadth-First Search vs A*
 
Generate solvable mazes.
Maze includes:
- Start
- Goal
- Walls
- Open cells
- Optional weighted terrain
- Dead ends
Suggested visual states:
 
Georgian Blue = Start
Georgian Green = Goal
Dark Grey = Wall
Light Blue = Explored
Yellow = Frontier
Orange = Current
Green route = Final path
 
Include accessible non-colour indicators.
## Autonomous sequence
When opened:
1. Generate maze.
2. Validate solvability.
3. Display start/goal.
4. Start algorithm.
5. Animate exploration.
6. Find goal.
7. Reconstruct path.
8. Show results.
9. Pause briefly.
10. Repeat or compare algorithm.
Controls:
 
PAUSE
RESUME
NEW MAZE
REPLAY
 
Options:
 
Algorithm
Maze size
Speed
Weighted terrain
Side-by-side comparison
 
Maze sizes:
 
15 × 15
21 × 21
31 × 31
 
Default:
 
21 × 21
 
## Behind the scenes
Show:
 
HOW THE AI IS SEARCHING
 
Visualize:
 
FRONTIER
Places to examine next
EXPLORED
Places already checked
CURRENT
Place being examined now
PATH
Best completed route
 
For A*:
 
f(n) = g(n) + h(n)
 
Plain-language explanation:
 
g(n) = distance travelled so far
h(n) = estimated distance remaining
f(n) = estimated total route
 
Display live:
 
Current row/column
Distance travelled
Estimated remaining distance
Total estimated cost
Frontier size
Nodes explored
 
## Side-by-side comparison
Display identical maze:
 
BREADTH-FIRST SEARCH      A* SEARCH
 
Live metrics:
 
Nodes explored
Frontier size
Path length
Elapsed time
Completed?
 
Measure actual values.
Do not hardcode results.
Narration:
 
A* is prioritizing locations that look closer to the goal.
 
 
Breadth-First Search is checking every location at the current distance.
 
 
Dead end eliminated.
 
 
Goal found! Reconstructing route...
 
Teaching message:
> Search algorithms follow precise rules for selecting which possibility to examine next. A* can often explore fewer locations because it uses an estimate of the remaining distance.
Transparency:
 
LIVE SEARCH ALGORITHM
No neural network is used.
 

# 18. GAME 9: AI SOUND DETECTIVE
Card:
 
🎤
AI SOUND DETECTIVE
Can AI identify your sound?
AUDIO CLASSIFICATION
 
Target classes:
 
👏 Clap
😗 Whistle
🫰 Snap
🗣 Voice
 
Also handle:
 
Background noise
Unknown
 
Use genuine browser audio classification.
Preferred:
 
TensorFlow.js
Web Audio API
Custom audio model
 
A custom trained model must recognize:
 
clap
whistle
snap
voice
background noise
unknown
 
Do NOT claim the standard Speech Commands model recognizes these custom categories unless a custom transfer-learning classifier has been trained.
Preferred model assets:
 
public/models/sound-detective/
 
For example:
 
model.json
metadata.json
*.bin
 
Use actual filenames generated during model export.
## Fallback
If custom model unavailable, enter:
 
GUIDED TRAINING MODE
 
Allow visitor/facilitator to train:
 
Clap
Whistle
Snap
Voice
Background Noise
 
Collect approximately:
 
8-12 examples per class
 
around:
 
0.5-1 second
 
Do not silently substitute random predictions.
## Challenge mode
Random target:
 
MAKE THIS SOUND
👏 CLAP
 
Countdown:
 
3
2
1
LISTENING...
 
Then:
 
AI THINKS...
👏 CLAP
Confidence: 91%
 
Result:
 
CORRECT!
 
or:
 
NOT QUITE
The AI predicted: WHISTLE
 
Five rounds.
Track score.
## Behind the scenes
Show three synchronized panels.
### WHAT THE MICROPHONE HEARS
Live waveform:
 
AMPLITUDE OVER TIME
 
### WHAT THE AI SEES
Live spectrogram:
 
FREQUENCY
↑
│
│
└────────────────→ TIME
 
Explanation:
> A spectrogram turns sound into a picture. Low frequencies appear near the bottom, high frequencies near the top, and brighter areas represent stronger sound energy.
Generate it from actual audio data.
Do not show a decorative fake spectrogram.
### WHAT THE AI PREDICTS
Display:
 
Clap              91%
Whistle            4%
Snap               3%
Voice              1%
Background noise   1%
 
Use live probability scores.
## Pipeline
Animate:
 
MICROPHONE
    ↓
WAVEFORM
    ↓
SPECTROGRAM
    ↓
AUDIO MODEL
    ↓
PROBABILITIES
    ↓
PREDICTION
 
Plain-language narration:
 
Capturing sound...
 
 
Separating sound into frequencies...
 
 
Comparing the pattern with training examples...
 
 
Strongest match: CLAP
 
Display microphone quality:
 
Input level
Background noise
Signal quality
 
Warnings:
 
TOO QUIET
 
 
TOO LOUD
 
 
BACKGROUND NOISE HIGH
 
Calculate status from actual audio levels.
## Alternative accessibility mode
Include:
 
SAMPLE SOUND MODE
 
Use locally bundled properly licensed audio samples.
Suggested paths:
 
public/audio/clap-sample.wav
public/audio/whistle-sample.wav
public/audio/snap-sample.wav
public/audio/voice-sample.wav
 
Do not autoplay.
The selected sample should still demonstrate:
- Waveform
- Spectrogram
- Model inference
- Confidence bars
Teaching message:
> An audio classifier converts sound into numerical patterns. A spectrogram helps represent how frequencies change through time. The model compares these patterns with what it learned during training.
Privacy:
> Microphone audio is processed live in your browser and is not saved or uploaded by this application.
Stop microphone and AudioContext resources when leaving.
Transparency when genuine:
 
LIVE AI MODEL
TensorFlow.js Audio Classification
 
If only signal thresholds are implemented:
 
AUDIO SIGNAL DEMO
This is not a trained AI classifier.
 

# 19. ARCADE SCORING
Track session-level:
 
GAMES PLAYED
 
and:
 
BEST SCORE
 
Initial implementation uses browser state only.
Do not collect:
- Names
- Email addresses
- Facial data
- Voice recordings
- Personally identifiable information
Design scoring architecture for future optional:
 
localStorage leaderboard
backend leaderboard
 
but do not implement personal-data collection.

# 20. GAME COMPLETION COMPONENT
Create reusable:
 
GameComplete
 
Example:
 
🏆
CHALLENGE COMPLETE
4 / 5
NICE WORK!
 
Buttons:
 
PLAY AGAIN
BACK TO ARCADE
 
Use Georgian yellow sparingly.

# 21. IDLE RESET
Implement kiosk inactivity detection.
After:
 
90 seconds
 
without:
- Mouse activity
- Pointer activity
- Touch
- Keyboard input
show:
 
STILL THERE?
Returning to the Arcade in 10 seconds...
 
Provide:
 
I'M STILL HERE
 
If no interaction:
 
Return to Arcade Home
 
When reset occurs:
- Stop webcam
- Stop microphone
- Stop AudioContext
- Reset games
- Reset temporary training data
- Cancel simulations
- Clear temporary visitor state

# 22. ACCESSIBILITY
Meet WCAG-minded practices.
Requirements:
- Keyboard navigation
- Visible focus
- Semantic HTML
- Semantic buttons
- Proper form labels
- aria-labels for icon-only controls
- High contrast
- Minimum comfortable touch targets
- Responsive text
- Do not rely on colour alone
- Include symbols/text for success/error
- Provide microphone alternative
- Captions for audio instructions
Respect:
 css
prefers-reduced-motion
 
When enabled:
- Reduce movement
- Remove unnecessary zoom animation
- Reduce continuous visual effects
- Keep educational state changes visible

# 23. RESPONSIVE DESIGN
Optimize for:
 
1920 × 1080
1366 × 768
iPad-sized touchscreen
Mobile
 
Desktop home:
 
3 columns × 3 rows
 
Tablet:
 
2 columns
 
Mobile:
 
1 column
 
All games must remain usable on laptop screens.

# 24. ANIMATION
Use Framer Motion for:
- Card entrances
- Game transitions
- Correct/incorrect feedback
- Score reveals
- Countdown
- Prediction reveal
- AI decision pulse
- Search progression
- Generation transitions
- Pipeline visualization
Typical duration:
 
150ms-400ms
 
Do not slow visitors down with decorative animation.

# 25. SOUND
Create optional sound architecture.
Possible effects:
 
button
countdown
correct
incorrect
victory
AI thinking
generation complete
goal found
 
Default:
 
SOUND OFF
 
Provide:
 
🔇 / 🔊
 
Sound cannot be required to understand any activity.
Do not allow sound effects to interfere with AI Sound Detective microphone classification.
Automatically mute Arcade sound effects while Sound Detective is recording.

# 26. KIOSK MODE
Create:
 
KIOSK MODE
 
Kiosk mode should:
- Emphasize large controls
- Enable idle-reset
- Prevent visitor state lingering
- Return home after inactivity
- Stop camera/microphone when leaving
- Reset autonomous demos appropriately
- Avoid persistence of visitor-specific information

# 27. PRIVACY
## Camera
- Process locally
- Do not upload
- Do not store
- Do not capture screenshots
- Do not perform facial recognition
- Do not analyze demographics
- Stop MediaStream on exit
## Microphone
- Process locally
- Do not upload
- Do not save by default
- Stop microphone tracks on exit
- Close/suspend AudioContext
- Discard temporary examples at reset
## Flappy AI / Maze
Collect no visitor data.
Display clear privacy notices before webcam/microphone permission requests.

# 28. ERROR HANDLING
Handle:
## General
- Missing model
- Network failure
- Unsupported browser
- Canvas failure
- Invalid state
- Empty input
## Camera
- No camera
- Permission denied
- Gesture confidence too low
- MediaPipe failure
## Microphone
- No microphone
- Permission denied
- AudioContext unavailable
- Model unavailable
- Model metadata mismatch
- Too quiet
- Clipping
- Excessive noise
## Flappy
- Invalid population
- NaN fitness
- Animation interruption
- Neural-network initialization failure
## Maze
- Unsolvable generated maze
- Missing route
- Algorithm failure
- Oversized maze
Never show a blank screen.
Always provide:
 
What happened
What the visitor can do
RETRY
BACK TO ARCADE
 

# 29. PROJECT STRUCTURE
Use:
 
beat-the-ai-arcade/
│
├── public/
│   ├── logo.png
│   │
│   ├── models/
│   │   └── sound-detective/
│   │       ├── model.json
│   │       ├── metadata.json
│   │       └── *.bin
│   │
│   └── audio/
│       ├── clap-sample.wav
│       ├── whistle-sample.wav
│       ├── snap-sample.wav
│       └── voice-sample.wav
│
├── src/
│   ├── components/
│   │   ├── ArcadeHeader.jsx
│   │   ├── ArcadeHome.jsx
│   │   ├── GameCard.jsx
│   │   ├── GameHeader.jsx
│   │   ├── GameComplete.jsx
│   │   ├── ScoreCard.jsx
│   │   ├── IdleReset.jsx
│   │   ├── BehindTheScenes.jsx
│   │   ├── PipelineDiagram.jsx
│   │   ├── ConfidenceBars.jsx
│   │   └── ModelStatusBadge.jsx
│   │
│   ├── games/
│   │   ├── HumanOrAI.jsx
│   │   ├── TrainYourOwnAI.jsx
│   │   ├── TicTacAI.jsx
│   │   ├── CyberDetective.jsx
│   │   ├── RockPaperScissors.jsx
│   │   ├── DrawingRecognition.jsx
│   │   ├── FlappyAI.jsx
│   │   ├── AIMazeEscape.jsx
│   │   └── AISoundDetective.jsx
│   │
│   ├── ai/
│   │   ├── geneticAlgorithm.js
│   │   ├── neuralNetwork.js
│   │   ├── mazeAlgorithms.js
│   │   ├── audioClassifier.js
│   │   └── audioFeatures.js
│   │
│   ├── hooks/
│   │   ├── useIdleReset.js
│   │   ├── useMicrophone.js
│   │   ├── useWebAudioAnalyser.js
│   │   └── useReducedMotion.js
│   │
│   ├── data/
│   │   ├── humanOrAIData.js
│   │   ├── cyberData.js
│   │   ├── drawingPrompts.js
│   │   ├── soundClasses.js
│   │   └── gameRegistry.js
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── README.md
├── index.html
├── package.json
├── eslint.config.js
└── vite.config.js
 

# 30. GAME REGISTRY
Create central registry.
Prefer actual imported React component references or a documented component map.
Conceptually:
 javascript
[
  {
    id: "human-ai",
    title: "Human or AI?",
    icon: "🧠",
    category: "Generative AI",
  },
  {
    id: "trainer",
    title: "Train Your Own AI",
    icon: "🤖",
    category: "Machine Learning",
  },
  {
    id: "tictactoe",
    title: "Tic-Tac-AI",
    icon: "❌",
    category: "Search Algorithms",
  },
  {
    id: "cyber",
    title: "Cyber Detective",
    icon: "🔐",
    category: "AI + Cybersecurity",
  },
  {
    id: "rps",
    title: "Rock Paper Scissors AI",
    icon: "✋",
    category: "Computer Vision",
  },
  {
    id: "drawing",
    title: "Drawing Recognition",
    icon: "🎨",
    category: "Computer Vision",
  },
  {
    id: "flappy",
    title: "Flappy AI",
    icon: "🐦",
    category: "Evolutionary AI",
  },
  {
    id: "maze",
    title: "AI Maze Escape",
    icon: "🧩",
    category: "Search Algorithms",
  },
  {
    id: "sound",
    title: "AI Sound Detective",
    icon: "🎤",
    category: "Audio Classification",
  },
]
 
Adding another game later should require only:
1. New component
2. Registry entry
3. Optional supporting AI/data module
Do not redesign navigation.

# 31. APP.JSX RESPONSIBILITY
Keep:
 
App.jsx
 
small.
It should:
- Hold selected game
- Hold Arcade session statistics
- Render ArcadeHome
- Render selected game
- Return to Arcade
- Trigger idle reset
- Coordinate cleanup
Example state:
 javascript
const [game, setGame] = useState(null);
const [gamesPlayed, setGamesPlayed] = useState(0);
const [bestScore, setBestScore] = useState(0);
 
Do not place every game's implementation inside App.jsx.

# 32. IMPORTANT AI TRANSPARENCY RULE
Every demonstration must accurately identify its technology.
## Human or AI
 
AI LITERACY ACTIVITY
 
## Train Your Own AI, if keyword-based
 
EDUCATIONAL CLASSIFIER
 
## Tic-Tac-AI
 
SEARCH ALGORITHM
Minimax
 
## Cyber Detective
Clearly describe whether analysis is:
 
RULE-BASED DEMO
 
or:
 
LIVE CLASSIFICATION MODEL
 
depending on implementation.
## Rock Paper Scissors
 
LIVE AI MODEL
MediaPipe Gesture Recognition
 
## Drawing, simulated
 
DEMO MODE
Recognition is simulated.
 
## Drawing with genuine model
 
LIVE AI MODEL
 
## Flappy
 
LIVE LEARNING SIMULATION
Genetic Algorithm / Neuroevolution
 
Use the correct implementation name.
## Maze
 
LIVE SEARCH ALGORITHM
BFS / Dijkstra / A*
 
## Sound with genuine model
 
LIVE AI MODEL
TensorFlow.js Audio Classification
 
## Sound using signal thresholds
 
AUDIO SIGNAL DEMO
This is not a trained AI classifier.
 
Never exaggerate what the technology is doing.

# 33. README.MD
Generate comprehensive README:
# Beat the AI Arcade
## Tagline
Can you beat the AI?
## About
Explain this is an Applied AI open-house learning experience.
## Nine demonstrations
Document all nine.
## Requirements
 
Node.js LTS
npm
Modern Chrome/Edge browser
Webcam
Microphone
Internet access if models are remote
 
## Installation
 bash
npm install
npm run dev
 
## Build
 bash
npm run build
npm run preview
 
## Testing
 bash
npm run lint
 
## Logo
Authorized logo goes at:
 
public/logo.png
 
Do not distribute an unauthorized institutional logo.
## Model assets
Explain where Sound Detective and other local models live.
## Privacy
Explain:
- Webcam local processing
- Microphone local processing
- No intentional recording
- No upload
- Cleanup on exit
## AI transparency
Document which games use:
- AI models
- Search algorithms
- Evolution
- Educational classifiers
- Simulation

# 34. OPEN-HOUSE TEST CHECKLIST
Include:
 
[ ] Arcade home loads
[ ] logo.png displays
[ ] Logo fallback works
[ ] Georgian colours display correctly
[ ] Nine game cards appear
[ ] Every card opens
[ ] Back to Arcade works
[ ] Human or AI completes five rounds
[ ] Human or AI score correct
[ ] Train Your Own AI accepts examples
[ ] Training state works
[ ] Predictions work
[ ] Tic-Tac-AI responds to every move
[ ] Minimax cannot be beaten
[ ] Search statistics are calculated
[ ] Cyber Detective completes five rounds
[ ] Score correct
[ ] Camera permission requested
[ ] MediaPipe loads
[ ] Rock recognized
[ ] Paper recognized
[ ] Scissors recognized
[ ] Camera stops when leaving
[ ] Drawing works with mouse
[ ] Drawing works with touch
[ ] Clear works
[ ] Next prompt works
[ ] AI transparency label visible
[ ] Flappy AI starts automatically
[ ] Generations advance
[ ] Genetic/evolutionary learning works
[ ] Fitness values calculated live
[ ] Population statistics update
[ ] Sensor inputs update
[ ] Neural-network decision updates
[ ] Pause works
[ ] Resume works
[ ] Restart works
[ ] Speed controls work
[ ] Maze starts automatically
[ ] Every generated maze is solvable
[ ] BFS works
[ ] Dijkstra works
[ ] A* works
[ ] A* calculations are accurate
[ ] Frontier visualized
[ ] Explored nodes visualized
[ ] Final path visible
[ ] Nodes explored calculated
[ ] Path length calculated
[ ] Elapsed time measured
[ ] Side-by-side comparison works
[ ] Pause/resume works
[ ] New Maze works
[ ] Microphone permission requested
[ ] Audio model loads
[ ] Clap recognized
[ ] Whistle recognized
[ ] Snap recognized
[ ] Voice recognized
[ ] Background noise handled
[ ] Unknown handled
[ ] Waveform uses live data
[ ] Spectrogram uses real audio data
[ ] Class probability bars use model output
[ ] Audio signal warnings work
[ ] Microphone stops when leaving
[ ] AudioContext cleaned up
[ ] Sample Sound Mode works
[ ] Sound privacy notice visible
[ ] Behind the Scenes panel available in all games
[ ] AI transparency labels accurate
[ ] Idle reset works
[ ] Camera stops after idle reset
[ ] Microphone stops after idle reset
[ ] Reduced-motion preference respected
[ ] Keyboard navigation works
[ ] Focus indicators visible
[ ] 1920×1080 tested
[ ] 1366×768 tested
[ ] Touchscreen tested
[ ] Mobile tested
[ ] npm run lint passes
[ ] npm run build passes
 

# 35. IMPLEMENTATION QUALITY
Use:
- Reusable components
- Descriptive variables
- Small functions
- Consistent formatting
- Semantic HTML
- Proper React cleanup
- No duplicate navigation logic
- No unused imports
- No console errors
- ESLint-clean code
- Accurate educational terminology
- Real calculated metrics where displayed
Avoid giant components when functionality can reasonably be separated.

# 36. FUTURE GAME ARCHITECTURE
Support future games such as:
 
AI Pong
AI 20 Questions
Prompt Battle
Spot the Deepfake
AI Hallucination Challenge
Neural Network Playground
Build-a-Robot
AI Music Challenge
Object Recognition Challenge
 
Adding a game should require only:
 
Create component
Add registry entry
Register supporting assets/model if required
 

# 37. FINAL FOOTER
Display:
 
[ logo.png ]
CAN YOU BEAT THE AI?
Learn how the technology behind these challenges works in Applied AI.
 
Include optional program QR placeholder:
 
[ PROGRAM QR CODE ]
 
Do not generate a fake destination.
Allow an authorized URL to be provided later.

# 38. DELIVERABLE
Generate the COMPLETE working project.
Create:
- All React components
- All nine game components
- AI/data utility modules
- Genetic algorithm implementation
- Neuroevolution implementation where required
- BFS implementation
- Dijkstra implementation
- A* implementation
- Audio classifier architecture
- Live waveform visualization
- Live spectrogram visualization
- Confidence bars
- Behind-the-scenes pipelines
- Tailwind styling
- MediaPipe integration
- TensorFlow.js integration
- Vite configuration
- ESLint-compatible JavaScript
- Georgian College colour tokens
- Responsive layouts
- Accessibility
- Error handling
- Privacy cleanup
- Idle reset
- Kiosk mode
- Logo placeholders
- README
- Testing checklist
Do not simulate missing functionality and silently present it as AI.
Flappy AI and AI Maze Escape must start and operate automatically without visitor intervention.
AI Sound Detective must use either:
 
A genuine trained custom audio model
 
or:
 
Guided Training Mode
 
It must not randomly guess sound classes.
