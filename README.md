# The City Breathes

**Tagline:** A living 3D sculpture that breathes, sings, and transforms in real time with the pulse of a city.

---

## 1. Project Overview

### Title and Tagline

**The City Breathes**  
A living 3D sculpture that breathes, sings, and transforms in real time with the pulse of a city.

### Problem / Motivation

Cities are usually understood through maps, dashboards, and charts—static representations of dynamic systems. Yet city life is not only measured; it is felt. The pressure of traffic, the quality of air, the shift in weather, and the collective hum of social activity all shape the emotional texture of urban existence.

The City Breathes transforms these invisible systems into an embodied artwork. Instead of showing data as numbers, it turns city conditions into motion, rhythm, sound, and presence. Visitors don't just observe—they experience the city as a living organism.

### Goal

The primary goal is to turn live city data into a responsive, breathing digital sculpture that behaves like an evolving urban organism. The sculpture should visibly respond to traffic congestion, air quality, weather patterns, and social activity, creating an immediate, emotional connection between the viewer and the city's hidden systems.

### Target Users

- City residents seeking to understand their environment in new ways
- Digital art and technology enthusiasts
- Hackathon judges and technical mentors
- Data visualization professionals
- Urban planners and civic technologists
- General public users exploring interactive art installations

### Success Criteria

The project is successful if it demonstrates:

- A strong "wow factor" within the first few seconds of interaction
- A clear, intuitive connection between live data and artistic behavior
- Smooth, expressive 3D animation running at 60fps on mid-range devices
- Meaningful user interaction that feels immediate and intuitive
- A compelling audiovisual experience that demonstrates emergent behavior
- A technically credible architecture with modular, maintainable code
- A polished demo that clearly communicates the hackathon theme

---

## 2. Concept & Artistic Vision

### Artistic Concept

The City Breathes is a digital sculpture that behaves like a living entity. At its core, it expands and contracts as if inhaling and exhaling, but its movement is far more nuanced than simple breathing.

When the city is calm, the sculpture breathes slowly and softly, its surface glowing with gentle waves. As traffic increases, its pulse quickens and becomes more urgent. When air quality deteriorates, its colors shift from fresh greens to stressed oranges and reds, its surface becoming more distorted and heavy. Weather conditions ripple across its form—calm air produces smooth surfaces, while wind and rain create visible turbulence. Social activity manifests as particle emissions and harmonic overtones in its "voice."

The sculpture is not a static object. It is a real-time portrait of a city's invisible nervous system, continuously evolving as new data flows in. Users can interact with it, changing its "breathing style" from calm meditative rhythms to sharp, fractured pulses, making the artwork participatory rather than passive.

### New Medium Explanation

This work constitutes a new artistic medium because it is:

- **Interactive**: Users can touch, click, and directly influence the sculpture's behavior. The artwork responds to human input as much as it does to city data.
- **Data-driven**: Live external signals from public APIs directly shape motion, geometry, color, sound, and lighting in real time. The artwork's form is computed, not pre-rendered.
- **Procedural**: The sculpture is generated through algorithms and mathematical rules rather than fixed keyframes. Every moment is unique, emerging from the intersection of data and code.
- **Evolving**: The sculpture changes continuously over minutes, hours, and days. It cannot be captured in a single frame or state.
- **Networked**: It depends on real-time urban systems—traffic sensors, air quality monitors, weather stations, and social media feeds—making it impossible to exist outside this technological ecosystem.

Traditional sculpture is static; digital sculpture can be alive. The City Breathes demonstrates how technology enables art that exists only when connected to the real world.

### User Experience Narrative

Maya opens her laptop and navigates to the page. The screen darkens, revealing a luminous form at its center. An icohedron hovers in space, slowly expanding and contracting like a lung filled with starlight.

A small tooltip appears: "Click the sculpture to change its breath. Enable sound to hear the city sing."

She selects "Tokyo" from the city dropdown. The sculpture shivers, its breathing pattern shifting. She notices the color palette changing from Dubai's cool blues to Tokyo's electric purples. The particles around it begin to dance faster.

