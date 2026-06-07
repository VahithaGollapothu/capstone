"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

// --- Types ---
interface FloorPlanRoom {
  name: string;
  dimensions: string;
  position: string;
  description: string;
}

interface FloorPlanData {
  layoutName: string;
  totalAreaSqFt: number;
  floors: {
    floorName: string;
    rooms: FloorPlanRoom[];
  }[];
  optimizations: string[];
  estimatedConstructionCost: string;
}

interface ElevationData {
  style: string;
  imageUrl: string;
  title: string;
  materials: string[];
  keyFeatures: string;
  variants?: ElevationData[];
}

interface ColorRecommendation {
  name: string;
  hex: string;
  role: string;
  description: string;
}

interface ColorData {
  themeName: string;
  colors: ColorRecommendation[];
  lightingAdvice: string;
}

interface SavedProject {
  id: string;
  title: string;
  type: string;
  data: any;
  previewUrl?: string;
  createdAt: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const ELEVA_IMAGES: Record<string, string[]> = {
  modern: [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=1200&q=80"
  ],
  luxury: [
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=80"
  ],
  minimalist: [
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80"
  ],
  traditional: [
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80"
  ]
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("landing");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Projects State
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(false);

  // API URL
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://capstone-o45b.onrender.com/api/v1";

  // Alert/Notification State
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch Projects List
  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await fetch(`${API_BASE}/projects/list`);
      if (res.ok) {
        const payload = await res.json();
        setProjects(payload.projects || []);
      }
    } catch (e) {
      console.error("Error fetching projects:", e);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchProjects();
    }
  }, [activeTab]);

  // Save Project Handler
  const handleSaveProject = async (title: string, type: string, data: any, previewUrl?: string) => {
    try {
      const res = await fetch(`${API_BASE}/projects/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type, data, previewUrl })
      });
      if (res.ok) {
        showToast(`Saved "${title}" to your dashboard!`, "success");
        fetchProjects();
      } else {
        showToast("Failed to save project. Try again.", "error");
      }
    } catch (e) {
      showToast("Backend connection failed. Saved in-memory locally.", "info");
      // Fallback local save in state for direct simulation in browser if offline
      const mockProject: SavedProject = {
        id: Math.random().toString(),
        title,
        type,
        data,
        previewUrl,
        createdAt: new Date().toISOString()
      };
      setProjects((prev) => [mockProject, ...prev]);
    }
  };

  // Delete Project Handler
  const handleDeleteProject = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/projects/delete/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Project deleted successfully.", "success");
        setProjects((prev) => prev.filter((p) => p.id !== id));
      } else {
        showToast("Could not delete project.", "error");
      }
    } catch (e) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      showToast("Project removed from offline session.", "success");
    }
  };

  // --- Sub-Components per Active Workspace Tab ---

  // 1. Floor Plan Generator Panel
  const FloorPlanPanel = () => {
    const [dimensions, setDimensions] = useState("40' x 60'");
    const [rooms, setRooms] = useState(3);
    const [floors, setFloors] = useState(1);
    const [style, setStyle] = useState("Modern");
    const [budget, setBudget] = useState(25000000);
    const [includePenthouse, setIncludePenthouse] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState<FloorPlanData | null>(null);

    const parsePlotDimensions = () => {
      const matches = dimensions.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
      const width = matches[0] || 40;
      const depth = matches[1] || 60;
      return { width, depth };
    };

    const roomBlueprints: Record<string, Omit<FloorPlanRoom, "name">> = {
      living: { dimensions: "18' x 20'", position: "North-East frontage", description: "Formal living zone with wide windows, TV wall, and direct foyer access." },
      dining: { dimensions: "12' x 14'", position: "Center-East", description: "Family dining area placed between the living room and kitchen for easy circulation." },
      kitchen: { dimensions: "12' x 14'", position: "South-East", description: "Modular kitchen with counter triangle planning, pantry niche, and utility ventilation." },
      parking: { dimensions: "12' x 18'", position: "North-West setback", description: "Covered car parking with portico access and a clear turning bay." },
      bedroom: { dimensions: "12' x 14'", position: "South-West", description: "Bedroom planned with wardrobe wall, window ventilation, and attached bath access." },
      master: { dimensions: "16' x 18'", position: "South-West private zone", description: "Master suite with king bed wall, wardrobe bay, and attached toilet provision." },
      balcony: { dimensions: "6' x 14'", position: "East / South-East edge", description: "Outdoor balcony deck with railing line and shaded sitting space." },
      study: { dimensions: "10' x 12'", position: "North-East quiet corner", description: "Compact study room with daylight-facing desk placement and storage wall." },
      pooja: { dimensions: "6' x 8'", position: "East facing", description: "Dedicated pooja room with calm entry, raised platform, and timber screen partition." },
      terrace: { dimensions: "18' x 24'", position: "Open roof / upper frontage", description: "Terrace garden with planter strip, seating deck, and pergola-ready corner." },
      staircase: { dimensions: "8' x 14'", position: "Central spine", description: "Staircase and landing positioned to connect floors without wasting room frontage." },
      utility: { dimensions: "6' x 8'", position: "West service side", description: "Utility and laundry space with plumbing wall and exhaust opening." },
      foyer: { dimensions: "8' x 10'", position: "North entry", description: "Entry foyer that buffers the living room from the main door." },
      bath: { dimensions: "5' x 8'", position: "Service core", description: "Toilet block aligned with plumbing walls for efficient construction." }
    };

    const blueprintForRoom = (name: string, floorIndex: number): FloorPlanRoom => {
      const cleanName = name.trim().replace(/\s+/g, " ");
      const key = Object.keys(roomBlueprints)
        .sort((a, b) => b.length - a.length)
        .find((candidate) => cleanName.toLowerCase().includes(candidate));
      const template = key ? roomBlueprints[key] : {
        dimensions: floorIndex === 0 ? "10' x 12'" : "11' x 13'",
        position: floorIndex === 0 ? "Functional ground-floor zone" : "Private upper-floor zone",
        description: "Individually planned room with furniture clearance, window placement, and circulation space."
      };

      return {
        name: cleanName || "Flexible Room",
        dimensions: template.dimensions,
        position: template.position,
        description: template.description
      };
    };

    const roomsFromText = (text: string, floorIndex: number): FloorPlanRoom[] => {
      const cleaned = text.replace(/Generated zoning layout/gi, "").trim();
      const names = cleaned
        .split(/,|;| and |\n/i)
        .map((item) => item.trim())
        .filter(Boolean);

      return names.map((name) => blueprintForRoom(name, floorIndex));
    };

    const defaultRoomsForFloor = (floorIndex: number): FloorPlanRoom[] => {
      if (floorIndex === 0) {
        return [
          blueprintForRoom("Foyer", floorIndex),
          blueprintForRoom("Living Room", floorIndex),
          blueprintForRoom("Dining Area", floorIndex),
          blueprintForRoom("Kitchen", floorIndex),
          blueprintForRoom("Parking Area", floorIndex),
          blueprintForRoom("Pooja Room", floorIndex),
          blueprintForRoom("Staircase", floorIndex)
        ].slice(0, Math.max(rooms + 3, 5));
      }

      return [
        blueprintForRoom("Master Bedroom", floorIndex),
        blueprintForRoom("Bedroom 2", floorIndex),
        blueprintForRoom("Study Room", floorIndex),
        blueprintForRoom("Balcony", floorIndex),
        blueprintForRoom("Utility Room", floorIndex)
      ].slice(0, Math.max(rooms + 1, 4));
    };

    const normalizeRoom = (room: any, floorIndex: number): FloorPlanRoom[] => {
      if (typeof room === "string") {
        return [blueprintForRoom(room, floorIndex)];
      }

      const details = [room?.details, room?.description].filter(Boolean).join(", ");
      const isFloorSummary = room?.position === "Generated zoning layout" || room?.name === room?.floor || room?.name === room?.floorName;
      if (isFloorSummary && details) {
        const expanded = roomsFromText(details, floorIndex);
        if (expanded.length > 0) return expanded;
      }

      const generated = blueprintForRoom(room?.name || "Flexible Room", floorIndex);
      return [{
        name: room?.name || generated.name,
        dimensions: room?.dimensions || generated.dimensions,
        position: room?.position && room.position !== "Generated zoning layout" ? room.position : generated.position,
        description: room?.description || room?.details || generated.description
      }];
    };

    const normalizeFloorPlanData = (data: any): FloorPlanData => {
      const floorCount = Number(data?.floors?.length || data?.layout?.length || floors || 1);
      const roomNames = Array.isArray(data?.rooms) ? data.rooms : [];
      const normalizedFloors = Array.isArray(data?.floors)
        ? data.floors.map((floor: any, idx: number) => {
          const sourceRooms = Array.isArray(floor?.rooms) ? floor.rooms : roomsFromText(floor?.details || floor?.description || "", idx);
          const expandedRooms = sourceRooms.flatMap((room: any) => normalizeRoom(room, idx));
          return {
            floorName: floor?.floor || floor?.floorName || (idx === 0 ? "Ground Floor" : idx === 1 ? "First Floor" : `Floor ${idx + 1}`),
            rooms: expandedRooms.length > 0 ? expandedRooms : defaultRoomsForFloor(idx)
          };
        })
        : (Array.isArray(data?.layout) ? data.layout : []).map((floor: any, idx: number) => ({
          floorName: floor?.floor || floor?.floorName || `Floor ${idx + 1}`,
          rooms: roomsFromText(floor?.details || roomNames.join(", "), idx)
        }));

      const { width, depth } = parsePlotDimensions();
      const plotArea = Math.round(width * depth);

      return {
        layoutName: data?.layoutName || data?.title || `${style} ${rooms}-Room Floor Plan`,
        totalAreaSqFt: Number(data?.totalAreaSqFt || plotArea * floorCount),
        floors: normalizedFloors.length > 0 ? normalizedFloors : Array.from({ length: floorCount }, (_, idx) => ({
          floorName: idx === 0 ? "Ground Floor" : `Floor ${idx + 1}`,
          rooms: roomNames.length > 0 ? roomNames.map((room: string) => blueprintForRoom(room, idx)) : defaultRoomsForFloor(idx)
        })),
        optimizations: data?.optimizations || data?.features || [
          data?.description || "AI generated smart floor plan with ventilation and natural lighting."
        ],
        estimatedConstructionCost: data?.estimatedConstructionCost || data?.estimated_cost || "Cost estimate unavailable"
      };
    };

    const handleGenerate = async () => {
      setGenerating(true);
      setResult(null);
      try {
        const res = await fetch(`${API_BASE}/floorplan/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            dimensions,
            rooms,
            floors,
            style,
            budget,
            include_penthouse: includePenthouse
          })
        });
        if (res.ok) {
          const body = await res.json();
          setResult(normalizeFloorPlanData(body.data));
        } else {
          showToast("Generation timed out. Using high-fidelity layout engine.", "info");
          // Generate local model
          throw new Error("API Offline");
        }
      } catch (e) {
        // High fidelity procedural fallback layout
        setTimeout(() => {
          setResult(normalizeFloorPlanData({
            layoutName: `The Eco-${style} ${rooms}-Room Mansion`,
            totalAreaSqFt: parsePlotDimensions().width * parsePlotDimensions().depth * floors,
            floors: Array.from({ length: floors }, (_, i) => ({
              floorName: i === 0 ? "Ground Floor" : i === 1 ? "First Floor" : `Floor ${i + 1}`,
              rooms: i === 0
                ? [
                  { name: "Foyer", dimensions: "8' x 10'", position: "North entry", description: "Defined entry lobby with shoe storage and visual privacy from the living room." },
                  { name: "Living Room", dimensions: "18' x 20'", position: "North-East frontage", description: "Main family lounge with wide glazing and direct connection to dining." },
                  { name: "Dining Area", dimensions: "12' x 14'", position: "Center-East", description: "Six-seat dining space placed between living and kitchen." },
                  { name: "Kitchen", dimensions: "12' x 14'", position: "South-East", description: "Modular kitchen with dry pantry and utility exhaust." },
                  { name: "Parking Area", dimensions: "12' x 18'", position: "North-West setback", description: "Covered parking bay connected to the portico." },
                  { name: "Pooja Room", dimensions: "6' x 8'", position: "East facing", description: "Quiet prayer room with raised platform and wooden screen." },
                  { name: "Staircase", dimensions: "8' x 14'", position: "Central spine", description: "Internal staircase with landing and under-stair storage." }
                ]
                : [
                  { name: "Master Bedroom", dimensions: "16' x 18'", position: "South-West private zone", description: "Primary bedroom with wardrobe wall and attached toilet provision." },
                  { name: "Bedroom 2", dimensions: "12' x 14'", position: "North-West", description: "Secondary bedroom with study nook and cross ventilation." },
                  { name: "Study Room", dimensions: "10' x 12'", position: "North-East quiet corner", description: "Dedicated work room with daylight-facing desk wall." },
                  { name: "Balcony", dimensions: "6' x 14'", position: "East edge", description: "Outdoor sitting balcony with glass railing and planter strip." },
                  { name: "Utility Room", dimensions: "6' x 8'", position: "West service side", description: "Laundry and storage room aligned with plumbing shafts." }
                ]
            })),
            optimizations: [
              "Designed passive air tunnels from the South-West wind vectors.",
              "Double insulated clay brick framework to buffer solar radiation.",
              "Central skylight dome channeling morning daylight down both floors."
            ],
            estimatedConstructionCost: `${formatCurrency(budget * 0.9)} - ${formatCurrency(budget * 1.1)}`
          }));
        }, 1500);
      } finally {
        setTimeout(() => setGenerating(false), 1500);
      }
    };

    return (
      <>
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-display tracking-tight text-white">AI Floor Plan Generator</h1>
              <p className="text-gray-400 mt-1">Specify plot details to draft a passive-design layout schematic.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Controls Left */}
            <div className="lg:col-span-4 space-y-6 glass-panel p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent-amber/5 rounded-full blur-3xl" />

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300">Plot Footprint / Dimensions</label>
                <input
                  type="text"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input"
                  placeholder="e.g. 30' x 50' or 150 sqm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">Total Rooms</label>
                  <select
                    value={rooms}
                    onChange={(e) => setRooms(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl glass-input"
                  >
                    {[2, 3, 4, 5, 6].map(n => <option key={n} value={n} className="bg-[#11121a]">{n} Rooms</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">Floors / Stories</label>
                  <select
                    value={floors}
                    onChange={(e) => setFloors(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl glass-input"
                  >
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n} className="bg-[#11121a]">{n} Story</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300">Aesthetic Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Modern", "Minimalist", "Luxury", "Traditional"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStyle(s)}
                      className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all duration-300 ${style === s
                        ? "bg-accent-amber/10 border-accent-amber text-accent-amber shadow-sm"
                        : "border-transparent bg-white/5 text-gray-400 hover:text-white"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold text-gray-300">
                  <span>Maximum Budget Limit</span>
                  <span className="text-accent-amber font-mono">{formatCurrency(budget)}</span>
                </div>
                <input
                  type="range"
                  min={2500000}
                  max={100000000}
                  step={500000}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                />
                {/* Penthouse Toggle */}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-semibold text-gray-300">Include Penthouse</span>
                  <label className="inline-flex relative items-center cursor-pointer">
                    <input type="checkbox" checked={includePenthouse} onChange={(e) => setIncludePenthouse(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-checked:bg-accent-amber rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all" />
                  </label>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-accent-amber to-accent-violet text-white shadow-lg hover:shadow-accent-amber/20 hover:scale-[1.01] transition-all disabled:opacity-50"
              >
                {generating ? "Simulating Layout Vector..." : "Generate Floor Plan Layout"}
              </button>
            </div>

            {/* Results Output Right */}
            <div className="lg:col-span-8 glass-panel p-8 rounded-3xl min-h-[450px] flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent-violet/5 rounded-full blur-3xl" />

              <AnimatePresence mode="wait">
                {generating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center space-y-6 py-12"
                  >
                    <div className="relative w-24 h-24">
                      <div className="absolute inset-0 border-4 border-dashed border-accent-amber/20 rounded-full animate-spin" style={{ animationDuration: '6s' }} />
                      <div className="absolute inset-2 border-4 border-t-accent-violet border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" style={{ animationDuration: '1.5s' }} />
                      <div className="absolute inset-4 border border-dashed border-white/10 rounded-full animate-pulse" />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-bold text-white">Generating Space Architecture</h3>
                      <p className="text-gray-400 text-sm max-w-sm">Calculating zoning distribution, sun orientation pathing, and active cross-ventilation layout mapping...</p>
                    </div>
                  </motion.div>
                )}

                {!generating && !result && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <svg className="w-8 h-8 text-accent-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-gray-300">Layout Canvas Ready</h3>
                      <p className="text-gray-400 max-w-sm text-sm">Configure your specifications on the left panel to trigger generative blueprint structures.</p>
                    </div>
                  </div>
                )}

                {!generating && result && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 flex-1"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">{result.layoutName}</h2>
                        <span className="text-xs bg-accent-amber/10 border border-accent-amber/30 text-accent-amber px-2.5 py-1 rounded-full font-medium mt-1 inline-block">Total Area: {result.totalAreaSqFt} Sq Ft</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveProject(result.layoutName, "floorplan", result)}
                          className="px-4 py-2 text-xs font-semibold rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5"
                        >
                          <svg className="w-4 h-4 text-accent-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                          Save Blueprint
                        </button>
                        <button
                          onClick={handleGenerate}
                          className="px-4 py-2 text-xs font-semibold rounded-lg bg-accent-amber/10 border border-accent-amber/30 text-accent-amber hover:bg-accent-amber/20 transition-all"
                        >
                          Regenerate
                        </button>
                      </div>
                    </div>

                    {/* Floor Arrangement Details */}
                    <div className="space-y-4">
                      {result.floors?.map((fl, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3">
                          <h4 className="text-sm font-bold text-accent-amber flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-accent-amber rounded-full" />
                            {fl.floorName}
                          </h4>
                          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {fl.rooms.map((room) => (
                                <div key={`${fl.floorName}-${room.name}`} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <h5 className="text-sm font-semibold text-white">{room.name}</h5>
                                    <span className="text-[10px] font-mono text-accent-amber">{room.dimensions}</span>
                                  </div>
                                  <p className="mt-1 text-[11px] text-gray-400">{room.position}</p>
                                  <p className="mt-2 text-xs text-gray-300 leading-relaxed">{room.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Optimizations & Advice */}
                    <ul className="list-disc list-inside space-y-2">
                      {result.optimizations?.map((opt, oIdx) => (
                        <li key={oIdx} className="flex items-start gap-2">
                          <span className="text-accent-amber mt-0.5">•</span>
                          <span>{opt}</span>
                        </li>
                      ))}
                    </ul>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </>
    );
  };

  // 2. Elevation & Exterior Renders Panel
  const ElevationPanel = () => {
    const [style, setStyle] = useState("Modern");
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState<ElevationData | null>(null);
    const renderCountRef = useRef(0);

    const cacheBustImage = (url: string, seed: number) => {
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}render=${seed}`;
    };

    const buildElevationVariants = (selectedStyle: string, seed: number): ElevationData[] => {
      const styleKey = selectedStyle.toLowerCase();
      const images = ELEVA_IMAGES[styleKey] || ELEVA_IMAGES.modern;
      const start = seed % images.length;
      return [0, 1, 2].map((offset) => {
        const variantNo = offset + 1;
        const imageUrl = cacheBustImage(images[(start + offset) % images.length], seed + offset);
        return {
          style: selectedStyle,
          imageUrl,
          title: `${selectedStyle} Exterior Render ${variantNo}`,
          materials: offset === 0
            ? ["Premium facade cladding", "Low-E structural glazing", "Concealed linear lighting"]
            : offset === 1
              ? ["Textured stone panels", "Powder-coated metal frames", "Landscape wall washers"]
              : ["Warm wood louvers", "Concrete feature planes", "Balcony glass railings"],
          keyFeatures: `Fresh ${selectedStyle.toLowerCase()} facade option ${variantNo} with varied massing, landscaping, and lighting composition.`
        };
      });
    };

    const normalizeElevationData = (data: any): ElevationData => {
      const fallbackVariants = buildElevationVariants(style, Date.now());
      const fallbackImage = fallbackVariants[0].imageUrl;
      const variants = Array.isArray(data?.variants)
        ? data.variants.map((variant: any, idx: number) => ({
          style: data?.style || style,
          imageUrl: variant?.imageUrl || fallbackImage,
          title: variant?.title || `${style} Exterior Render ${idx + 1}`,
          materials: Array.isArray(variant?.materials) ? variant.materials : [],
          keyFeatures: variant?.keyFeatures || "Exterior facade concept with premium materials and landscape detailing."
        }))
        : [];

      const primary = variants[0] || data || {};

      return {
        style: primary?.style || data?.style || style,
        imageUrl: primary?.imageUrl || data?.imageUrl || fallbackImage,
        title: primary?.title || data?.title || `${style} Exterior Design`,
        materials: Array.isArray(primary?.materials) && primary.materials.length > 0
          ? primary.materials
          : Array.isArray(data?.materials) ? data.materials : ["Structural glazing", "Premium facade cladding", "Exterior landscape lighting"],
        keyFeatures: primary?.keyFeatures || data?.keyFeatures || "Photorealistic exterior facade concept with balanced massing, premium finishes, and front landscape composition.",
        variants: variants.length > 0 ? variants : fallbackVariants
      };
    };

    const handleGenerate = async () => {
      setGenerating(true);
      setResult(null);
      try {
        const res = await fetch(`${API_BASE}/elevation/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ style })
        });
        if (res.ok) {
          const body = await res.json();
          setResult(normalizeElevationData(body.data));
        } else {
          throw new Error("API Offline");
        }
      } catch (e) {
        setTimeout(() => {
          renderCountRef.current += 1;
          const seed = Date.now() + renderCountRef.current;
          const variants = buildElevationVariants(style, seed);
          setResult({ ...variants[0], variants });
        }, 1500);
      } finally {
        setTimeout(() => setGenerating(false), 1500);
      }
    };

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-white">AI Elevation & Exterior Generator</h1>
          <p className="text-gray-400 mt-1">Render realistic, high-fidelity facades with material specifications.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Left */}
          <div className="lg:col-span-4 space-y-6 glass-panel p-6 rounded-2xl relative overflow-hidden">
            <div className="space-y-4">
              <label className="text-sm font-semibold text-gray-300">Exterior Architecture Style</label>
              <div className="space-y-2">
                {[
                  { name: "Modern", desc: "Cantilevers, structural glass & wood screens" },
                  { name: "Luxury", desc: "Tiered patios, marble facades & water details" },
                  { name: "Minimalist", desc: "Zen forms, white plaster & zero-trim lines" },
                  { name: "Traditional", desc: "Stone chimneys, gables & copper window detailing" }
                ].map((s) => (
                  <button
                    key={s.name}
                    onClick={() => setStyle(s.name)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${style === s.name
                      ? "bg-accent-amber/10 border-accent-amber text-white shadow-sm"
                      : "border-white/5 bg-white/5 text-gray-400 hover:text-white"
                      }`}
                  >
                    <div className="font-semibold text-sm">{s.name}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-accent-amber to-accent-violet text-white shadow-lg hover:shadow-accent-amber/20 hover:scale-[1.01] transition-all disabled:opacity-50"
            >
              {generating ? "Rendering Exterior Layout..." : "Render Exterior Facade"}
            </button>
          </div>

          {/* Results Output Right */}
          <div className="lg:col-span-8 glass-panel p-8 rounded-3xl min-h-[500px] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-violet/5 rounded-full blur-3xl" />

            <AnimatePresence mode="wait">
              {generating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center space-y-6 py-12"
                >
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-4 border-dashed border-accent-amber/20 rounded-full animate-spin" style={{ animationDuration: '6s' }} />
                    <div className="absolute inset-2 border-4 border-t-accent-violet border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" style={{ animationDuration: '1.5s' }} />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-bold text-white">Synthesizing Architectural Render</h3>
                    <p className="text-gray-400 text-sm max-w-sm">Generating diffuse lighting, exterior shadows, realistic foliage maps, and material bump parameters...</p>
                  </div>
                </motion.div>
              )}

              {!generating && !result && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-accent-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-gray-300">Rendering Frame Ready</h3>
                    <p className="text-gray-400 max-w-sm text-sm">Select an architectural style on the left and trigger rendering to view visual mockups.</p>
                  </div>
                </div>
              )}

              {!generating && result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6 flex-1"
                >
                  <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-white/10 group shadow-2xl">
                    <img
                      src={result.imageUrl}
                      alt={result.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex flex-col justify-end p-6">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-accent-amber bg-accent-amber/20 border border-accent-amber/40 px-2 py-0.5 rounded self-start mb-2">
                        {result.style} Exterior Design
                      </span>
                      <h3 className="text-xl font-bold text-white tracking-tight">{result.title}</h3>
                    </div>
                  </div>

                  {result.variants && result.variants.length > 1 && (
                    <div className="grid grid-cols-3 gap-3">
                      {result.variants.map((variant, idx) => (
                        <button
                          key={`${variant.title}-${idx}`}
                          onClick={() => setResult({ ...variant, variants: result.variants })}
                          className={`relative aspect-[4/3] overflow-hidden rounded-xl border text-left transition-all ${variant.imageUrl === result.imageUrl
                            ? "border-accent-amber shadow-lg shadow-accent-amber/10"
                            : "border-white/10 hover:border-white/30"
                            }`}
                        >
                          <img src={variant.imageUrl} alt={variant.title} className="h-full w-full object-cover" />
                          <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-1 text-[10px] font-semibold text-white">
                            View {idx + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Materials & Spec Sheet */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-accent-amber">Material Specifications</h4>
                      <ul className="text-xs text-gray-400 space-y-1">
                        {result.materials?.map((m, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-amber" />
                            {m}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-accent-violet/5 border border-accent-violet/20 p-5 rounded-2xl space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-accent-violet">Key Features</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">{result.keyFeatures}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                      onClick={() => handleSaveProject(result.title, "elevation", result, result.imageUrl)}
                      className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-accent-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                      Save Exterior Render
                    </button>
                    <a
                      href={result.imageUrl}
                      download={`elevation-${result.style.toLowerCase()}.jpg`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-accent-amber/15 border border-accent-amber/30 text-accent-amber hover:bg-accent-amber/20 transition-all flex items-center gap-2"
                    >
                      Download Frame
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  };

  // 3. Color Recommendation Panel
  const ColorsPanel = () => {
    const [theme, setTheme] = useState("Warm Neutrals");
    const [roomType, setRoomType] = useState("Living Room");
    const [lighting, setLighting] = useState("Natural Daylight");
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState<ColorData | null>(null);

    const handleGenerate = async () => {
      setGenerating(true);
      setResult(null);
      try {
        const res = await fetch(`${API_BASE}/colors/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme, room_type: roomType, lighting })
        });
        if (res.ok) {
          const body = await res.json();
          setResult(body.data);
        } else {
          throw new Error("API Offline");
        }
      } catch (e) {
        setTimeout(() => {
          setResult({
            themeName: `${theme} for your ${roomType}`,
            colors: [
              { name: "Sandalwood Cream", hex: "#EBE3D5", role: "Primary Wall", description: "Soft, organic sand tones that maximize room width visual profiles." },
              { name: "Raw Brass Slate", hex: "#7E7C73", role: "Cabinetry Accent", description: "Brings modern luxury highlighting to panel moldings." },
              { name: "Burnt Copper Hue", hex: "#C08261", role: "Focal Decor Accent", description: "Understated cozy terracotta warm feel." }
            ],
            lightingAdvice: `Under ${lighting}, avoid glossy paints as they cause reflection issues. Utilize flat or eggshell coats.`
          });
        }, 1200);
      } finally {
        setTimeout(() => setGenerating(false), 1200);
      }
    };

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-white">Color Recommendation System</h1>
          <p className="text-gray-400 mt-1">Explore custom lighting-compatible color palette schemes for spaces.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Left */}
          <div className="lg:col-span-4 space-y-6 glass-panel p-6 rounded-2xl relative overflow-hidden">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Space / Room Type</label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input"
              >
                {["Living Room", "Master Bedroom", "Kitchen & Dining", "Design Studio", "Exterior Facade"].map(r => (
                  <option key={r} value={r} className="bg-[#11121a]">{r}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Lighting setup</label>
              <select
                value={lighting}
                onChange={(e) => setLighting(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input"
              >
                {["Natural Daylight", "Warm Dim Ambient LED", "Cool High-Lumen Spots", "Recessed Cove Arrays"].map(l => (
                  <option key={l} value={l} className="bg-[#11121a]">{l}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Theme Theme</label>
              <div className="grid grid-cols-2 gap-2">
                {["Warm Neutrals", "Cool Greens", "Vibrant Accents", "Industrial Charcoal"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all duration-300 ${theme === t
                      ? "bg-accent-amber/10 border-accent-amber text-accent-amber shadow-sm"
                      : "border-transparent bg-white/5 text-gray-400 hover:text-white"
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-accent-amber to-accent-violet text-white shadow-lg hover:shadow-accent-amber/20 hover:scale-[1.01] transition-all disabled:opacity-50"
            >
              {generating ? "Mapping Color Palette..." : "Generate Palette recommendations"}
            </button>
          </div>

          {/* Results Output Right */}
          <div className="lg:col-span-8 glass-panel p-8 rounded-3xl min-h-[450px] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-violet/5 rounded-full blur-3xl" />

            <AnimatePresence mode="wait">
              {generating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center space-y-6 py-12"
                >
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-4 border-dashed border-accent-amber/20 rounded-full animate-spin" style={{ animationDuration: '6s' }} />
                    <div className="absolute inset-2 border-4 border-t-accent-violet border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" style={{ animationDuration: '1.5s' }} />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-bold text-white">Synthesizing Palette Vectors</h3>
                    <p className="text-gray-400 text-sm max-w-sm">Executing color matching formulas, checking reflection values, and balancing base and accent hues...</p>
                  </div>
                </motion.div>
              )}

              {!generating && !result && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-accent-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-gray-300">Palette Drawer Ready</h3>
                    <p className="text-gray-400 max-w-sm text-sm">Designate room details on the control pane to compute light-compatible palettes.</p>
                  </div>
                </div>
              )}

              {!generating && result && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 flex-1"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">{result.themeName}</h2>
                      <span className="text-xs bg-accent-amber/10 border border-accent-amber/30 text-accent-amber px-2.5 py-1 rounded-full font-medium mt-1 inline-block">
                        Active Light: {lighting}
                      </span>
                    </div>
                    <button
                      onClick={() => handleSaveProject(result.themeName, "color", result)}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4 text-accent-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                      Save Palette
                    </button>
                  </div>

                  {/* Swatch Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {result.colors.map((c, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col group shadow-lg">
                        <div
                          className="h-28 w-full transition-transform duration-500 group-hover:scale-[1.02] relative flex items-end justify-end p-3"
                          style={{ backgroundColor: c.hex }}
                        >
                          <span
                            onClick={() => {
                              navigator.clipboard.writeText(c.hex);
                              showToast(`Copied ${c.hex}!`, "success");
                            }}
                            className="bg-black/40 hover:bg-black/60 cursor-pointer backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-mono"
                          >
                            Copy HEX
                          </span>
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                          <div>
                            <div className="flex justify-between items-center">
                              <h5 className="font-semibold text-white text-sm">{c.name}</h5>
                              <span className="text-[10px] text-accent-amber font-mono font-bold">{c.hex}</span>
                            </div>
                            <span className="text-[10px] text-accent-violet block mt-0.5 font-medium">{c.role}</span>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed">{c.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Lighting Advice Card */}
                  <div className="bg-accent-violet/5 border border-accent-violet/20 p-5 rounded-2xl space-y-2 mt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-accent-violet">Lighting Interaction Rule</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">{result.lightingAdvice}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  };

  // 5. Conversational Architect Chat Panel
  const ChatPanel = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
      { role: "assistant", content: "Welcome to ArchGen AI Studio! I am your lead architect. Ask me about lighting optimizations, airflow improvements, high-end materials, or exterior designs." }
    ]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (textToSend: string) => {
      if (!textToSend.trim() || sending) return;

      const userMsg: ChatMessage = { role: "user", content: textToSend };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setSending(true);

      try {
        const res = await fetch(`${API_BASE}/chat/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: textToSend,
            history: messages.map(m => ({ role: m.role, content: m.content }))
          })
        });
        if (res.ok) {
          const body = await res.json();
          setMessages((prev) => [...prev, { role: "assistant", content: body.response }]);
        } else {
          throw new Error();
        }
      } catch (e) {
        // High fidelity procedural fallback based on keywords
        setTimeout(() => {
          const query = textToSend.toLowerCase();
          let ans = `For "${textToSend}", I would first resolve circulation, daylight, privacy, and services before selecting finishes. Keep the plan simple: clear entry, clean movement paths, and rooms grouped by noise and privacy level.`;
          if (query.includes("ventilation") || query.includes("airflow")) {
            ans = "**High-End Ventilation & Airflow Strategy:**\n\n1. **Orient Openings to Wind Vectors**: Place windows facing the seasonal breeze.\n2. **Incorporate Skylights / Atriums**: Encourages warm air rising out via natural draft effects.\n3. **Use Louvers**: Provide privacy while maintaining continuous air movements.";
          } else if (query.includes("exterior") || query.includes("modern")) {
            ans = "**Modern Facade Suggestions:**\n\n1. **Use Composite Siding**: Cedar wood battens paired with microcement panels.\n2. **Exposed Slender Columns**: Minimizes base visual loads.\n3. **Clerestory Strip Glazing**: Illuminates high ceilings softly.";
          } else if (query.includes("color") || query.includes("paint") || query.includes("palette")) {
            ans = "**Color Direction:**\n\n1. Use soft warm neutrals for the main walls to make the room feel larger.\n2. Add one deeper accent wall behind the TV, bed, or sofa.\n3. Repeat the accent through cushions, artwork, or cabinet handles so the palette feels intentional.";
          } else if (query.includes("cost") || query.includes("budget") || query.includes("estimate")) {
            ans = "**Budget Planning:**\n\n1. Split costs into structure, services, finishes, and furniture.\n2. Prioritize waterproofing, wiring, plumbing shafts, and windows before decorative upgrades.\n3. Keep 10-15% contingency for site changes and material price movement.";
          } else if (query.includes("glass") || query.includes("material") || query.includes("wood") || query.includes("stone")) {
            ans = "**Material Recommendation:**\n\n1. Pair one warm material like teak or oak with one calm stone or concrete surface.\n2. Use low-E glass on large openings to reduce heat gain while preserving daylight.\n3. Keep metal accents limited to trims, fixtures, and handles for a premium finish.";
          } else if (query.includes("small") || query.includes("room") || query.includes("space")) {
            ans = "**Small Space Layout:**\n\n1. Use one full-height storage wall instead of scattered cupboards.\n2. Keep walking paths clear and avoid oversized loose furniture.\n3. Use pale ceilings, mirrors, and furniture with visible legs to reduce visual weight.";
          }
          setMessages((prev) => [...prev, { role: "assistant", content: ans }]);
        }, 1000);
      } finally {
        setSending(false);
      }
    };

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-white">Conversational AI Architect</h1>
          <p className="text-gray-400 mt-1">Discuss layout rules, construction costs, materials, or style concepts.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[600px]">
          {/* Preset Prompts Sidebar */}
          <div className="lg:col-span-4 space-y-4 glass-panel p-6 rounded-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-accent-amber">Quick Architectural Questions</h4>
              <div className="space-y-2">
                {[
                  "How can I improve ventilation?",
                  "Suggest luxury exterior ideas.",
                  "Best colors for small living room.",
                  "What is low-E glass benefit?"
                ].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="w-full text-left p-3.5 rounded-xl border border-white/5 bg-white/5 text-xs text-gray-400 hover:text-white hover:border-accent-amber/30 transition-all leading-relaxed"
                  >
                    “{q}”
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-accent-violet/5 border border-accent-violet/20 p-4 rounded-xl text-[10px] text-gray-400 leading-relaxed">
              <strong>Architect Pro Tip:</strong> Provide details such as ceiling height, climate region, or budget window limits to tailor building suggestions.
            </div>
          </div>

          {/* Chat Interface Right */}
          <div className="lg:col-span-8 glass-panel rounded-3xl flex flex-col justify-between overflow-hidden">
            {/* Messages Drawer */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-lg ${m.role === "user"
                    ? "bg-gradient-to-r from-accent-amber to-accent-amber/90 text-white font-medium rounded-tr-none"
                    : "bg-white/5 border border-white/10 text-gray-300 rounded-tl-none"
                    }`}>
                    {/* Markdown rendering simulation (simple lines replacement) */}
                    <div className="whitespace-pre-line space-y-2">
                      {m.content}
                    </div>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-4 text-xs text-gray-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent-amber rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-accent-amber rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-accent-amber rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    AI Architect is detailing layout...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
              className="p-4 border-t border-white/10 bg-[#11121a]/85 backdrop-blur-md flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask our AI architect details about materials, layouts..."
                className="flex-1 px-4 py-3 rounded-xl glass-input text-sm"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="px-6 rounded-xl font-bold bg-accent-amber text-white hover:scale-[1.01] hover:shadow-lg transition-all disabled:opacity-50 text-sm"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // 6. Saved Projects Dashboard Panel
  const DashboardPanel = () => {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-white">Saved Projects Dashboard</h1>
          <p className="text-gray-400 mt-1">Review, refine, and download your previously generated floor plans, exterior renders, and color palettes.</p>
        </div>

        {loadingProjects ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-2 border-accent-amber border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading saved blueprints...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl text-center space-y-4 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-accent-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white">No saved designs yet</h3>
              <p className="text-gray-400 max-w-sm text-sm">Generate designs using the layout planner, exterior render, or color palette tools, and click "Save Project" to list them here.</p>
            </div>
            <button
              onClick={() => setActiveTab("floorplan")}
              className="mt-2 px-5 py-2.5 rounded-xl font-bold bg-accent-amber text-white text-xs hover:scale-[1.01] transition-all"
            >
              Start Generating
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <div key={proj.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg relative group">
                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-accent-violet bg-accent-violet/10 border border-accent-violet/30 px-2 py-0.5 rounded">
                      {proj.type}
                    </span>
                    <button
                      onClick={() => handleDeleteProject(proj.id)}
                      className="text-gray-500 hover:text-accent-rose transition-colors"
                      title="Delete Project"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>

                  <div>
                    <h4 className="font-bold text-white tracking-tight">{proj.title}</h4>
                    <p className="text-[10px] text-gray-500">{new Date(proj.createdAt).toLocaleDateString()} {new Date(proj.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>

                  {proj.previewUrl && (
                    <div className="aspect-[16/9] w-full rounded-xl overflow-hidden border border-white/5">
                      <img src={proj.previewUrl} alt={proj.title} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {proj.type === "floorplan" && (
                    <div className="text-[10px] text-gray-400 space-y-1 bg-white/[0.02] p-3 rounded-lg border border-white/5">
                      <div className="font-semibold text-accent-amber">Room Configurations:</div>
                      <div>Estimated Cost: {proj.data.estimatedConstructionCost || proj.data.estimated_cost || "Cost estimate unavailable"}</div>
                      <div>Floors: {proj.data.floors?.length || proj.data.layout?.length || 1} Level(s)</div>
                    </div>
                  )}

                  {proj.type === "color" && (
                    <div className="grid grid-cols-3 gap-2">
                      {proj.data.colors?.map((col: any, idx: number) => (
                        <div key={idx} className="flex flex-col items-center">
                          <div className="w-full h-6 rounded border border-white/10" style={{ backgroundColor: col.hex }} />
                          <span className="text-[8px] font-mono text-gray-400 mt-1">{col.hex}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-white/[0.02] border-t border-white/5 flex gap-2">
                  <button
                    onClick={() => {
                      // Simulating viewing data details
                      showToast(`Project detail for "${proj.title}" loaded successfully.`, "success");
                    }}
                    className="flex-1 py-2 rounded-lg text-[10px] font-bold border border-white/10 hover:bg-white/5 text-gray-300 text-center"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col relative">

      {/* Toast Alert */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl border text-xs font-semibold shadow-2xl flex items-center gap-2.5 ${notification.type === "success"
              ? "bg-accent-emerald/10 border-accent-emerald text-accent-emerald"
              : notification.type === "error"
                ? "bg-accent-rose/10 border-accent-rose text-accent-rose"
                : "bg-accent-violet/10 border-accent-violet text-accent-violet"
              }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Landing View --- */}
      {activeTab === "landing" && (
        <div className="flex-1 flex flex-col justify-between">
          {/* Landing Header */}
          <header className="border-b border-white/5 bg-[#090a0f]/80 backdrop-blur-xl sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-amber to-accent-violet flex items-center justify-center shadow-lg shadow-accent-amber/10">
                  <span className="font-extrabold text-sm text-white">AG</span>
                </div>
                <span className="font-bold text-lg tracking-tight font-display text-white">ArchGen <span className="text-accent-amber">AI</span></span>
              </div>
              <button
                onClick={() => setActiveTab("dashboard")}
                className="px-5 py-2.5 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-white text-xs border border-white/10 transition-all flex items-center gap-2 hover:border-accent-amber/40 shadow-sm"
              >
                Enter AI Workspace
                <svg className="w-3.5 h-3.5 text-accent-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
          </header>

          {/* Hero Section */}
          <main className="flex-1 max-w-7xl mx-auto px-6 py-12 md:py-24 space-y-24 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Text Area */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-amber/10 border border-accent-amber/20 text-xs font-semibold text-accent-amber">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-amber" />
                  AI Architectural Vector & Render Suite
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display leading-[1.1] text-white tracking-tight">
                  Design Your Dream <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-amber to-accent-violet">Space with Generative AI</span>
                </h1>
                <p className="text-gray-400 text-base sm:text-lg max-w-xl leading-relaxed">
                  Draft optimized blueprint layouts, render luxury modern building elevations, and curate solar-compatible color themes in real-time.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={() => setActiveTab("floorplan")}
                    className="px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-accent-amber to-accent-violet text-white shadow-xl hover:shadow-accent-amber/20 hover:scale-[1.01] transition-all text-sm"
                  >
                    Start Generating Blueprints
                  </button>
                  <button
                    onClick={() => setActiveTab("chat")}
                    className="px-8 py-4 rounded-xl font-bold bg-white/5 border border-white/10 hover:border-white/20 text-white hover:bg-white/10 hover:scale-[1.01] transition-all text-sm"
                  >
                    Consult AI Architect
                  </button>
                </div>
              </div>

              {/* Graphical Showcase Right */}
              <div className="lg:col-span-5 relative flex items-center justify-center">
                <div className="absolute inset-0 bg-accent-violet/10 rounded-full blur-3xl" />
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  className="w-full max-w-md aspect-[4/5] rounded-3xl overflow-hidden border border-white/15 bg-[#11121a] p-3 shadow-2xl relative"
                >
                  <img
                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
                    alt="Luxury Modern Villa Design"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                  <div className="absolute bottom-6 left-6 right-6 p-5 glass-panel rounded-2xl space-y-1 shadow-xl">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-accent-amber">RENDER MODEL S-40</span>
                    <h4 className="font-bold text-white text-sm">Floating Cantilever Glass Villa</h4>
                    <p className="text-[10px] text-gray-400 leading-relaxed">Optimized passive solar shading with custom gabled thermal glass panels.</p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Core Features Grid */}
            <div className="space-y-12">
              <div className="text-center space-y-2 max-w-lg mx-auto">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Professional Generator Tools</h2>
                <p className="text-gray-400 text-sm">Harness precise structural engineering templates and high-fidelity texture shaders.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title: "AI Floor Planner",
                    desc: "Calculate spatial configurations and ventilation-optimized blueprint arrangements.",
                    tab: "floorplan",
                    color: "border-accent-amber/20 hover:border-accent-amber",
                    icon: <svg className="w-6 h-6 text-accent-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                  },
                  {
                    title: "Exterior Renders",
                    desc: "Synthesize photorealistic structural facade elevations with details.",
                    tab: "elevation",
                    color: "border-accent-violet/20 hover:border-accent-violet",
                    icon: <svg className="w-6 h-6 text-accent-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  },
                  {
                    title: "Color Recommender",
                    desc: "Compute HEX palette codes matching various ambient lights.",
                    tab: "colors",
                    color: "border-accent-rose/20 hover:border-accent-rose",
                    icon: <svg className="w-6 h-6 text-accent-rose" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                  }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveTab(item.tab)}
                    className={`glass-panel p-6 rounded-2xl flex flex-col justify-between cursor-pointer border transition-all duration-300 hover:scale-[1.02] shadow-md hover:shadow-lg ${item.color}`}
                  >
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{item.title}</h4>
                        <p className="text-xs text-gray-400 leading-relaxed mt-1">{item.desc}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-accent-amber mt-4 inline-flex items-center gap-1">
                      Enter Studio →
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-white/5 bg-[#090a0f]/40 py-8 text-center text-xs text-gray-500">
            <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>© {new Date().getFullYear()} ArchGen AI. All rights reserved. Hackathon Suite.</div>
              <div className="flex gap-4">
                <span className="hover:text-white cursor-pointer transition-colors">Documentation</span>
                <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
                <span className="hover:text-white cursor-pointer transition-colors">API Keys</span>
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* --- Active Studio View with Sidebar --- */}
      {activeTab !== "landing" && (
        <div className="flex-1 flex overflow-hidden">

          {/* Workspace Left Sidebar */}
          <aside className={`border-r border-white/5 bg-[#0b0c13] transition-all duration-300 flex flex-col justify-between z-30 ${sidebarOpen ? "w-64" : "w-20"
            }`}>
            <div className="space-y-8 py-6">
              {/* Branding Header */}
              <div className="px-6 flex items-center justify-between">
                {sidebarOpen ? (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-amber to-accent-violet flex items-center justify-center">
                      <span className="font-extrabold text-[10px] text-white">AG</span>
                    </div>
                    <span className="font-bold text-sm tracking-tight text-white">ArchGen <span className="text-accent-amber">AI</span></span>
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-amber to-accent-violet flex items-center justify-center mx-auto">
                    <span className="font-extrabold text-[10px] text-white">AG</span>
                  </div>
                )}
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-1.5 px-3">
                {[
                  { id: "dashboard", label: "Dashboard", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" /></svg> },
                  { id: "floorplan", label: "Floor Plan", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg> },
                  { id: "elevation", label: "Elevation Exterior", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
                  { id: "colors", label: "Color Palette", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg> },
                  { id: "chat", label: "AI Architect Chat", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> }
                ].map((navItem) => (
                  <button
                    key={navItem.id}
                    onClick={() => setActiveTab(navItem.id)}
                    className={`w-full flex items-center gap-3.5 py-3.5 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all ${activeTab === navItem.id
                      ? "bg-accent-amber/10 text-accent-amber shadow-sm border border-accent-amber/20"
                      : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                      }`}
                  >
                    <span className={activeTab === navItem.id ? "text-accent-amber" : "text-gray-400"}>
                      {navItem.icon}
                    </span>
                    {sidebarOpen && <span>{navItem.label}</span>}
                  </button>
                ))}
              </nav>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 space-y-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="w-full py-2.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-gray-400 hover:text-white transition-all text-center"
              >
                {sidebarOpen ? "Collapse Menu" : "↔"}
              </button>
              <button
                onClick={() => setActiveTab("landing")}
                className="w-full py-2.5 rounded-lg bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-[10px] font-bold hover:bg-accent-rose/20 transition-all text-center"
              >
                {sidebarOpen ? "Exit Studio" : "✕"}
              </button>
            </div>
          </aside>

          {/* Workspace Right Content Frame */}
          <main className="flex-1 overflow-y-auto p-8 md:p-12 relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="max-w-6xl mx-auto"
              >
                {activeTab === "dashboard" && <DashboardPanel />}
                {activeTab === "floorplan" && <FloorPlanPanel />}
                {activeTab === "elevation" && <ElevationPanel />}
                {activeTab === "colors" && <ColorsPanel />}
                {activeTab === "chat" && <ChatPanel />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      )}
    </div>
  );
}
