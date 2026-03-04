# **UI/UX Design Specification: Table Tennis Aggregator**

This document outlines the frontend architecture, styling guidelines, and component requirements for the Table Tennis Aggregator MVP.

**Target Platform:** Mobile-First Web Application (PWA ready).

**Framework:** React (Vite) \+ TypeScript.

**Styling:** Tailwind CSS.

**Icons:** lucide-react.

## **1\. Design Language & Theming**

The application follows a modern, premium sports aggregator aesthetic (similar to ESPN, SofaScore, or Transfermarkt).

### **1.1 Color Palette**

* **Primary Brand (Gradients):** Headers use heavy gradients from emerald-600 to teal-800.  
* **Dark Accents:** slate-900 is used for high-contrast elements (e.g., Team Hub headers, active states).  
* **Backgrounds:** The app uses a layered approach. The root background is slate-200 (to simulate the area outside the mobile viewport on desktop). The mobile container background is slate-50. Surface elements (cards) are pure white.  
* **Success/Win:** emerald-500 (Text/Borders) and emerald-50 (Backgrounds).  
* **Danger/Loss:** red-500 and red-50.  
* **Neutral/Draw:** slate-400 and slate-100.  
* **Accent/Highlights:** indigo-500 (for Iron Man/H2H UI) and yellow-500 (for Invincibles/Medals).

### **1.2 UI Paradigms**

* **Glassmorphism:** Navigation bars and floating menus use bg-white/80 backdrop-blur-xl.  
* **Border Radii:** The app heavily utilizes extreme rounding. Main headers are rounded-b-\[2.5rem\]. Standard cards are rounded-2xl or rounded-3xl.  
* **Scrolling:** Horizontal lists (Insights, League Selectors) must use CSS to hide the scrollbar (hide-scrollbar class) while remaining touch-scrollable.  
* **Overlays vs. Pages:** When a user clicks a Player, Team, or Fixture, it acts as a full-screen overlay with a top-left "Back" arrow button, rather than a completely new route, maintaining the state of the underlying tabs.

## **2\. Global State, Navigation & Entity Linkages**

### **2.1 The Global Region Filter**

* **Trigger:** A "Filter" button in the top right of the Home and Leagues views.  
* **UI:** A bottom-sheet style slide-up overlay (animate-slide-up).  
* **Functionality:** Allows the user to toggle boolean active states for multiple local leagues (e.g., Brentwood, Chelmsford).  
* **State Effect:** Changing this filter globally dictates what data populates the Home Search and the Regional Leaderboards.

### **2.2 Bottom Navigation**

A floating pill navigation fixed to the bottom of the screen (absolute bottom-6 left-6 right-6 z-50).

* **Tabs:** Home (Search icon), H2H (Swords icon), Leagues (Trophy icon).  
* **Behavior:** Clicking a tab resets any active full-screen overlays (closes open player/team profiles).

### **2.3 Entity Linkage Matrix (CRITICAL REQUIREMENT)**

To ensure a true "Wiki-style" browsing experience, entities must be hyperlinked across all views:

* **Player Entity:** Whenever a Player's name appears (in Standings, Squad Lists, Match Breakdowns, or Leaderboards), clicking it MUST open the PlayerProfileView.  
* **Team Entity:** Whenever a Team's name appears (in Standings, Fixture Scoreboards, or Cup Brackets), clicking it MUST open the TeamHubView.  
* **Fixture Entity:** Whenever a specific Match/Rubber result appears (in a Player's Recent Rubbers, Team's Form, or H2H Encounters), clicking it MUST open the FixtureDetailsView.

## **3\. Screen Requirements & Component Architecture**

Break the application down into the following distinct view components.

### **3.1 HomeView**

* **Header:** Hero gradient with the app title and the Global Region Filter button. Contains the primary Player Search \<input\>.  
* **Match Center (Conditional):** If there is no active search query, display a dark slate-900 card highlighting a premium upcoming fixture ("Match of the Week"). *Clicking team names opens TeamHubView.*  
* **Feed:** Below the header, show a list of players. If searching, show Search Results. If empty, show Trending Players.  
* **Player Card:** Displays avatar, name, clubs, and an emerald pill highlighting their overall Win Rate. *Clicking opens PlayerProfileView.*

### **3.2 PlayerProfileView (Overlay)**