Maya clicks on the sculpture. Instantly, its breathing style shifts from calm waves to sharp pulses. She enables the audio toggle and hears a low, resonant tone that rises and falls with the sculpture's motion. When a traffic spike arrives from Tokyo's live data, the pitch rises and the rhythm quickens.

She watches for several minutes as the sculpture continues to evolve, no longer just her creation but a living reflection of a city she's never visited, breathing through data, singing through code.

### Emotional / Cultural Impact

The project aims to evoke:

- **Connection to the city as a living system**: Visitors should feel they are witnessing the urban organism's vital signs, not just observing abstract data.
- **Environmental awareness**: By making air quality and weather visible and felt, viewers develop intuitive understanding of environmental conditions.
- **Curiosity about invisible systems**: The artwork prompts questions about what data exists, where it comes from, and how it shapes the world.
- **Reflection on collective identity**: The sculpture represents not one person's city but the collective pulse of millions, making the individual feel part of something larger.
- **Wonder at technology's potential**: The piece celebrates technology not as a cold tool but as a medium for emotional and poetic expression.

---

## 3. Functional Requirements

### 3.1 Data Integration

1. The system shall ingest real-time or near-real-time city data from public APIs.
2. The system shall support at least four primary data categories: traffic, air quality, weather, and social activity signals.
3. The system shall normalize all incoming data into a unified 0–1 intensity scale with consistent timestamping.
4. The system shall detect missing, stale, or failed API responses within 30 seconds.
5. When data is missing, the system shall use cached data from the last successful fetch, then gracefully degrade to procedurally generated fallback data.
6. The frontend shall continue functioning with visual and audio indicators showing data freshness status.
7. The system shall update data at intervals of 5–15 minutes depending on API rate limits.
8. The system shall support city selection from a predefined list of at least five major cities.

### 3.2 3D Sculpture & Animation

1. The application shall render a responsive 3D sculpture using WebGL via Three.js.
2. The sculpture shall include a continuous breathing animation driven by the overall data intensity.
3. Morphing geometry shall visibly deform based on individual data categories (traffic affects vertical stretch, air quality affects surface roughness, weather affects wave amplitude).
4. The sculpture shall support real-time color palette shifts based on data conditions.
5. Particle systems shall emit from the sculpture based on social activity intensity.
6. Users shall be able to click or tap parts of the sculpture to trigger a breathing style change.
7. The sculpture shall remain visually coherent and performant on devices ranging from mobile to desktop.
8. The system shall implement smooth transitions between data states rather than abrupt changes.

### 3.3 Audio Layer

1. The application shall generate procedural sound using the Web Audio API based on data intensity.
2. Audio pitch (fundamental frequency) shall map to weather and social data values.
3. Audio volume shall map to overall city intensity with user-controlled scaling.
4. Rhythmic patterns shall synchronize with the breathing animation cycle.
5. Multiple oscillators shall create harmonic complexity that evolves with data.
6. The application shall include a prominent mute/unmute toggle with visual feedback.
7. Audio shall be optional and user-controlled, with a default muted state.
8. Audio generation shall begin only after user interaction (to comply with browser autoplay policies).

### 3.4 User Interaction & Controls

1. Users shall be able to select a city from a dropdown menu containing at least five major world cities.
2. The application may optionally auto-detect user location with explicit permission.
3. Users shall be able to adjust breathing style from at least four distinct modes (Calm, Pulse, Wave, Fracture).
4. Users shall be able to adjust visualization speed via an on-screen slider (0.4x to 1.8x).
5. Users shall be able to control audio intensity via a dedicated slider.
6. The application shall display a brief onboarding tooltip on first visit.
7. All controls shall be accessible via keyboard navigation and screen readers.
8. Controls shall adapt responsively for both desktop and mobile form factors.

### 3.5 Time & Evolution

