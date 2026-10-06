import { useState, useEffect, useRef } from "react";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  ListTodo,
  Plus,
  Trash2,
  Coffee,
  CloudRain,
  Radio,
  Waves,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type SoundType = "rain" | "waves" | "whitenoise" | "cafe";

export function FocusStudioView() {
  // Timer State
  const [timerMode, setTimerMode] = useState<"focus" | "shortBreak" | "longBreak">("focus");
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(3);
  const [minutesToday, setMinutesToday] = useState(75);

  // Sound Synthesizer State (Web Audio API)
  const [activeSound, setActiveSound] = useState<SoundType | null>(null);
  const [volume, setVolume] = useState(0.4);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundNodesRef = useRef<{
    source?: AudioNode;
    gainNode?: GainNode;
    filterNode?: BiquadFilterNode;
  }>({});

  // Focus Tasks State
  const [tasks, setTasks] = useState<Array<{ id: string; text: string; done: boolean }>>([
    { id: "1", text: "Implement custom debounce utility in Code Lab", done: true },
    { id: "2", text: "Review React Fiber lifecycle flashcard deck", done: false },
    { id: "3", text: "Submit TypeScript Module 3 project assignment", done: false },
  ]);
  const [newTaskText, setNewTaskText] = useState("");
  const isHydratedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSessions = localStorage.getItem("skillbridge_focus_sessions");
      if (savedSessions) setSessionsCompleted(Number(savedSessions));
      const savedMins = localStorage.getItem("skillbridge_focus_minutes");
      if (savedMins) setMinutesToday(Number(savedMins));
      const savedTasks = localStorage.getItem("skillbridge_focus_tasks");
      if (savedTasks) {
        try {
          setTasks(JSON.parse(savedTasks));
        } catch {
          // ignore corrupted task JSON
        }
      }
      isHydratedRef.current = true;
    }
  }, []);

  // Persist tasks
  useEffect(() => {
    if (isHydratedRef.current) {
      localStorage.setItem("skillbridge_focus_tasks", JSON.stringify(tasks));
    }
  }, [tasks]);

  // Timer Tick Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      playChime();
      if (timerMode === "focus") {
        const newSessions = sessionsCompleted + 1;
        const newMins = minutesToday + focusMinutes;
        setSessionsCompleted(newSessions);
        setMinutesToday(newMins);
        localStorage.setItem("skillbridge_focus_sessions", String(newSessions));
        localStorage.setItem("skillbridge_focus_minutes", String(newMins));
        // Switch to short break
        setTimerMode("shortBreak");
        setTimeLeft(5 * 60);
      } else {
        // Break finished, return to focus
        setTimerMode("focus");
        setTimeLeft(focusMinutes * 60);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, timerMode, focusMinutes, sessionsCompleted, minutesToday]);

  // Mode change handler
  const handleSetMode = (mode: "focus" | "shortBreak" | "longBreak") => {
    setIsRunning(false);
    setTimerMode(mode);
    if (mode === "focus") setTimeLeft(focusMinutes * 60);
    else if (mode === "shortBreak") setTimeLeft(5 * 60);
    else if (mode === "longBreak") setTimeLeft(15 * 60);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    if (timerMode === "focus") setTimeLeft(focusMinutes * 60);
    else if (timerMode === "shortBreak") setTimeLeft(5 * 60);
    else if (timerMode === "longBreak") setTimeLeft(15 * 60);
  };

  // Web Audio Synthesizer for Ambient Sounds
  const stopAmbientSound = () => {
    try {
      if (soundNodesRef.current.source) {
        if ("stop" in soundNodesRef.current.source) {
          (soundNodesRef.current.source as AudioScheduledSourceNode).stop();
        }
        soundNodesRef.current.source.disconnect();
      }
      if (soundNodesRef.current.gainNode) {
        soundNodesRef.current.gainNode.disconnect();
      }
    } catch {
      // ignore
    }
    soundNodesRef.current = {};
    setActiveSound(null);
  };

  const playAmbientSound = (type: SoundType) => {
    if (activeSound === type) {
      stopAmbientSound();
      return;
    }

    stopAmbientSound();

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Generate brown / white noise buffer
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        if (type === "whitenoise") {
          data[i] = Math.random() * 2 - 1;
        } else if (type === "rain") {
          const white = Math.random() * 2 - 1;
          lastOut = (lastOut + 0.02 * white) / 1.02;
          data[i] = lastOut * 3.5; // Pink/brown noise
        } else if (type === "waves") {
          const white = Math.random() * 2 - 1;
          lastOut = (lastOut + 0.04 * white) / 1.04;
          // modulate with slow swell
          const swell = Math.sin((i / bufferSize) * Math.PI * 4);
          data[i] = lastOut * 2.5 * (0.6 + 0.4 * swell);
        } else {
          // Cafe warm murmur
          const white = Math.random() * 2 - 1;
          lastOut = (lastOut + 0.015 * white) / 1.015;
          data[i] = lastOut * 2.0;
        }
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      // Filter
      const filter = ctx.createBiquadFilter();
      if (type === "rain") {
        filter.type = "lowpass";
        filter.frequency.value = 1000;
      } else if (type === "cafe") {
        filter.type = "bandpass";
        filter.frequency.value = 650;
        filter.Q.value = 1.0;
      } else if (type === "waves") {
        filter.type = "lowpass";
        filter.frequency.value = 800;
      } else {
        filter.type = "lowpass";
        filter.frequency.value = 2400;
      }

      const gain = ctx.createGain();
      gain.gain.value = volume;

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noiseSource.start();

      soundNodesRef.current = {
        source: noiseSource,
        gainNode: gain,
        filterNode: filter,
      };

      setActiveSound(type);
    } catch (e) {
      console.error("Web Audio Sound synth error:", e);
    }
  };

  // Update volume
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (soundNodesRef.current.gainNode) {
      soundNodesRef.current.gainNode.gain.value = newVol;
    }
  };

  // Play pleasant completion chime using Web Audio
  const playChime = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audioCtxRef.current || new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch {
      // ignore
    }
  };

  // Clean up sound on unmount
  useEffect(() => {
    return () => {
      stopAmbientSound();
    };
  }, []);

  // Format mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Task actions
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setTasks((prev) => [
      ...prev,
      { id: `task-${Date.now()}`, text: newTaskText.trim(), done: false },
    ]);
    setNewTaskText("");
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 size-64 rounded-full bg-sky-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/30 px-3 py-1 text-xs font-semibold text-sky-200 border border-sky-400/30">
              <Zap className="size-3.5 text-amber-300" />
              <span>Deep Work & Anti-Distraction Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Focus & Pomodoro Studio
            </h1>
            <p className="text-sm text-sky-100/90 leading-relaxed">
              Udemy and Coursera leave you open to infinite tab switching and lost momentum.
              Skillbridge integrates deep-work Pomodoro sprints and instant synthesizer ambient
              audio directly into your learning workspace.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 text-center border border-white/15 min-w-[120px]">
              <span className="block text-2xl font-black text-amber-300">{sessionsCompleted}</span>
              <span className="text-[11px] font-medium text-sky-200">Sprints Done</span>
            </div>

            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 text-center border border-white/15 min-w-[120px]">
              <span className="block text-2xl font-black text-sky-300">{minutesToday}m</span>
              <span className="text-[11px] font-medium text-sky-200">Focused Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Timer Card (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs text-center space-y-6">
            {/* Mode Selector Tabs */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/80 gap-1 text-xs font-semibold">
              <button
                onClick={() => handleSetMode("focus")}
                className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timerMode === "focus"
                    ? "bg-white text-indigo-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Focus Sprint (25m)
              </button>
              <button
                onClick={() => handleSetMode("shortBreak")}
                className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timerMode === "shortBreak"
                    ? "bg-white text-emerald-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Short Break (5m)
              </button>
              <button
                onClick={() => handleSetMode("longBreak")}
                className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timerMode === "longBreak"
                    ? "bg-white text-sky-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Long Break (15m)
              </button>
            </div>

            {/* Giant Circular Timer Display */}
            <div className="py-4">
              <div className="text-6xl sm:text-7xl font-mono font-black tracking-tight text-slate-900">
                {formatTime(timeLeft)}
              </div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {timerMode === "focus" ? "🧠 Focused Learning Block" : "☕ Rest & Recharge"}
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => setIsRunning(!isRunning)}
                className={`min-w-[140px] text-sm font-bold shadow-xs ${
                  isRunning
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="size-4 mr-2" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="size-4 mr-2 fill-current" /> Start Sprint
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleResetTimer}
                className="text-xs text-slate-600 hover:bg-slate-50"
              >
                <RotateCcw className="size-4 mr-1.5" /> Reset
              </Button>
            </div>
          </div>

          {/* Web Audio Ambient Sound Player */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Volume2 className="size-4 text-sky-600" />
                  Synthesized Ambient Soundscapes
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pure in-browser procedural audio generator. Zero downloads, 100% focus.
                </p>
              </div>

              {activeSound && (
                <button
                  onClick={stopAmbientSound}
                  className="text-xs text-rose-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <VolumeX className="size-3.5" /> Mute
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: "rain", label: "Rainfall", icon: CloudRain },
                { id: "waves", label: "Ocean Waves", icon: Waves },
                { id: "whitenoise", label: "White Noise", icon: Radio },
                { id: "cafe", label: "Cozy Cafe", icon: Coffee },
              ].map((sound) => {
                const isActive = activeSound === sound.id;
                const Icon = sound.icon;
                return (
                  <button
                    key={sound.id}
                    onClick={() => playAmbientSound(sound.id as SoundType)}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
                      isActive
                        ? "bg-sky-50 border-sky-500 text-sky-900 ring-2 ring-sky-500/20 shadow-xs"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <Icon
                      className={`size-5 ${isActive ? "text-sky-600 animate-pulse" : "text-slate-500"}`}
                    />
                    <span className="text-xs font-bold">{sound.label}</span>
                    <span className="text-[10px] text-slate-400">
                      {isActive ? "Playing..." : "Click to Play"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Volume Slider */}
            {activeSound && (
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500 font-semibold">Sound Volume:</span>
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-600 w-8 text-right">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Focus Checklist & Daily Goals (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ListTodo className="size-4 text-indigo-600" />
                Sprint Objectives
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {tasks.filter((t) => t.done).length} / {tasks.length} Done
              </span>
            </div>

            {/* Add Task Form */}
            <form onSubmit={handleAddTask} className="flex gap-2">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="What will you conquer this sprint?"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
              />
              <Button
                type="submit"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
              >
                <Plus className="size-3.5" />
              </Button>
            </form>

            {/* Tasks List */}
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No objectives set. Add a learning goal above to stay on track.
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start justify-between gap-3 p-3 rounded-lg border transition-all ${
                      task.done
                        ? "bg-slate-50/70 border-slate-200 text-slate-400 line-through"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                  >
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className="flex items-start gap-2.5 text-left cursor-pointer flex-1"
                    >
                      <CheckCircle2
                        className={`size-4 mt-0.5 shrink-0 ${
                          task.done ? "text-emerald-500 fill-emerald-100" : "text-slate-300"
                        }`}
                      />
                      <span className="text-xs leading-normal font-medium">{task.text}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Deep Work Tips Card */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 text-xs text-indigo-950 space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-indigo-900">
              <Sparkles className="size-4 text-indigo-600" />
              The Flow State Protocol
            </h4>
            <ul className="space-y-1.5 text-[11px] text-indigo-900/80 list-disc list-inside">
              <li>Commit to just one coding problem or module per 25-minute sprint.</li>
              <li>Turn off unrelated messaging tabs and smartphone notifications.</li>
              <li>Step away from your monitor during the 5-minute break to rest optic nerves.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