* **Header:** Hero gradient with a "Back" button, large player avatar, name, and a comma-separated list of their clubs.  
* **Main Stats Card:** A white floating card overlapping the header intersection (-mt-12). Shows Win Rate, Matches Played, and Form (e.g., W3, L1).  
* **Insights Row:** A horizontally scrolling row of cards.  
  * *Nemesis Card:* Shows the opponent with the worst H2H record. *Clicking opponent name opens their PlayerProfileView.*  
  * *Dynamic Duo Card:* Shows the best doubles partner. *Clicking partner name opens their PlayerProfileView.*  
* **Recent Rubbers Feed:** A chronological list of individual matches played.  
  * Must display a left border indicator (emerald for win, red for loss).  
  * Must display the league name, date, opponent, and the exact match score.  
  * **Linkage:** Clicking a rubber row opens the FixtureDetailsView.

### **3.3 FixtureDetailsView (Overlay)**

* **Header:** Displays the League name and Date.  
* **Scoreboard Card:** A floating card showing Team A vs Team B, with the giant aggregate score (e.g., 6 \- 4). Shows the venue string at the bottom.  
  * **Linkage:** Clicking "Team A" or "Team B" MUST open their respective TeamHubView.  
* **Match Breakdown:** A list of every individual rubber played in that fixture.  
  * Shows Player 1 vs Player 2 with the game score (e.g., 3-1).  
  * Has an isDoubles flag to render two names per side.  
  * **Linkage:** Clicking any individual player's name MUST instantly open their PlayerProfileView.

### **3.4 TeamHubView (Overlay)**

* **Header:** Dark slate-900 theme to differentiate from player profiles. Features a shield icon, team name, and league name.  
* **Stats Card:** Shows current League Position, Recent Form (W-W-D-L), and Total Points.  
* **Recent Fixtures List:** A short list of the team's last 3 matches and next upcoming match.  
  * **Linkage:** Clicking a match row opens the FixtureDetailsView.  
* **Active Squad List:** A list of all external\_players linked to this team. Shows their name, matches played for this team, and their win rate.  
  * **Linkage:** Clicking a player row opens the PlayerProfileView.

### **3.5 LeaguesHubView**

* **Header:** Hero gradient with a nested Segmented Control (Toggle between Tables, Cups, Leaders).  
* **State 1: Tables**  
  * **Two-Tier Chooser:** A white card containing two horizontally scrolling rows. Row 1: League Selector (e.g., Brentwood, Romford). Row 2: Division Selector (e.g., Premier, Div 1). Selecting a League automatically resets the Division to Div 1\.  
  * **Data Table:** Renders position, team name, played, and points.  
  * **Linkage:** Clicking a team row opens the TeamHubView.  
* **State 2: Cups**  
  * Visual Knockout Bracket UI. Displays match-ups connected by UI lines, showing progressing teams and scores.  
  * **Linkage:** Clicking any Team block in the bracket opens the TeamHubView.  
* **State 3: Leaders (Regional)**  
  * A banner explicitly stating "Comparing players across X selected leagues".  
  * Lists "The Invincibles" (100% win rate players) and "Regional Iron Man" (Most rubbers played).  
  * **Linkage:** Clicking any player row opens the PlayerProfileView.

### **3.6 H2HView**

* **Player Selection UI:** Dark slate-900 header with two large selection slots (Player A and Player B).  
* **Selection State:** Clicking a slot opens a full-screen search list to pick a player.  
* **Aggregate Scoreboard:** Once both are selected, a floating card shows the combined historical Wins for A, Draws, and Wins for B.  
* **Past Encounters List:** A chronological feed of every rubber they have played against each other, displaying the league context, date, and game score.  
  * **Linkage:** Clicking an encounter row opens the specific FixtureDetailsView for that night.

## **4\. Engineering Constraints for AI Agent**

When implementing this UI:

1. **Componentization:** Do NOT write the entire UI in App.tsx. Extract views into a /views folder and smaller reusable parts (like PlayerCard, BottomNav) into a /components folder.  
2. **Icons:** Use lucide-react. Ensure icons are properly sized (usually size={16} to size={24}).  
3. **Data Mocking:** For the initial frontend build, isolate the mock data into a separate file (src/lib/mock-data.ts) so it can easily be swapped out for TanStack Query API calls later.  
4. **Tailwind Classes:** Strictly adhere to the class names provided in the prototype. Ensure the custom hide-scrollbar CSS is injected globally.  
5. **Enforce Linkages:** Implement standard onClick callback props (e.g., onPlayerSelect, onTeamSelect, onFixtureSelect) recursively down the component tree to satisfy the requirements defined in Section 2.3.