1. The sculpture shall continuously evolve as new data arrives from sources.
2. Short-term changes (minutes to hours) shall manifest through motion, color, and sound.
3. The application shall support a "past day" or time-lapse visualization mode showing historical patterns.
4. Daily cycles (rush hour, nighttime calm) shall be visibly represented in the sculpture's behavior.
5. The system shall preserve at least 24 hours of recent data for time-lapse functionality.
6. Time-lapse mode shall allow users to see how the city's "breath" varies throughout a day.

---

## 4. Non-Functional Requirements

- **Performance**: Maintain smooth 60fps animation on mid-range devices (desktop and high-end mobile). Target 30fps minimum on mobile devices.
- **Responsiveness**: Work seamlessly on desktop browsers (Chrome, Firefox, Safari) and mobile browsers (iOS Safari, Chrome Android).
- **Accessibility**: Provide keyboard-accessible controls, sufficient color contrast (WCAG AA minimum), reduced motion support, and visual indicators for audio-driven behavior.
- **Scalability**: Design backend and data pipeline to handle at least 100 concurrent users with appropriate caching.
- **Security**: No sensitive user data shall be stored; all data ingestion occurs from public APIs with no authentication required.
- **Privacy**: Location detection shall be opt-in only; no persistent storage of user location data.
- **Maintainability**: Use modular code structure with clear separation between data layer, rendering engine, audio system, and UI components.
- **Reliability**: Support offline/demo mode when live APIs are unavailable, with clear user feedback about data status.
- **Deployability**: Keep the project simple enough to deploy on static hosting (Vercel, Netlify) or lightweight cloud services within a hackathon timeframe.

---

## 5. Technical Architecture

### 5.1 High-Level Architecture Diagram (Text Description)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PUBLIC DATA SOURCES                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│
│  │   TRAFFIC   │  │ AIR QUALITY│  │  WEATHER    │  │ SOCIAL DATA ││
│  │   API       │  │   API       │  │   API       │  │   API       ││
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘│
└─────────┼────────────────┼────────────────┼────────────────┼───────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DATA INGESTION SERVICE                             │
│                         (Node.js/Express)                             │
│  - API polling at 5-15 minute intervals                               │
│  - Error handling and retry logic                                       │
│  - Rate limit management                                                  │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   DATA PROCESSING & NORMALIZATION                     │
│  - Raw data → normalized intensity values (0-1 scale)                 │
│  - Timestamp validation                                               │
│  - Freshness assessment                                               │
│  - Fallback data generation                                             │
│  - Unified schema: {traffic, air, weather, social, overall}        │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API LAYER (REST/WebSocket)                     │
│  - GET /api/data?city=X  (polling-based)                            │
│  - Optional: WebSocket for real-time push                             │
│  - CORS-enabled for frontend access                                   │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND APPLICATION                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │   React UI      │  │  Three.js 3D    │  │  Web Audio API  │      │
│  │  (Controls)     │  │  Renderer       │  │   Audio Engine  │      │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘      │
│           │                      │                      │            │
│           │                      ▼                      │            │
│           │              ┌─────────────────┐              │            │
│           │              │  Data Mapping   │◄───────────────┘            │
│           │              │  (Geometry,     │                             │
│           │              │   Color, Sound) │                             │
│           │              └─────────────────┘                             │
│           │                      │                                      │
│           ▼                      ▼                                      │
│  ┌─────────────────────────────────────────────┐                       │
│  │              USER INTERACTION               │                       │
│  │  - City selection                           │                       │
│  │  - Breathing style controls                 │                       │
│  │  - Audio toggle                             │                       │
│  │  - Click/touch on sculpture                 │                       │
│  └─────────────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Technology Stack

**Backend (Data Service)**

- **Node.js with Express**: Chosen for rapid development during hackathon, excellent WebSocket support, and shared JavaScript/TypeScript ecosystem with the frontend.
- **Alternative**: Python with FastAPI for teams more comfortable with Python data processing pipelines.

**Data Processing**

- Simple normalization pipeline with weighted intensity scoring
- Timestamp validation and freshness checks
- Cached fallback snapshots for reliability
- Schema: `{traffic: 0-1, air: 0-1, weather: 0-1, social: 0-1, overall: 0-1, timestamp: ISO, live: boolean}`

