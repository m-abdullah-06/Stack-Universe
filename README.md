<div align="center">
  <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" width="80" alt="GitHub Logo" />
  <h1>🌌 Stack Universe</h1>
  <p><strong>Every developer has a universe. Let's explore yours.</strong></p>
  <p>
    <a href="#about">About</a> •
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a>
  </p>
</div>

<br />

> Forget boring graphs, generic tables, and pie charts. Your GitHub profile is a cosmic event waiting to be visualized.

**Stack Universe** is a 3D, WebGL-powered visualization tool that instantly transforms any GitHub developer's profile into an interactive, stunning solar system. It turns your life's work as a coder into a literal universe you can fly through, share, and show off.

<div align="center">
  *(Drop a beautiful screenshot or GIF of the app here!)*
</div>

## 🚀 How It Works

Type in any GitHub username (yes, even `torvalds`) and watch the magic:

*   ☀️ **The Central Star (You):** Your total stars, repositories, and account age generate a **Universe Score**. The higher your score, the larger, brighter, and hotter your central star burns—from a dim red dwarf to a blinding blue-white giant.
*   🪐 **The Planets (Your Languages):** Your most-used programming languages orbit your star. The size of the planet represents how much of your code is written in that language. 
*   ☄️ **Orbit Speeds:** The closer a planet orbits your star, the more recently you've pushed code in that language.
*   🌑 **Asteroids & Moons (Your Repos):** Your repositories are scattered throughout your system as asteroids and moons, caught in the gravity of their primary language.
*   💫 **Shooting Stars (Recent Commits):** Live comets tear through your solar system representing your most recent commits! 

## 🏆 The Hall of Giants
Think your universe is impressive? See how you stack up against the best. The landing page is a living observatory into the **Multiverse**, featuring a real-time leaderboard ("The Hall of Giants"). Top-ranking developers manifest as massive, golden stars floating in deep space, complete with orbital glowing rings.

Click anywhere in the deep space background to engage the warp drive and be randomly dropped into a newly discovered developer's universe!

## 🛠️ The Tech Stack (What makes it glow)
This project is built using an extremely modern, high-performance stack capable of rendering thousands of orbiting bodies at a smooth 60fps.

*   **Framework:** [Next.js 14](https://nextjs.org/) (App Router) & React
*   **3D Engine:** [Three.js](https://threejs.org/) & [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction) + Drei
*   **Post-Processing:** Bloom effects & Chromatic Aberrations powered by `@react-three/postprocessing`
*   **Styling & UI Anim:** Tailwind CSS & Framer Motion
*   **Database:** [Supabase](https://supabase.com/) (For tracking discovered universes and powering the Leaderboard)
*   **Data Source:** The Live GitHub REST API

## 🌠 Getting Started Locally

Ready to launch your own local instance of the multiverse? It's easy.

### Prerequisites

1.  Node.js (v18+)
2.  A [GitHub Personal Access Token](https://github.com/settings/tokens) (to bypass API rate limits)
3.  A [Supabase](https://supabase.com/) project (for the leaderboard and database)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/stack-universe.git
   cd stack-universe
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or yarn, or pnpm
   ```

3. **Set up your environment variables:**
   Create a `.env.local` file in the root directory and add:
   ```env
   GITHUB_TOKEN=your_github_personal_access_token
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Ignition! Start the development server:**
   ```bash
   npm run dev
   ```

5. **Explore:** Open [http://localhost:3000](http://localhost:3000) and enter a username!

## 👽 Contributing
Found a bug in deep space? Want to add a new orbital mechanic or feature? Pull requests are highly welcome! 

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).

---
<div align="center">
  <b>Built with ☕, 🌌, and too much Three.js.</b><br>
  <i>"Remember to look up at the stars and not down at your feet." - Stephen Hawking</i>
</div>
