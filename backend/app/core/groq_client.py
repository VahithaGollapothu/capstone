import json
import logging
import random
import uuid
from typing import Dict, Any, List
import httpx
from app.core.config import settings
from app.core import prompts
from fastapi import HTTPException
from app.models import schemas

logger = logging.getLogger("archgen")

# Premium architectural images curated to match user queries
ELEVA_IMAGES = {
    "modern": [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=1200&q=80"
    ],
    "luxury": [
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=80"
    ],
    "minimalist": [
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80"
    ],
    "traditional": [
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80"
    ]
}

async def call_groq_llm(system_prompt: str, user_prompt: str) -> str:
    """Wrapper to call Groq Cloud completions using Llama 3 model."""
    if settings.IS_MOCK_MODE:
        # Return a unique placeholder string for each call to guarantee variability in mock mode.
        import uuid
        return f"Mock response: {uuid.uuid4()}"
            
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "llama3-70b-8192",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 1500
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=data, headers=headers)
            if response.status_code == 200:
                result = response.json()
                return result["choices"][0]["message"]["content"]
            else:
                logger.warning(f"Groq API returned error {response.status_code}: {response.text}")
    except Exception as e:
        logger.error(f"Error connecting to Groq LLM: {str(e)}")
    
    return ""
async def generate_floorplan(payload: schemas.FloorPlanRequest):
    try:
        layout = await generate_floor_plan(
            dimensions=payload.dimensions,
            rooms_per_floor=payload.rooms,
            floors=payload.floors,
            style=payload.style,
            budget=payload.budget,
            include_penthouse=payload.include_penthouse
        )

        return {
            "status": "success",
            "data": layout
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
async def generate_floor_plan(
    dimensions: str,
    rooms_per_floor: int,
    floors: int,
    style: str,
    budget: float,
    include_penthouse: bool = False,
    layout_type: str = "Standard"
) -> Dict[str, Any]:
    """Generates a smart floor plan layout."""
    if budget >= 100:
        budget_formatted = f"₹{budget/100:.2f} Crores"
    else:
        budget_formatted = f"₹{budget:.0f} Lakhs"


    user_prompt = prompts.FLOOR_PLAN_PROMPT.format(
        dimensions=dimensions,
        layout_type=layout_type,
        floors=floors,
        rooms_per_floor=rooms_per_floor,
        include_penthouse="Yes" if include_penthouse else "No",
        style=style,
        budget_formatted=budget_formatted
    )
    
    response_text = await call_groq_llm("You are a smart architecture design planner.", user_prompt)
    
    if response_text:
        try:
            # Clean possible markdown formatting
            cleaned = response_text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            return json.loads(cleaned.strip())
        except Exception as e:
            logger.warning(f"Failed to parse Groq response for floor plan: {str(e)}. Falling back to mock layout.")

    # High fidelity mock layout fallback
    floors_data = []
    
    # Ground Floor Layout
    ground_rooms = [
        {"name": "Living Room / Majlis", "dimensions": "16' x 20'", "position": "North-East", "description": "Spacious Vaastu-compliant family lounge with floor-to-ceiling glass screen sliders."},
        {"name": "Kitchen & Dining Area", "dimensions": "12' x 16'", "position": "South-East", "description": "Modular utility layout with pantry and direct exhaust ducts."},
        {"name": "Pooja Room", "dimensions": "6' x 8'", "position": "East", "description": "Private spiritual room with geometric wooden partition slats."}
    ]
    if rooms_per_floor > 3:
        ground_rooms.append({"name": "Guest Bed Room", "dimensions": "12' x 14'", "position": "South-West", "description": "Cozy room with attached bath and window ventilation."})
    
    # Add staircases and parking
    ground_rooms.append({"name": "Staircase & Foyer", "dimensions": "8' x 14'", "position": "North", "description": "Internal staircase landing area for upper floor connection."})
    ground_rooms.append({"name": "Covered Parking & Portico", "dimensions": "12' x 18'", "position": "North-West", "description": "Spacious dual car parking shade."})
    
    floors_data.append({
        "floorName": "Ground Floor",
        "rooms": ground_rooms
    })
    
    # Upper Floors Layout
    for i in range(1, floors):
        upper_rooms = [
            {"name": "Master Suite & Walk-in Wardrobe", "dimensions": "18' x 16'", "position": "South-West", "description": "Luxury suite with sliding panel access to private balcony."},
            {"name": "Premium Kids Bed Room", "dimensions": "12' x 14'", "position": "North-West", "description": "Includes study desk partition and attached bath layout."}
        ]
        if rooms_per_floor > 2:
            upper_rooms.append({"name": "Home Office / Study Room", "dimensions": "10' x 12'", "position": "North-East", "description": "Quiet zone optimized for natural desk daylighting."})
        if rooms_per_floor > 3:
            upper_rooms.append({"name": "Entertainment Lounge", "dimensions": "14' x 14'", "position": "Center", "description": "Media lounge for family gathering."})
            
        upper_rooms.append({"name": "Outdoor Balcony Deck", "dimensions": "6' x 14'", "position": "South-East", "description": "Spacious glass-railing deck looking out to garden landscape."})
        upper_rooms.append({"name": "Utility Storage Room", "dimensions": "6' x 8'", "position": "West", "description": "Convenient washing and linens storage."})
        
        floors_data.append({
            "floorName": f"First Floor (Level {i+1})" if i == 1 else f"Floor Level {i+1}",
            "rooms": upper_rooms
        })
        
    # Penthouse Option
    if include_penthouse:
        floors_data.append({
            "floorName": "Penthouse Level (Rooftop)",
            "rooms": [
                {"name": "Luxury Glass-Wall Lounge", "dimensions": "16' x 18'", "position": "Center", "description": "Stunning panoramic sky lounge with fully transparent double-glazed glass profiles."},
                {"name": "Rooftop Open Terrace & Deck", "dimensions": "20' x 24'", "position": "North-East", "description": "Eco-friendly wooden deck ideal for evening social gatherings and barbecues."},
                {"name": "Organic Rooftop Garden", "dimensions": "12' x 30'", "position": "Perimeter", "description": "Lush planter arrays with local flora and automated drip irrigation grids."}
            ]
        })

    return {
        "layoutName": f"The Indian-Vaastu {layout_type} {style} Mansion",
        "totalAreaSqFt": (rooms_per_floor * 250 + 400) * floors + (600 if include_penthouse else 0),
        "floors": floors_data,
        "optimizations": [
],
        "estimatedConstructionCost": f"₹{budget * 0.9:.1f} Lakhs - ₹{budget * 1.15:.1f} Lakhs" if budget < 100 else f"₹{budget/100 * 0.9:.2f} Crores - ₹{budget/100 * 1.15:.2f} Crores"
    }

async def generate_elevation(style: str, floors: int = 2, floorPlanData: Dict[str, Any] = None) -> Dict[str, Any]:
    """Generates 3-4 side-by-side elevation variant options."""
    # Use the AI service for rendering
    from app.core.visual_generation import generate_elevation as ai_generate_elevation
    return await ai_generate_elevation(style, floors)

async def generate_colors(theme: str, room_type: str, lighting: str) -> Dict[str, Any]:
    """Generates 8-12 color recommendation cards with Vaastu/designer reasoning."""
    theme_clean = theme.lower()
    
    palette_key = "warm"
    if "cool" in theme_clean or "green" in theme_clean or "nature" in theme_clean:
        palette_key = "cool"
    elif "charcoal" in theme_clean or "industrial" in theme_clean or "futuristic" in theme_clean:
        palette_key = "industrial"
    elif "royal" in theme_clean or "luxury" in theme_clean:
        palette_key = "royal"
    elif "earthy" in theme_clean:
        palette_key = "earthy"
    
    color_collections = {
        "warm": [
            {"name": "Desert Sienna", "hex": "#C37C63", "role": "Focal Wall Accent", "description": "Gives a warm, sun-kissed glow to conversation spaces."},
            {"name": "Bleached Linen", "hex": "#EAE5D9", "role": "Main Walls", "description": "Neutral base that reflects ambient light softly without looking sterile."},
            {"name": "Burnt Umber", "hex": "#5A443E", "role": "Millwork / Trim", "description": "Deep contrast accent styling for door frames and baseboards."},
            {"name": "Sandstone Tan", "hex": "#D2B48C", "role": "Secondary Wall", "description": "Bespoke warm neutral highlighting for secondary corridor paths."},
            {"name": "Teak Wood Texture", "hex": "#8B5A2B", "role": "Wood Finish", "description": "Organic ceiling slats or floor wood textures."},
            {"name": "Soft Ivory", "hex": "#FFFFF0", "role": "Ceiling Coat", "description": "Reflects warm downlighting grids to increase perceived ceiling height."},
            {"name": "Brass Highlight", "hex": "#C5A059", "role": "Metal Finish", "description": "Ideal for switches, lighting fixtures, and custom profile trim."},
            {"name": "Warm Clay", "hex": "#B67B5F", "role": "Niche Accent", "description": "Brings focus to display arches or television backing walls."}
        ],
        "cool": [
            {"name": "Oceanic Spruce", "hex": "#3E5854", "role": "Cabinetry Focus", "description": "Brings serene, deep nature tones indoors."},
            {"name": "Pewter Mist", "hex": "#D1D5DB", "role": "Ceiling & Trim", "description": "Highly reflective cold silver hue."},
            {"name": "Soft Sage", "hex": "#A2B5A9", "role": "Primary Walls", "description": "Relaxing, quiet color ideal for bedrooms or study zones."},
            {"name": "Forest Green", "hex": "#228B22", "role": "Biophilic Accent", "description": "Potted garden backdrop wall."},
            {"name": "Earthy Olive", "hex": "#556B2F", "role": "Upholstery", "description": "Complements wood textures in soft furniture trims."},
            {"name": "Snow White", "hex": "#FFFAFA", "role": "Focal Contrast", "description": "Gives crisp, high-end separation lines."},
            {"name": "Polished Silver", "hex": "#C0C0C0", "role": "Metal Trim", "description": "Modern cooling metal borders."},
            {"name": "Deep Aqua", "hex": "#008B8B", "role": "Powder Room Focus", "description": "Stunning water-inspired highlight."}
        ],
        "industrial": [
            {"name": "Industrial Concrete", "hex": "#8A8D8F", "role": "Floor / Accent", "description": "Sleek metropolitan aesthetic."},
            {"name": "Pure Chalk", "hex": "#F9FAFB", "role": "Primary Wall", "description": "Crisp canvas allowing furniture colors to pop."},
            {"name": "Charcoal Black", "hex": "#1F2937", "role": "Feature Slats", "description": "Adds bold architectural framework structure."},
            {"name": "Rust Iron", "hex": "#B7410E", "role": "Industrial Contrast", "description": "Corroded metal look for retro bookshelf panels."},
            {"name": "Steel Gray", "hex": "#708090", "role": "Structural Beams", "description": "Exposed steel beam visual finish."},
            {"name": "Warm Edison Amber", "hex": "#FFBF00", "role": "Lighting Glow", "description": "Provides amber-hued balance to cold concrete panels."},
            {"name": "Brushed Chrome", "hex": "#A8A8A8", "role": "Hardware Tone", "description": "Hardware trim for high-use doors."},
            {"name": "Slate Tile", "hex": "#475569", "role": "Wet Area Cladding", "description": "Dark luxury masonry finish."}
        ],
        "royal": [
            {"name": "Royal Emerald", "hex": "#097969", "role": "Focal Velvet Wall", "description": "Rich velvet jewel tone adding regal depth."},
            {"name": "Champagne Gold", "hex": "#D4AF37", "role": "Gilded Inlay", "description": "Luxurious gold leaf detailing for trim moldings."},
            {"name": "Alabaster White", "hex": "#F2F0EA", "role": "Main Canvas", "description": "Opulent white marble base coat."},
            {"name": "Plum Royal", "hex": "#4E2F48", "role": "Secondary Accent", "description": "Dignified dark shade for formal chairs."},
            {"name": "Polished Walnut", "hex": "#4A3B32", "role": "Premium Wood Floor", "description": "Deep glossy floor wood texture."},
            {"name": "Velvet Rose", "hex": "#C08081", "role": "Drapes/Linens", "description": "Softened luxury tone balancing gold highlights."},
            {"name": "Imperial Ivory", "hex": "#FFFFF0", "role": "Archways/Columns", "description": "Gives historic grandeur appearance."},
            {"name": "Satin Brass", "hex": "#B5A642", "role": "Accent Frames", "description": "Bespoke picture frame borders."}
        ],
        "earthy": [
            {"name": "Terracotta Clay", "hex": "#E2725B", "role": "Main Accent Wall", "description": "Warm brick hue connecting the space to earth elements."},
            {"name": "Raw Ochre", "hex": "#CC7722", "role": "Secondary Accent", "description": "Sunny clay highlight for alcoves."},
            {"name": "Khaki Sand", "hex": "#F4E7C4", "role": "Main Room Paint", "description": "Calming neutral wheat shade."},
            {"name": "Mud Straw", "hex": "#C2B280", "role": "Ceiling Beams", "description": "Organic straw texture complement."},
            {"name": "Chestnut Wood", "hex": "#5D4037", "role": "Cabinet Finish", "description": "Natural unpolished cabinet face."},
            {"name": "Muted Moss", "hex": "#8E9A70", "role": "Textiles", "description": "Soft forest moss rug highlight."},
            {"name": "Flint Stone Gray", "hex": "#4E5154", "role": "Baseboard/Trims", "description": "Grounding dark gray separator."},
            {"name": "Pampa Straw", "hex": "#F5F5DC", "role": "Trim detailing", "description": "Light reed outline decoration."}
        ]
    }
    
    colors_list = color_collections.get(palette_key, color_collections["warm"])
    
    advice = f"Under {lighting} lighting in the {room_type}, this {theme} palette creates excellent visual depth. "
    if "living" in room_type.lower():
        advice += "Use the primary wall paint on 3 walls and save the focal accent for the television or fireplace backing."
    elif "bedroom" in room_type.lower():
        advice += "Use the primary wall color behind the bed headboard and soft neutral tones elsewhere to support restful sleep."
    else:
        advice += "Utilize satin finishes for secondary walls to reflect light across corridors."
        
    return {
        "themeName": f"Premium {theme} Palette — {room_type}",
        "colors": colors_list,
        "lightingAdvice": advice
    }

async def generate_exterior(style: str) -> Dict[str, Any]:
    """Generate exterior rendering using Replicate/Stability AI."""
    from app.core.visual_generation import generate_exterior as ai_generate_exterior
    return await ai_generate_exterior(style)

async def ask_architect(question: str, history: List[Dict[str, str]] = None) -> str:
    """Answers architecture queries with context awareness."""
    if not history:
        history = []
        
    # Assemble interactive history for LLM
    system_prompt = prompts.CHAT_SYSTEM_PROMPT
    user_prompt = ""
    for msg in history[-4:]:  # Limit history context to past few exchanges
        role_label = "Client" if msg["role"] == "user" else "Architect"
        user_prompt += f"{role_label}: {msg['content']}\n"
    user_prompt += f"Client: {question}\nArchitect:"
    
    response = await call_groq_llm(system_prompt, user_prompt)
    
    # If mock mode returns a generic placeholder, treat it as no response to trigger fallback
    if response and response.startswith("Mock response"):
        response = ""
    
    if response:
        return response.strip()
        
    # Architectural fallback responses based on keywords. These keep mock/offline mode
    # useful without returning the same generic paragraph for every question.
    # Add a unique token to make each response distinct and randomize wording for variety.
    question_lower = question.lower()
    opening = f"For your question about \"{question.strip()}\", here is the design direction I would take:"

    # Helper to pick a random template from a list
    def pick(templates):
        return random.choice(templates)

    if "ventilation" in question_lower or "airflow" in question_lower:
        templates = [
            f"**Ventilation Improvement Strategy:**\n\n1. **Cross‑Ventilation Alignment**: Place windows on opposite walls. Ensure air enters low and exits high to leverage thermal buoyancy.\n2. **Stack Ventilation**: Incorporate double‑height ceilings or solar chimneys. Hot air naturally rises and exits through upper skylights, pulling cool air from lower apertures.\n3. **Clerestory Windows**: Install high ribbon windows. These capture high wind flows while maintaining security and privacy.\n\n",
            f"**Optimized Airflow Plan:**\n\n- Position operable windows across the floor plan to create a wind tunnel effect.\n- Use high‑ceiling vents and low‑level intake grilles for natural convection.\n- Add vented skylights for night‑time cooling.\n\n",
            f"**Airflow Enhancement Tips:**\n\n1. Align windows on opposite sides to promote cross‑drafts.\n2. Integrate vertical shafts that guide warm air upward.\n3. Use clerestory glazing to capture breezes aloft.\n\n"
        ]
        return pick(templates)
    elif "exterior" in question_lower or "elevation" in question_lower:
        templates = [
            f"**High‑End Exterior Design Recommendations:**\n\n1. **Mixed Facades**: Blend natural stone cladding with sleek metal vertical panels or cedar wood batten accents.\n2. **Cantilever Architecture**: Project upper stories outward. This creates dramatic shadows and offers covered shade below.\n3. **Hidden Downspouts**: Integrate drainage into the exterior pillars so water systems do not disrupt the facade profile.\n\n",
            f"**Premium Elevation Guidance:**\n\n- Combine stone, metal, and wood textures for depth.\n- Introduce staggered balconies to break monotony.\n- Conceal rainwater management within structural elements.\n\n",
            f"**Exterior Facade Tips:**\n\n1. Use a base of limestone with vertical metal fins.\n2. Add overhanging canopies for shade and visual interest.\n3. Route downspouts through decorative columns.\n\n"
        ]
        return pick(templates)
    elif "color" in question_lower or "paint" in question_lower or "palette" in question_lower:
        templates = [
            f"{opening}\n\n1. Use a light warm neutral on the main walls to expand the room visually.\n2. Add one deeper accent behind the TV, bed, or main seating wall so the space has a clear focal point.\n3. Keep ceilings and trims lighter than the walls, then repeat the accent color in cushions, art, or cabinet hardware.\n\n",
            f"{opening}\n\n- Start with a soft neutral base to maximise light.\n- Introduce a bold accent on a single feature wall for drama.\n- Mirror the accent through accessories for cohesion.\n\n",
            f"{opening}\n\n1. Light neutral walls create spaciousness.\n2. Accent with a richer hue on trims or furnishings.\n3. Use coordinated textiles to echo the accent colour.\n\n"
        ]
        return pick(templates)
    elif "cost" in question_lower or "budget" in question_lower or "estimate" in question_lower:
        templates = [
            f"{opening}\n\n1. Separate the estimate into structure, finishes, services, and furniture so premium choices do not hide inside one number.\n2. Spend first on waterproofing, windows, electrical planning, and flooring because those are expensive to correct later.\n3. Keep a 10‑15% contingency for site changes, material price movement, and client‑selected upgrades.\n\n",
            f"{opening}\n\n- Break down costs by major categories: foundation, envelope, interiors, MEP.\n- Prioritise envelope integrity and structural work before finishes.\n- Allocate a contingency buffer of ~12% for unforeseen items.\n\n",
            f"{opening}\n\n1. Outline costs for core structure, then layer finishes and furnishings.\n2. Invest early in high‑impact items like windows and waterproofing.\n3. Reserve a contingency to manage price volatility.\n\n"
        ]
        return pick(templates)
    elif "material" in question_lower or "wood" in question_lower or "glass" in question_lower or "stone" in question_lower:
        templates = [
            f"{opening}\n\n1. Pair one warm natural material, such as teak or oak, with one quiet stone or concrete finish.\n2. Use low‑E glass for large openings to control heat while keeping daylight quality high.\n3. Limit metal accents to handles, trims, and lighting so the design feels premium instead of busy.\n\n",
            f"{opening}\n\n- Choose a dominant material (e.g., walnut) and complement it with a subtle stone veneer.\n- Apply low‑E glazing for energy efficiency.\n- Keep metal fixtures minimal and cohesive.\n\n",
            f"{opening}\n\n1. Combine a rich wood tone with a matte stone backdrop.\n2. Integrate high‑performance glass to balance light and heat.\n3. Use metal sparingly for functional hardware.\n\n"
        ]
        return pick(templates)
    elif "small" in question_lower or "space" in question_lower or "room" in question_lower:
        templates = [
            f"{opening}\n\n1. Use built‑in storage along one continuous wall to reduce visual clutter.\n2. Keep circulation paths at least 3 feet wide where people pass frequently.\n3. Use mirrors, pale ceilings, and furniture with exposed legs to make the room feel lighter.\n\n",
            f"{opening}\n\n- Install floor‑to‑ceiling closets to maximise storage.\n- Maintain clear pathways of ≥ 3 ft.\n- Leverage reflective surfaces to amplify space.\n\n",
            f"{opening}\n\n1. Adopt built‑in shelving to free floor area.\n2. Ensure a minimum 0.9 m clear aisle width.\n3. Incorporate light‑colored finishes and reflective décor.\n\n"
        ]
        return pick(templates)
    else:
        templates = [
            f"{opening}\n\n1. Start with circulation: entry, movement, and privacy should be resolved before finishes.\n2. Align daylight, ventilation, and service shafts early so the layout works practically.\n3. Choose one dominant style direction, then repeat its materials consistently across doors, ceilings, lighting, and furniture.\n\n",
            f"{opening}\n\n- Define clear zones for entry, circulation, and private spaces first.\n- Integrate daylight and ventilation strategies early in the schematic.\n- Apply a cohesive material palette throughout the design.\n\n",
            f"{opening}\n\n1. Map out movement paths before detailing.\n2. Coordinate natural light and airflow early on.\n3. Stick to a unified aesthetic language for finishes.\n\n"
        ]
        return pick(templates)