**Frontend**

- **React with TypeScript**: Rapid UI development with type safety for hackathon pressure
- **Three.js**: Mature WebGL library with strong ecosystem for shaders, controls, and geometry
- **Alternative**: Babylon.js for teams preferring a more engine-like 3D framework

**3D Rendering**

- WebGL via Three.js r166+
- Procedural geometry with morph targets
- Shader-based displacement and color effects
- Particle systems for social activity visualization

**Audio**

- **Web Audio API**: Native browser capability for procedural sound generation
- **Optional**: Tone.js for more complex musical sequencing if needed

**Deployment**

- **Frontend**: Vercel or Netlify for instant static deployment with CDN
- **Backend**: Render, Railway, or Fly.io for simple Node.js hosting
- **Demo fallback**: Static mock data mode hosted entirely on frontend if backend deployment is unstable

**Candidate Public APIs**

- **Weather**: Open-Meteo (free, no key required), WeatherAPI, Tomorrow.io
- **Air Quality**: OpenAQ (free), AirNow, WAQI (World Air Quality Index)
- **Traffic**: TomTom Traffic API, HERE Traffic API, Mapbox Traffic Data
- **Social Activity**: Reddit API, Mastodon public timelines, Bluesky API, or simulated activity data for hackathon reliability

### 5.3 Data Flow

1. **Data Ingestion**: Backend service polls configured public APIs at 5-15 minute intervals based on rate limits. Each API endpoint is called independently with proper error handling.

2. **Data Normalization**: Raw API responses are validated, timestamped, and normalized into a unified 0-1 intensity scale. Traffic congestion maps to 0-1, air quality index maps to 0-1, etc.

3. **Derived Calculations**: System computes `overall` intensity as the average of all categories, plus volatility metrics and freshness timestamps.

4. **Data Transmission**: Normalized snapshots are cached and made available via REST endpoint (`GET /api/data?city=X`). Optional WebSocket endpoint pushes updates in real time.

5. **Frontend Consumption**: Frontend fetches data on load and at regular intervals (every 5 minutes). Data is blended smoothly to avoid jarring transitions.

6. **Sculpture Mapping**: Data values drive specific sculpture parameters:
   - **Traffic** → Breathing speed, rotation, vertical deformation
   - **Air Quality** → Color stress (green to red), surface roughness, ambient light intensity
   - **Weather** → Surface wave amplitude, atmospheric fog, tonal pitch base
   - **Social Activity** → Particle emission rate, shimmer effect, secondary audio harmonics
   - **Overall Intensity** → Deformation amplitude, perceived energy

7. **Audio Engine**: Web Audio API oscillators receive frequency, volume, and filter modulation based on the same normalized data, creating synesthetic connection between visual and auditory output.

8. **User Interaction**: User inputs modify presentation style (breathing style, speed, audio intensity) without changing the underlying data mapping, allowing exploration of the same city data through different artistic lenses.

---

## 6. UI / UX Design

### 6.1 Core User Flows

#### First-Time User Flow

1. User opens the page and sees a dark, immersive screen with the 3D sculpture at center.
2. The sculpture begins breathing immediately with a subtle "demo mode" pattern.
3. A brief tooltip appears in the corner: "Click the sculpture to change its breath. Enable sound to hear the city sing."
4. User explores the control panel on the right side.
5. User selects a city and watches the sculpture transition.
6. User discovers interaction by clicking the sculpture.
7. User enables audio and experiences the synesthetic connection.

#### City Selection Flow

1. User opens the city dropdown in the control panel.
2. User selects a city (e.g., "Tokyo") or enables location detection.
3. The application displays "Fetching city signal" status.
4. If live data is available, the status indicator turns green and shows "Tokyo live signal updated 14:32".
5. If using fallback data, the indicator turns coral and shows "Tokyo demo signal active".
6. The sculpture smoothly transitions to the new city's data patterns.
7. Metrics display updates in real time.

#### Breathing Style Adjustment Flow

