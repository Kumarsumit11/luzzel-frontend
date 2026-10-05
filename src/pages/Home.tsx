import React, { useEffect, useState } from "react";
import { PUZZLES } from "../data/puzzles";

interface HomeProps {
  onCreateRoom: (puzzleId: string, playerName: string) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  errorMessage?: string | null;
  isLoading?: boolean;
}

const PuzzleMark = ({ className = "" }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={className}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 7h12v5.2a5.8 5.8 0 1 0 8 0V7h12v13h-5.2a5.8 5.8 0 1 0 0 8H40v13H27v-5.2a5.8 5.8 0 1 0-8 0V41H8V28h5.2a5.8 5.8 0 1 0 0-8H8V7Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinejoin="round"
    />
  </svg>
);

const ArrowIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 12h13m-5-5 5 5-5 5"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const UsersIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
    <path
      d="M3.5 19c.4-4 2.2-6 5.5-6s5.1 2 5.5 6M15 5.4a3 3 0 0 1 0 5.2M16 13c2.7.3 4.2 2.3 4.5 5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const Spark = ({ className }: { className: string }) => (
  <svg
    aria-hidden="true"
    className={className}
    viewBox="0 0 34 34"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M17 2c.8 9.5 5.5 14.2 15 15-9.5.8-14.2 5.5-15 15C16.2 22.5 11.5 17.8 2 17 11.5 16.2 16.2 11.5 17 2Z"
      fill="currentColor"
      stroke="#20201E"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