1. User opens the breathing style dropdown.
2. User selects "Pulse" mode.
3. The sculpture's animation immediately changes from smooth waves to sharp, staccato movements.
4. A tooltip briefly shows: "Breathing style changed to pulse."
5. Data continues to influence the selected style's amplitude and speed.

#### Audio Toggle Flow

1. User clicks the sound icon (♪) in the control panel header.
2. The icon changes to a square (■) indicating audio is active.
3. The audio context resumes (browser may prompt for user gesture).
4. User adjusts the audio intensity slider to increase volume.
5. User hears richer harmonics as intensity increases.
6. User clicks the square icon to mute—audio cuts instantly but data continues to drive visual changes.

### 6.2 Interface Components

- **3D Sculpture Canvas**: Full-screen WebGL canvas occupying the left portion of the screen, responsive to window size.
- **Title Block**: Floating overlay at top-left with project name, tagline, and live data subtitle.
- **Tooltip**: Brief onboarding message that updates based on user interaction.
- **Control Panel**: Right-side floating panel with all controls, scrollable on mobile.
- **City Selector**: Dropdown menu with five major world cities (Dubai, New York, London, Tokyo, Delhi).
- **Breathing Style Selector**: Dropdown with four animation modes (Calm, Pulse, Wave, Fracture).
- **Audio Toggle Button**: Icon button in panel header with visual pressed state.
- **Audio Intensity Slider**: Range input (0-1) with live value feedback.
- **Visualization Speed Slider**: Range input (0.4x-1.8x) controlling animation tempo.
- **Time-Lapse Toggle**: Checkbox to enable past-day visualization mode.
- **Refresh Data Button**: Manual trigger to fetch fresh data from APIs.
- **Metrics Panel**: Display showing percentage values for Traffic, Air, Weather, and Social data.
- **Status Indicator**: Dot and text showing data freshness (green=fresh, coral=fallback).

### 6.3 Visual Style

- **Color Palette**: Dark theme with deep blues and blacks as base (`#090a0d`), accent greens (`#8bd6b4`) for live data, warm gold (`#f1c76d`) for UI elements, and coral (`#ff7b6e`) for fallback status.
- **Layout**: Responsive grid layout—control panel on right for desktop, stacked vertically for mobile (canvas on top, panel below).
- **Typography**: Clean sans-serif system font stack (Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI), with larger display type for sculpture title.
- **Sculpture Aesthetics**: Semi-transparent wireframe overlay in teal, particle glow effects, emissive materials for bioluminescent quality.
- **Control Styling**: Frosted glass effect with `backdrop-filter: blur(18px)`, border highlights, and subtle hover states.
- **Accessibility**: Sufficient color contrast, focus states on interactive elements, reduced motion support via `prefers-reduced-motion` media query.

---

## 7. Implementation Plan & Roadmap

### Phase 1: Core Prototype (Day 1)

**Goals**: Establish the foundation—project structure, one data source, and a basic breathing sculpture.

**Key Tasks**:
- Set up frontend project with React/TypeScript and Three.js via CDN
- Configure Node.js/Express backend with static file serving
- Integrate Open-Meteo weather API with basic data fetching
- Create normalized data schema and fallback generator
- Render a basic 3D icohedron geometry
- Implement breathing animation tied to a single data value
- Connect weather data to sculpture deformation and color

**Expected Outcomes**:
- Working local application accessible at `http://localhost:5173`
- Basic live-data connection with weather values
- Visible 3D sculpture breathing in the browser
- Clear proof of concept demonstrating data-to-art mapping

### Phase 2: Data Integration & Animation (Day 2)

**Goals**: Expand data sources and make the sculpture feel meaningfully data-driven with richer visual variety.

**Key Tasks**:
- Add OpenAQ air quality API integration
- Implement fallback data generation for all categories
- Add traffic simulation data (commute patterns based on time of day)
- Create unified data normalization pipeline
- Implement WebSocket or polling endpoint for frontend
- Map traffic data to breathing speed and rotation
- Map air quality to color stress and surface roughness
- Add particle system for social activity visualization
- Implement smooth data interpolation to avoid visual jumps

**Expected Outcomes**:
- Multiple data sources influencing the artwork simultaneously
- Sculpture behavior visibly different between cities
- System gracefully handles missing API data with fallbacks
- Particles emit and respond to simulated social activity

### Phase 3: Interaction & Audio (Day 3)

**Goals**: Make the experience interactive and multisensory with full user control and audible feedback.

**Key Tasks**:
- Implement click/touch raycasting on sculpture geometry
- Add four breathing style modes with distinct animation patterns
- Build Web Audio API oscillator-based sound engine
- Map data values to pitch, volume, and filter parameters
- Create audio mute/unmute toggle with visual feedback
- Implement audio intensity slider with real-time adjustment
- Add visualization speed control slider
- Update UI to show all metrics and data freshness

**Expected Outcomes**:
- Users can click sculpture to cycle breathing styles
- Audio responds synchronously to data changes
- All controls are functional and visually responsive
- Tooltip provides contextual feedback on interaction

### Phase 4: Polish & Demo (Day 4)

**Goals**: Prepare a polished hackathon-ready experience with professional presentation and reliability.

**Key Tasks**:
- Refine UI layout and visual styling with CSS improvements
- Add onboarding tooltip that appears on first visit
- Implement mobile-responsive design with stacked layout
- Optimize 3D rendering performance (geometry simplification)
- Add time-lapse visualization mode
- Create fallback demo mode for judging without API access
- Fix any bugs and test on multiple browsers/devices
- Write demo script and record practice session

**Expected Outcomes**:
- Stable deployed demo on Vercel/Netlify
- Clear user experience with intuitive controls
- Strong first impression with smooth animations
- Backup mode works when APIs are unavailable
- Demo script ready for presentation

### Phase 5: Final Review & Submission (Day 5)

**Goals**: Finalize documentation, submission materials, and presentation for judging.

**Key Tasks**:
- Run final cross-browser testing (Chrome, Firefox, Safari)
- Validate live demo link and fallback mode
- Confirm all code comments and documentation are complete
- Prepare README.md with setup instructions and architecture notes
- Finalize project description for submission (1-2 pages)
- Record final polished demo video
- Prepare presentation slides with key messages
- Submit source code repository and all required materials

**Expected Outcomes**:
- Complete hackathon submission package
- Reliable demo that works without internet
- Clear explanation of concept, technology, and impact
- Professional presentation ready for judges

---

## 8. Risk Analysis & Mitigation

### Risk: Data API Instability or Rate Limits

**Impact**: Live data may fail during judging, weakening the demo's authenticity and potentially breaking the experience.

**Mitigation Strategy**:
- Implement aggressive caching with 15-minute TTL for all API responses
- Build robust fallback data generator that creates believable patterns based on city coordinates and time of day
- Display clear visual indicator (green dot vs coral dot) showing data freshness
- Include demo mode toggle that uses only procedurally generated data
- Use at least one reliable free API (Open-Meteo requires no API key)
- Test offline mode thoroughly before submission

### Risk: Performance Issues on Lower-End Devices

**Impact**: Low frame rate could reduce the emotional impact of the sculpture and make the experience frustrating.

**Mitigation Strategy**:
- Use geometry simplification (80 segments instead of 128) on mobile devices
- Implement adaptive particle count based on device capabilities
- Add quality settings that users can adjust if needed
- Avoid expensive shader effects; use simpler lighting models
- Test early on mid-range mobile hardware
- Implement `requestAnimationFrame` throttling when tab is not active

### Risk: Complexity of 3D and Audio Integration

**Impact**: Integration bugs or timing issues could consume hackathon time and prevent completion of core features.

**Mitigation Strategy**:
- Keep rendering, data, UI, and audio modules in separate files with clear interfaces
- Build the visual prototype with placeholder data before adding live data
- Start audio with simple sine/triangle oscillators before adding complexity
- Use proven libraries (Three.js, Web Audio API) with extensive documentation
- Implement audio only after user interaction to avoid browser autoplay blocking
- Have a "visual only" mode if audio proves problematic