export const Home: React.FC<HomeProps> = ({
  onCreateRoom,
  onJoinRoom,
  errorMessage,
  isLoading = false,
}) => {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem("luzzel_player_name") || "";
  });
  const [roomCode, setRoomCode] = useState("");
  const [selectedPuzzleId, setSelectedPuzzleId] = useState(PUZZLES[0].id);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("room");

    if (code) {
      setRoomCode(code.toUpperCase());
      setMode("join");
    }
  }, []);

  const handleNameChange = (value: string) => {
    setPlayerName(value);
    localStorage.setItem("luzzel_player_name", value);
  };

  const handleCreateSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!playerName.trim()) return;
    onCreateRoom(selectedPuzzleId, playerName.trim());
  };

  const handleJoinSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!playerName.trim() || !roomCode.trim()) return;
    onJoinRoom(roomCode.trim().toUpperCase(), playerName.trim());
  };

  return (
    <main className="lz-page">
      <style>{`
        .lz-page {
          --ink: #20201e;
          --paper: #fffaf0;
          --yellow: #ffd84d;
          --pink: #ff6f91;
          --blue: #70c8ff;
          --green: #8edb91;
          --purple: #a88cff;
          min-height: 100dvh;
          position: relative;
          display: grid;
          place-items: center;
          overflow: hidden;
          padding: max(20px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right))
            max(20px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
          color: var(--ink);
          background-color: #f5ebd4;
          background-image:
            radial-gradient(circle at 18% 18%, rgba(255, 255, 255, .8) 0 2px, transparent 3px),
            radial-gradient(circle at 83% 72%, rgba(32, 32, 30, .1) 0 1.5px, transparent 2px);
          background-size: 31px 31px, 27px 27px;
          font-family: "Trebuchet MS", "Arial Rounded MT Bold", Arial, sans-serif;
          isolation: isolate;
        }

        .lz-page *,
        .lz-page *::before,
        .lz-page *::after {
          box-sizing: border-box;
        }

        .lz-blob {
          position: absolute;
          z-index: -2;
          border: 3px solid var(--ink);
          opacity: .95;
          animation: lz-drift 9s ease-in-out infinite alternate;
        }

        .lz-blob--one {
          width: min(36vw, 420px);
          aspect-ratio: 1.2;
          left: -10vw;
          top: -11vh;
          border-radius: 46% 54% 65% 35% / 54% 38% 62% 46%;
          background: var(--pink);
          transform: rotate(12deg);
        }

        .lz-blob--two {
          width: min(33vw, 380px);
          aspect-ratio: 1;
          right: -9vw;
          bottom: -16vh;
          border-radius: 64% 36% 41% 59% / 42% 55% 45% 58%;
          background: var(--blue);
          animation-delay: -4s;
        }

        .lz-squiggle {
          position: absolute;
          width: 120px;
          height: 22px;
          z-index: -1;
          opacity: .7;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='22' viewBox='0 0 120 22'%3E%3Cpath d='M2 12c10-13 20 13 30 0s20 13 30 0 20 13 30 0 17 10 26 1' fill='none' stroke='%2320201e' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E") center / contain no-repeat;
        }

        .lz-squiggle--one { left: 7%; bottom: 18%; transform: rotate(-13deg); }
        .lz-squiggle--two { right: 6%; top: 18%; transform: rotate(12deg); }

        .lz-floater {
          position: absolute;
          z-index: -1;
          width: clamp(54px, 8vw, 88px);
          aspect-ratio: 1;
          filter: drop-shadow(4px 5px 0 rgba(32, 32, 30, .25));
          animation: lz-float 5s ease-in-out infinite;
        }

        .lz-floater--one {
          left: 7%;
          top: 24%;
          color: var(--yellow);
          transform: rotate(-15deg);
        }

        .lz-floater--two {
          right: 8%;
          bottom: 23%;
          color: var(--green);
          transform: rotate(13deg);
          animation-delay: -2.4s;
        }

        .lz-spark {
          position: absolute;
          z-index: -1;
          width: 36px;
          color: var(--yellow);
          animation: lz-twinkle 2.4s ease-in-out infinite;
        }

        .lz-spark--one { top: 11%; right: 23%; }
        .lz-spark--two { bottom: 10%; left: 25%; color: var(--pink); animation-delay: -1.2s; }

        .lz-card {
          width: min(100%, 480px);
          position: relative;
          padding: clamp(22px, 5vw, 38px);
          border: 3px solid var(--ink);
          border-radius: 28px 22px 30px 20px;
          background: var(--paper);
          box-shadow: 9px 10px 0 var(--ink);
          animation: lz-arrive .65s cubic-bezier(.2, .9, .25, 1.25) both;
        }

        .lz-tape {
          position: absolute;
          width: 88px;
          height: 28px;
          top: -17px;
          left: 50%;
          transform: translateX(-50%) rotate(-2deg);
          border: 2px solid rgba(32, 32, 30, .45);
          background: rgba(255, 216, 77, .8);
          clip-path: polygon(4% 4%, 100% 0, 95% 100%, 0 91%);
        }

        .lz-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .lz-kicker {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin: 0 0 9px;
          padding: 5px 10px;
          border: 2px solid var(--ink);
          border-radius: 999px;
          background: var(--green);
          box-shadow: 2px 2px 0 var(--ink);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .11em;
          text-transform: uppercase;
          transform: rotate(-1deg);
        }

        .lz-kicker svg { width: 17px; height: 17px; }

        .lz-title {
          display: flex;
          justify-content: center;
          margin: 0;
          font-size: clamp(42px, 11vw, 64px);
          font-weight: 1000;
          line-height: .95;
          letter-spacing: -.07em;
        }

        .lz-letter {
          display: inline-block;
          -webkit-text-stroke: 2px var(--ink);
          paint-order: stroke fill;
          filter: drop-shadow(3px 4px 0 var(--ink));
          animation: lz-letter-bop 3.2s ease-in-out infinite;
        }

        .lz-letter:nth-child(1), .lz-letter:nth-child(4) { color: var(--pink); transform: rotate(-5deg); }
        .lz-letter:nth-child(2), .lz-letter:nth-child(5) { color: var(--yellow); animation-delay: -.35s; }
        .lz-letter:nth-child(3), .lz-letter:nth-child(6) { color: var(--blue); transform: rotate(4deg); animation-delay: -.7s; }

        .lz-subtitle {
          max-width: 320px;
          margin: 12px auto 0;
          color: #5d5a53;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.45;
        }

        .lz-error {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-bottom: 15px;
          padding: 11px 12px;
          border: 2px solid var(--ink);
          border-radius: 12px;
          color: var(--ink);
          background: #ffb6b6;
          box-shadow: 3px 3px 0 var(--ink);
          font-size: 12px;
          font-weight: 700;
          line-height: 1.4;
        }

        .lz-error::before {
          content: "!";
          display: grid;
          flex: 0 0 20px;
          height: 20px;
          place-items: center;
          border: 2px solid var(--ink);
          border-radius: 50%;
          background: var(--paper);
          font-weight: 900;
          line-height: 1;
        }

        .lz-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 7px;
          padding: 5px;
          margin-bottom: 20px;
          border: 2px solid var(--ink);
          border-radius: 15px;
          background: #e9dfcc;
        }

        .lz-tab {
          min-height: 43px;
          border: 2px solid transparent;
          border-radius: 10px;
          color: #656057;
          background: transparent;
          font: inherit;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
          transition: transform .16s ease, background-color .16s ease, box-shadow .16s ease;
          -webkit-tap-highlight-color: transparent;
        }

        .lz-tab:hover { transform: translateY(-1px); color: var(--ink); }
        .lz-tab:focus-visible { outline: 3px solid var(--purple); outline-offset: 2px; }
        .lz-tab[aria-selected="true"] {
          border-color: var(--ink);
          color: var(--ink);
          background: var(--yellow);
          box-shadow: 2px 3px 0 var(--ink);
          transform: translateY(-2px) rotate(-.5deg);
        }

        .lz-form {
          display: grid;
          gap: 16px;
          animation: lz-form-in .3s ease both;
        }

        .lz-field { display: grid; gap: 7px; }

        .lz-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-inline: 2px;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .02em;
        }

        .lz-hint {
          color: #777168;
          font-size: 10px;
          font-weight: 700;
        }

        .lz-input,
        .lz-select {
          width: 100%;
          min-height: 49px;
          padding: 0 14px;
          border: 2px solid var(--ink);
          border-radius: 12px 15px 11px 14px;
          outline: none;
          color: var(--ink);
          background: white;
          box-shadow: 3px 3px 0 #d7ccb8;
          font: inherit;
          font-size: 14px;
          font-weight: 700;
          transition: box-shadow .15s ease, transform .15s ease, background-color .15s ease;
        }

        .lz-input::placeholder { color: #9a9387; font-weight: 600; }
        .lz-input:hover, .lz-select:hover { background: #fffdf8; }
        .lz-input:focus, .lz-select:focus {
          box-shadow: 4px 4px 0 var(--blue);
          transform: translate(-1px, -1px);
        }

        .lz-input--code {
          text-transform: uppercase;
          text-align: center;
          letter-spacing: .22em;
          font-family: "Courier New", monospace;
          font-size: 17px;
          font-weight: 900;
        }

        .lz-select {
          appearance: none;
          padding-right: 44px;
          background-image:
            linear-gradient(45deg, transparent 50%, var(--ink) 50%),
            linear-gradient(135deg, var(--ink) 50%, transparent 50%);
          background-position:
            calc(100% - 20px) 21px,
            calc(100% - 14px) 21px;
          background-size: 6px 6px, 6px 6px;
          background-repeat: no-repeat;
          cursor: pointer;
        }

        .lz-button {
          display: flex;
          min-height: 52px;
          align-items: center;
          justify-content: center;
          gap: 9px;
          margin-top: 3px;
          border: 2px solid var(--ink);
          border-radius: 13px 16px 12px 15px;
          color: var(--ink);
          background: var(--pink);
          box-shadow: 5px 6px 0 var(--ink);
          font: inherit;
          font-size: 14px;
          font-weight: 1000;
          cursor: pointer;
          transition: transform .14s ease, box-shadow .14s ease, filter .14s ease;
          -webkit-tap-highlight-color: transparent;
        }

        .lz-button--join { background: var(--green); }
        .lz-button svg { width: 20px; height: 20px; transition: transform .15s ease; }
        .lz-button:hover:not(:disabled) { transform: translate(-2px, -2px) rotate(-.5deg); box-shadow: 7px 8px 0 var(--ink); filter: saturate(1.1); }
        .lz-button:hover:not(:disabled) svg { transform: translateX(3px); }
        .lz-button:active:not(:disabled) { transform: translate(4px, 5px); box-shadow: 1px 1px 0 var(--ink); }
        .lz-button:focus-visible { outline: 3px solid var(--purple); outline-offset: 3px; }
        .lz-button:disabled { cursor: not-allowed; opacity: .52; filter: grayscale(.35); }

        .lz-loader {
          width: 18px;
          height: 18px;
          border: 3px solid rgba(32, 32, 30, .25);
          border-top-color: var(--ink);
          border-radius: 50%;
          animation: lz-spin .75s linear infinite;
        }

        .lz-footnote {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin: 17px 0 0;
          color: #777168;
          font-size: 10px;
          font-weight: 800;
          text-align: center;
        }

        .lz-footnote::before,
        .lz-footnote::after {
          content: "";
          width: 18px;
          border-top: 2px solid #b6ac9b;
        }

        @keyframes lz-arrive {
          from { opacity: 0; transform: translateY(24px) rotate(-1deg) scale(.96); }
          to { opacity: 1; transform: translateY(0) rotate(0) scale(1); }
        }

        @keyframes lz-form-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes lz-float {
          0%, 100% { translate: 0 0; rotate: -3deg; }
          50% { translate: 0 -15px; rotate: 5deg; }
        }

        @keyframes lz-drift {
          from { translate: 0 0; rotate: -2deg; }
          to { translate: 18px 12px; rotate: 4deg; }
        }

        @keyframes lz-letter-bop {
          0%, 82%, 100% { translate: 0 0; }
          88% { translate: 0 -5px; }
          94% { translate: 0 2px; }
        }

        @keyframes lz-twinkle {
          0%, 100% { scale: .8; rotate: 0deg; }
          50% { scale: 1.15; rotate: 12deg; }
        }

        @keyframes lz-spin { to { transform: rotate(360deg); } }

        @media (max-width: 640px) {
          .lz-page {
            place-items: center;
            overflow-y: auto;
          }

          .lz-card {
            padding: 24px 18px 21px;
            border-radius: 22px 18px 24px 17px;
            box-shadow: 6px 7px 0 var(--ink);
          }

          .lz-header { margin-bottom: 19px; }
          .lz-subtitle { font-size: 12px; }
          .lz-tabs { margin-bottom: 17px; }
          .lz-floater { opacity: .28; width: 58px; }
          .lz-floater--one { left: -15px; top: 12%; }
          .lz-floater--two { right: -16px; bottom: 10%; }
          .lz-spark--one { right: 3%; top: 5%; }
          .lz-spark--two { left: 2%; bottom: 4%; }
          .lz-squiggle { display: none; }
        }

        @media (max-height: 710px) and (min-width: 641px) {
          .lz-page { padding-block: 14px; }
          .lz-card { padding-block: 22px; }
          .lz-header { margin-bottom: 16px; }
          .lz-title { font-size: 46px; }
          .lz-subtitle { margin-top: 8px; }
          .lz-tabs { margin-bottom: 14px; }
          .lz-form { gap: 12px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .lz-page *,
          .lz-page *::before,
          .lz-page *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      <div className="lz-blob lz-blob--one" aria-hidden="true" />
      <div className="lz-blob lz-blob--two" aria-hidden="true" />
      <div className="lz-squiggle lz-squiggle--one" aria-hidden="true" />
      <div className="lz-squiggle lz-squiggle--two" aria-hidden="true" />
      <PuzzleMark className="lz-floater lz-floater--one" />
      <PuzzleMark className="lz-floater lz-floater--two" />
      <Spark className="lz-spark lz-spark--one" />
      <Spark className="lz-spark lz-spark--two" />

      <section className="lz-card" aria-labelledby="luzzel-title">
        <div className="lz-tape" aria-hidden="true" />

        <header className="lz-header">
          <p className="lz-kicker">
            <UsersIcon />
            Two minds, one puzzle
          </p>
          <h1 className="lz-title" id="luzzel-title" aria-label="Luzzel">
            {"LUZZEL".split("").map((letter, index) => (
              <span className="lz-letter" aria-hidden="true" key={`${letter}-${index}`}>
                {letter}
              </span>
            ))}
          </h1>
          <p className="lz-subtitle">
            Grab a friend, fit the pieces, and make a tiny masterpiece together.
          </p>
        </header>

        {errorMessage && (
          <div className="lz-error" role="alert">
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="lz-tabs" role="tablist" aria-label="Room options">
          <button
            className="lz-tab"
            type="button"
            role="tab"
            aria-selected={mode === "create"}
            aria-controls="create-panel"
            onClick={() => setMode("create")}
          >
            Make a room
          </button>
          <button
            className="lz-tab"
            type="button"
            role="tab"
            aria-selected={mode === "join"}
            aria-controls="join-panel"
            onClick={() => setMode("join")}
          >
            Join a friend
          </button>
        </div>

        {mode === "create" ? (
          <form
            className="lz-form"
            id="create-panel"
            role="tabpanel"
            onSubmit={handleCreateSubmit}
          >
            <div className="lz-field">
              <label className="lz-label" htmlFor="create-player-name">
                Your nickname
                <span className="lz-hint">25 characters max</span>
              </label>
              <input
                className="lz-input"
                id="create-player-name"
                type="text"
                required
                maxLength={25}
                autoComplete="nickname"
                value={playerName}
                onChange={(event) => handleNameChange(event.target.value)}
                placeholder="What should we call you?"
              />
            </div>

            <div className="lz-field">
              <label className="lz-label" htmlFor="puzzle-select">
                Pick your challenge
              </label>
              <select
                className="lz-select"
                id="puzzle-select"
                value={selectedPuzzleId}
                onChange={(event) => setSelectedPuzzleId(event.target.value)}
              >
                {PUZZLES.map((puzzle) => (
                  <option key={puzzle.id} value={puzzle.id}>
                    {puzzle.title} — {puzzle.rows * puzzle.columns} pieces
                  </option>
                ))}
              </select>
            </div>

            <button
              className="lz-button"
              type="submit"
              disabled={isLoading || !playerName.trim()}
            >
              {isLoading ? (
                <>
                  <span className="lz-loader" aria-hidden="true" />
                  Building your room...
                </>
              ) : (
                <>
                  Create my room
                  <ArrowIcon />
                </>
              )}
            </button>
          </form>
        ) : (
          <form
            className="lz-form"
            id="join-panel"
            role="tabpanel"
            onSubmit={handleJoinSubmit}
          >
            <div className="lz-field">
              <label className="lz-label" htmlFor="join-player-name">
                Your nickname
                <span className="lz-hint">25 characters max</span>
              </label>
              <input
                className="lz-input"
                id="join-player-name"
                type="text"
                required
                maxLength={25}
                autoComplete="nickname"
                value={playerName}
                onChange={(event) => handleNameChange(event.target.value)}
                placeholder="What should we call you?"
              />
            </div>

            <div className="lz-field">
              <label className="lz-label" htmlFor="room-code">
                Secret room code
                <span className="lz-hint">Ask your puzzle pal</span>
              </label>
              <input
                className="lz-input lz-input--code"
                id="room-code"
                type="text"
                required
                maxLength={10}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                inputMode="text"
                value={roomCode}
                onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                placeholder="ABC123"
              />
            </div>

            <button
              className="lz-button lz-button--join"
              type="submit"
              disabled={isLoading || !playerName.trim() || !roomCode.trim()}
            >
              {isLoading ? (
                <>
                  <span className="lz-loader" aria-hidden="true" />
                  Finding the room...
                </>
              ) : (
                <>
                  Jump into the puzzle
                  <ArrowIcon />
                </>
              )}
            </button>
          </form>
        )}

        <p className="lz-footnote">Live, collaborative, and best with a friend</p>
      </section>
    </main>
  );
};

export default Home;