### Risk: Time Constraints for Hackathon

**Impact**: The team may not complete every planned feature and may have to cut scope.

**Mitigation Strategy**:
- Prioritize the core loop: data → breathing sculpture → interaction
- Treat time-lapse mode and multiple cities as stretch goals
- Build fallback data system early in development
- Keep the final demo path short and reliable
- Use modular architecture so features can be added/removed independently
- Prepare a "minimum viable demo" version that works without web services

### Risk: Unclear Data-to-Art Mapping

**Impact**: Judges may not understand how data affects the artwork or may think changes are random.

**Mitigation Strategy**:
- Add a subtle data status panel showing live vs. fallback mode
- Display percentage values for each data category clearly
- Explain mappings in the demo script and presentation
- Use strong visual differences for changing data states (color, shape, motion)
- Include a before/after comparison moment in the presentation
- Add brief tooltips that explain what each data category controls

---

## 9. Demo Script & Presentation Plan

### 2–3 Minute Demo Script

**Opening (30 seconds)**

"This is The City Breathes: a living 3D sculpture that turns real city data into motion, form, and sound."

[Click to start demo]

"Instead of presenting traffic, air quality, weather, and social activity as charts and dashboards, we let the city become an organism."

**Show the Sculpture (45 seconds)**

"When the page loads, the sculpture begins breathing. Its movement is driven by live or recently fetched data from the selected city."

[Select Tokyo]

"Notice how the breathing changes speed. Traffic affects the rhythm, air quality affects the color and density, weather changes the surface motion, and social activity adds particle emissions."

**City Selection (30 seconds)**

"Here we select Tokyo. The data updates, and the sculpture transitions into a new state. The artwork is not static—it changes with the world outside."

**Interaction (30 seconds)**

"Users can touch or click parts of the sculpture to change its breathing style. This makes the piece participatory: the city shapes the artwork, but the viewer can influence how it expresses itself."

[Click sculpture, show style change]

**Audio (30 seconds)**

"Now we enable sound. The tones are generated in the browser using the Web Audio API. Higher data intensity produces stronger pitch, rhythm, and volume changes."

[Toggle audio, adjust intensity slider]

**Closing (30 seconds)**

"The City Breathes is art that could not exist without technology. It is interactive, networked, procedural, and alive with real-world data. It turns the hidden systems of a city into something people can feel."

### Suggested Slide Titles

1. **The City Breathes** (title slide with screenshot)
2. **Problem: Cities Are Felt, Not Just Measured**
3. **Concept: A Living Data Sculpture**
4. **How the City Becomes Motion** (architecture diagram)
5. **Technical Architecture** (data flow diagram)
6. **Interaction and Audio** (UI screenshot)
7. **Demo** (live transition)
8. **Why This Could Not Exist Without Technology**
9. **Future Vision** (extensions slide)
10. **Thank You** (contact info)

### Key Messages for Judges

- "This is not a dashboard; it is an embodied data artwork that transforms numbers into feeling."
- "The city's live conditions directly shape the sculpture's form, motion, and sound in real time."
- "We combine real-time data ingestion, 3D rendering, interaction design, and procedural audio into a cohesive experience."
- "The project demonstrates a new artistic medium that exists only through technology—interactive, data-driven, and evolving."
- "The prototype is expandable into public installations, educational tools, and civic engagement platforms."

---

## 10. Hackathon Submission Package

### Required Materials

#### Live Demo Link

A hosted version of the project accessible via web browser, with both live-data mode and fallback demo mode. Example: `https://the-city-breathes.vercel.app`

#### Source Code Repository

A GitHub repository containing:
- Complete source code with clear file organization
- README.md with setup instructions and project overview
- Environment variable documentation (if applicable)
- Architecture notes and data mapping documentation
- License file and attribution list

#### Project Description

A 1–2 page summary document covering:
- Concept and artistic vision
- Problem statement and motivation
- Technical approach and architecture
- Data sources and mapping strategy
- User interaction design
- Impact and future potential

#### Demo Video

A short 2–3 minute video recording following the demo script, showing:
- Page load and initial sculpture
- City selection and data transition
- User interaction with breathing styles
- Audio enablement and sound mapping
- Time-lapse mode demonstration

#### Attributions

A complete list of all:
- Public APIs used (Open-Meteo, OpenAQ, etc.)
- JavaScript libraries (Three.js, React, etc.)
- CSS frameworks (if any)
- Fonts and icons
- Any third-party assets or code snippets

### Tech Stack

- **Frontend**: React, TypeScript, Three.js (r166), CSS
- **Backend**: Node.js, Express (static file serving)
- **3D Rendering**: WebGL via Three.js
- **Audio**: Web Audio API
- **Data Sources**: Open-Meteo Weather API, OpenAQ Air Quality API
- **Deployment**: Vercel (frontend), Render (optional backend)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/username/the-city-breathes.git
cd the-city-breathes

# Install dependencies
npm install

# Start the development server
npm start

# Open in browser
http://localhost:5173
```

### API & Data Sources

- **Weather Data**: [Open-Meteo Forecast API](https://open-meteo.com/) - Free, no API key required
- **Air Quality Data**: [OpenAQ API](https://docs.openaq.org/) - Free, no API key required
- **Traffic Simulation**: Procedural generation based on time of day
- **Social Activity**: Procedural generation simulating public activity patterns

### Data Mapping

| Data Category | Visual Effect | Audio Effect |
|---------------|---------------|--------------|
| Traffic | Breathing speed, rotation | Rhythm, filter cutoff |
| Air Quality | Color stress, surface roughness | Harmonic content |
| Weather | Surface waves, lighting | Pitch base |
| Social | Particle emission | Secondary oscillators |
| Overall | Deformation amplitude | Volume |

### Demo Mode

When live APIs are unavailable, the application automatically uses procedurally generated fallback data based on city coordinates and time of day. This ensures the sculpture remains functional during presentations.

### Project Structure

```
.
├── index.html          # Main HTML entry point
├── styles.css          # Global styles and responsive design
├── server.js           # Simple Node.js static file server
├── package.json        # Project dependencies and scripts
├── README.md           # This file
└── src/
    └── app.js          # Main application logic (Three.js, Web Audio)
```

### Credits and Attributions

- Three.js r166 - 3D rendering engine
- Open-Meteo - Weather forecast and air-quality data
- OpenAQ - Air quality measurements
- Web Audio API - Browser-native generative sound

---

## 11. Future Extensions

### Multi-City Comparison Mode

Display multiple sculptures side by side, each representing a different city. Users could compare how cities "breathe" differently, creating a global portrait of urban life. This would extend the concept from individual experience to collective observation.

### Public Installations

Connect the digital sculpture to a physical kinetic sculpture in a gallery or public space. Sensors could feed real city data into the physical installation, creating a feedback loop between digital and physical art. This would bring the concept into the physical world where it could be experienced by non-digital audiences.

### Collaborative Mode

Allow multiple users to influence the sculpture together, either in the same location or remotely. Communities could contribute to a shared "breath," making the artwork a representation of collective will and action. This would transform the sculpture from individual experience to community ritual.

### IoT Sensor Integration

Connect to actual IoT sensors in real city infrastructure—traffic cameras, air quality monitors, noise sensors. This would create a direct physical-to-digital feedback loop where the sculpture responds to the actual city it represents, not just API approximations.

### Mobile AR Version

Develop a mobile app version that uses augmented reality to place the breathing city sculpture into the user's environment. Users could "invite the city" into their living room, making the data artwork portable and personal. This would extend the experience beyond the gallery into everyday spaces.

### Educational Mode

Add an educational layer explaining how each data category is measured and what it indicates about urban health. Include historical data comparisons and predictive modeling. This would transform the artwork into a teaching tool for civic education and environmental awareness.

---

*This documentation represents the complete technical and artistic vision for The City Breathes, designed for hackathon presentation and future development.*
