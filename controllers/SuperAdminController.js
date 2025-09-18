import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import SuperAdmin from "../models/superAdminSchema.js"; // adjust path as needed
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GOOGLE_API_KEY = GOOGLE_MAPS_API_KEY;

// Optional: fail fast if missing
if (!GOOGLE_API_KEY) {
  console.error("[Config] Missing GOOGLE_MAPS_API_KEY / GOOGLE_API_KEY in environment");
}
const TICK_SEC_DEFAULT = 5;
import cloudinary from "../config/cloudinary.js";
import mongoose from "mongoose";

// Generate tokens
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

// Login Controller
export const loginSuperAdmin = async (req, res) => {
    try {
      console.log("Incoming body:", req.body);
      const { email, password } = req.body;
  
      // 1. Find SuperAdmin by email
      const superAdmin = await SuperAdmin.findOne({ email });
      if (!superAdmin) {
        return res.status(404).json({ message: "SuperAdmin not found" });
      }
  
      // 2. Validate password
      const isPasswordValid = await bcrypt.compare(password, superAdmin.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
  
      // 3. Generate tokens
      const accessToken = generateAccessToken(superAdmin._id);
      const refreshToken = generateRefreshToken(superAdmin._id);
  
      // 4. Save refreshToken in DB
      superAdmin.refreshToken = refreshToken;
      await superAdmin.save();
  
      // 5. Set tokens as HTTP-only cookies (optional, you can skip this if not needed)
      res.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 minutes
      });
  
      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
  
      // 6. Send response including tokens in the body
      res.status(200).json({
        message: "Login successful",
        superAdmin: {
          id: superAdmin._id,
          email: superAdmin.email,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
  

export const signupSuperAdmin = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // 1. Check if SuperAdmin already exists
      const existingAdmin = await SuperAdmin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({ message: "SuperAdmin already exists" });
      }
  
      // 2. Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
  
      // 3. Create new SuperAdmin
      const newSuperAdmin = new SuperAdmin({
        email,
        passwordHash
      });
  
      await newSuperAdmin.save();
  
      // 4. Respond with success
      res.status(201).json({
        message: "SuperAdmin registered successfully",
        superAdmin: {
          id: newSuperAdmin._id,
          email: newSuperAdmin.email
        }
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };


/**
 * POST /api/transport/:superAdminId/vehicles
 * Body: { registrationNumber, driverName, latitude, longitude }
 */
export const addVehicle = async (req, res) => {
  try {
    // Prefer JWT → req.user.id (set by auth middleware)
    const superAdminId = req.user?.id;
    if (!superAdminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { registrationNumber, driverName, latitude, longitude } = req.body;

    // Basic validation
    if (
      !registrationNumber ||
      !driverName ||
      latitude == null ||
      longitude == null
    ) {
      return res.status(400).json({
        message:
          "registrationNumber, driverName, latitude and longitude are required",
      });
    }

    // Load the owner document
    const admin = await SuperAdmin.findById(superAdminId).select("vehicles");
    if (!admin) {
      return res.status(404).json({ message: "SuperAdmin not found" });
    }

    // Prevent duplicate registration numbers per SuperAdmin
    const regNorm = String(registrationNumber).trim().toLowerCase();
    const exists = admin.vehicles.some(
      (v) => v.registrationNumber.trim().toLowerCase() === regNorm
    );
    if (exists) {
      return res
        .status(409)
        .json({ message: "Vehicle with this registration number already exists" });
    }

    // Push the new vehicle
    admin.vehicles.push({
      registrationNumber: String(registrationNumber).trim(),
      driverName,
      location: { latitude: Number(latitude), longitude: Number(longitude) },
      assignedAt: new Date(),
    });

    await admin.save();

    const vehicle = admin.vehicles.at(-1);
    return res.status(201).json({ message: "Vehicle added", vehicle });
  } catch (err) {
    console.error("addVehicle error:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: "Validation error", details: err.errors });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const toQS = (obj) => new URLSearchParams(obj).toString();

// 1) GET /api/transport/vehicles
export const listVehicles = async (req, res) => {
  try {
    const superAdminId = req.user?.id;
    if (!superAdminId) return res.status(401).json({ message: "Unauthorized" });

    const admin = await SuperAdmin.findById(superAdminId).select("vehicles");
    if (!admin) return res.status(404).json({ message: "SuperAdmin not found" });

    return res.json({ vehicles: admin.vehicles });
  } catch (e) {
    console.error("listVehicles:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// 2) GET /api/transport/places/:placeId  (auth-guarded; ID from JWT, not used further)
export const placeDetails = async (req, res) => {
  try {
    const superAdminId = req.user?.id;
    if (!superAdminId) return res.status(401).json({ message: "Unauthorized" });

    const { placeId } = req.params;
    if (!placeId) return res.status(400).json({ message: "placeId required" });

    const url =
      `https://maps.googleapis.com/maps/api/place/details/json?` +
      toQS({ place_id: placeId, fields: "geometry,name", key: GOOGLE_API_KEY });

    const resp = await fetch(url);
    const json = await resp.json();
    const r = json?.result;
    if (!r?.geometry?.location) return res.status(404).json({ message: "Place not found" });

    return res.json({
      name: r.name,
      lat: r.geometry.location.lat,
      lng: r.geometry.location.lng,
    });
  } catch (e) {
    console.error("placeDetails:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Normalize destination from many possible body shapes
function normalizeDestination(body = {}) {
  const {
    destination,
    lat, lng, lon, long, latitude, longitude,
    destLat, destLng, destLatitude, destLongitude,
  } = body;

  const latRaw =
    destination?.lat ??
    destination?.latitude ??
    lat ?? latitude ?? destLat ?? destLatitude;

  const lngRaw =
    destination?.lng ??
    destination?.lon ??
    destination?.long ??
    destination?.longitude ??
    lng ?? lon ?? long ?? longitude ?? destLng ?? destLongitude;

  const latNum = latRaw === undefined || latRaw === null ? NaN : Number(latRaw);
  const lngNum = lngRaw === undefined || lngRaw === null ? NaN : Number(lngRaw);

  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return null;
  return { lat: latNum, lng: lngNum };
}

// ========== FIXED CONTROLLER ==========
const qs = (obj) => new URLSearchParams(obj).toString();

async function gfetch(url) {
  const r = await fetch(url);
  const j = await r.json();
  return j;
}

// Resolve destination from either { placeId } or { lat, lng }
async function resolveDestination(dest) {
  if (!dest) return null;

  // Case A: placeId (from Google Autocomplete)
  if (dest.placeId) {
    const url =
      "https://maps.googleapis.com/maps/api/place/details/json?" +
      qs({
        place_id: dest.placeId,
        fields: "geometry,name",
        key: GOOGLE_API_KEY,
      });

    const json = await gfetch(url);
    if (json.status !== "OK") {
      return { error: `Places error: ${json.status}`, details: json.error_message || null };
    }
    const loc = json.result?.geometry?.location;
    if (!loc) return { error: "Place has no geometry" };
    return { lat: Number(loc.lat), lng: Number(loc.lng), name: json.result?.name || null };
  }

  // Case B: raw coordinates
  const latRaw =
    dest.lat ?? dest.latitude ?? dest.destLat ?? dest.destLatitude;
  const lngRaw =
    dest.lng ?? dest.lon ?? dest.long ?? dest.longitude ?? dest.destLng ?? dest.destLongitude;

  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng, name: null };
}

// Build a Directions API URL for origin -> destination
function directionsUrl(origin, destination) {
  return (
    "https://maps.googleapis.com/maps/api/directions/json?" +
    qs({
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      mode: "driving",
      key: GOOGLE_API_KEY,
    })
  );
}

// -- Controller -----------------------------------------------

/**
 * POST /api/SA/directions
 *
 * Body options:
 *  A) Provide vehicle coordinates directly:
 *     {
 *       "vehicle": { "lat": 17.4300, "lng": 78.4900 },
 *       "destination": { "placeId": "<from Autocomplete>" }   // or { "lat": ..., "lng": ... }
 *     }
 *
 *  B) OR provide a registration number; we'll read the vehicle's lat/lng from DB:
 *     {
 *       "reg": "TRK-101",
 *       "destination": { "placeId": "..." }                    // or { "lat":..., "lng":... }
 *     }
 *
 * Response:
 *  {
 *    vehicle: {lat,lng},
 *    destination: {lat,lng,name?},
 *    polyline: "<encoded polyline>",
 *    distanceMeters: 12345,
 *    durationSeconds: 867,
 *    etaText: "14 mins",
 *    bounds: { northeast:{lat,lng}, southwest:{lat,lng} }   // for easy fitBounds on the map
 *  }
 */
export const getDirectionsAndETA = async (req, res) => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({ message: "Server misconfig: GOOGLE_MAPS_API_KEY missing" });
    }

    // 1) Determine origin (vehicle position)
    let origin = null;

    // Option A: vehicle coords provided directly
    const vLatRaw =
      req.body?.vehicle?.lat ??
      req.body?.vehicle?.latitude ??
      req.body?.lat ??
      req.body?.latitude;
    const vLngRaw =
      req.body?.vehicle?.lng ??
      req.body?.vehicle?.lon ??
      req.body?.vehicle?.long ??
      req.body?.vehicle?.longitude ??
      req.body?.lng ??
      req.body?.lon ??
      req.body?.long ??
      req.body?.longitude;

    if (vLatRaw !== undefined && vLngRaw !== undefined) {
      const vLat = Number(vLatRaw);
      const vLng = Number(vLngRaw);
      if (Number.isFinite(vLat) && Number.isFinite(vLng)) {
        origin = { lat: vLat, lng: vLng };
      }
    }

    // Option B: registration number -> pull from DB (needs JWT to know which SuperAdmin)
    if (!origin) {
      const reg = (req.body?.reg ?? req.body?.registrationNumber)?.toString().trim();
      if (!reg) {
        return res.status(400).json({
          message:
            "Provide vehicle {lat,lng} OR 'reg' (registrationNumber) to look up vehicle position",
        });
      }
      const superAdminId = req.user?.id;
      if (!superAdminId) return res.status(401).json({ message: "Unauthorized" });

      const admin = await SuperAdmin.findById(superAdminId).select("vehicles");
      if (!admin) return res.status(404).json({ message: "SuperAdmin not found" });

      const v = admin.vehicles.find(
        (x) => x.registrationNumber?.trim().toLowerCase() === reg.toLowerCase()
      );
      if (!v) return res.status(404).json({ message: "Vehicle not found" });

      origin = { lat: Number(v.location.latitude), lng: Number(v.location.longitude) };
      if (!Number.isFinite(origin.lat) || !Number.isFinite(origin.lng)) {
        return res.status(400).json({ message: "Vehicle has no valid location" });
      }
    }

    // 2) Resolve destination (placeId or lat/lng)
    const dest = await resolveDestination(req.body?.destination);
    if (!dest || dest.error) {
      return res.status(400).json({
        message: dest?.error || "destination required (placeId or {lat,lng})",
        details: dest?.details || null,
      });
    }

    // 3) Get directions & ETA
    const json = await gfetch(directionsUrl(origin, dest));
    if (json.status && json.status !== "OK") {
      return res.status(400).json({
        message: "Google Directions error",
        status: json.status,
        error: json.error_message || null,
      });
    }

    const route = json?.routes?.[0];
    const leg = route?.legs?.[0];
    if (!route || !leg) return res.status(400).json({ message: "No route found" });

    // 4) Respond with everything the UI needs
    return res.json({
      vehicle: origin,
      destination: { lat: dest.lat, lng: dest.lng, name: dest.name || null },
      polyline: route.overview_polyline?.points || null,
      distanceMeters: leg.distance?.value ?? null,   // remaining distance from current location
      durationSeconds: leg.duration?.value ?? null,  // ETA in seconds
      etaText: leg.duration?.text ?? null,
      bounds: route.bounds || null,                  // use on client for fitBounds
    });
  } catch (err) {
    console.error("getDirectionsAndETA error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


// 4) GET /api/transport/track/stream/:reg?destLat=..&destLng=..&intervalSec=5
export const streamTracking = async (req, res) => {
  const superAdminId = req.user?.id;
  if (!superAdminId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const { reg } = req.params;
    const destLat = Number(req.query.destLat);
    const destLng = Number(req.query.destLng);
    const intervalSec = Math.max(2, Number(req.query.intervalSec) || TICK_SEC_DEFAULT);

    if (!reg || Number.isNaN(destLat) || Number.isNaN(destLng))
      return res.status(400).json({ message: "reg, destLat, destLng are required" });

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const destination = { lat: destLat, lng: destLng };
    let timer;

    const tick = async () => {
      try {
        const admin = await SuperAdmin.findById(superAdminId).select("vehicles");
        if (!admin) { res.write(`event: error\ndata: ${JSON.stringify({ message: "SuperAdmin not found" })}\n\n`); return; }
        const v = admin.vehicles.find((x) => x.registrationNumber === reg);
        if (!v) { res.write(`event: error\ndata: ${JSON.stringify({ message: "Vehicle not found" })}\n\n`); return; }

        const origin = { lat: v.location.latitude, lng: v.location.longitude };
        const resp = await fetch(directionsUrl(origin, destination));
        const data = await resp.json();
        const route = data?.routes?.[0];
        const leg = route?.legs?.[0];

        const payload = {
          vehicle: origin,
          destination,
          polyline: route?.overview_polyline?.points || null,
          distanceMeters: leg?.distance?.value ?? null,
          durationSeconds: leg?.duration?.value ?? null,
          etaText: leg?.duration?.text ?? null,
          updatedAt: new Date().toISOString(),
        };
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch (err) {
        console.error("SSE tick:", err);
        res.write(`event: error\ndata: ${JSON.stringify({ message: "tick_failed" })}\n\n`);
      }
    };

    await tick();
    timer = setInterval(tick, intervalSec * 1000);
    req.on("close", () => clearInterval(timer));
  } catch (e) {
    console.error("streamTracking:", e);
    if (!res.headersSent) return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const uploadMineMap = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
  
      // Upload file to Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "mine_maps" },
        async (error, result) => {
          if (error) {
            console.error("Cloudinary Upload Error:", error);
            return res.status(500).json({ message: "Cloudinary upload failed" });
          }
  
          // Find SuperAdmin by ID
          const superAdmin = await SuperAdmin.findById(req.user.id);
          if (!superAdmin) {
            return res.status(404).json({ message: "SuperAdmin not found" });
        }
  
          // Update SuperAdmin with new mine map URL
          superAdmin.mineMap = result.secure_url;
          superAdmin.updatedAt = Date.now();
  
          await superAdmin.save();
  
          return res.status(200).json({
            message: "Mine map uploaded successfully",
            mineMapUrl: superAdmin.mineMap,
            superAdmin: {
              id: superAdmin._id,
              email: superAdmin.email,
              mineMap: superAdmin.mineMap,
            },
          });
        }
      );
  
      // Pipe buffer to Cloudinary
      uploadStream.end(req.file.buffer);
  
    } catch (error) {
      console.error("UploadMineMap Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

  export const addHazardPin = async (req, res) => {
    try {
      const { type, hazardLevel, coordinates, description } = req.body;
  
      // ✅ Validate type
      if (type !== "Hazard") {
        return res.status(400).json({ message: "Type must be 'Hazard'" });
      }
  
      // ✅ Validate hazard level
      if (!["Yellow", "Orange", "Red"].includes(hazardLevel)) {
        return res.status(400).json({ message: "Invalid hazard level" });
      }
  
      // ✅ Validate coordinates
      if (!coordinates || !coordinates.x || !coordinates.y) {
        return res.status(400).json({ message: "Coordinates (x, y) are required" });
      }
  
      // ✅ Inject SuperAdmin from JWT
      const superAdmin = await SuperAdmin.findById(req.user.id);
      if (!superAdmin) {
        return res.status(404).json({ message: "SuperAdmin not found" });
      }
  
      // Upload images (up to 5)
      let imageUrls = [];
      if (req.files?.images) {
        for (const file of req.files.images) {
          const uploaded = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              { folder: "pins/images" },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(file.buffer);
          });
          imageUrls.push(uploaded.secure_url);
        }
      }
  
      // Upload voice note (optional)
      let voiceNoteUrl = null;
      if (req.files?.voiceNote?.[0]) {
        const uploaded = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: "pins/voicenotes", resource_type: "auto" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(req.files.voiceNote[0].buffer);
        });
        voiceNoteUrl = uploaded.secure_url;
      }
  
      // ✅ Create new pin
      const newPin = {
        type,
        hazardLevel,
        coordinates,
        description,
        images: imageUrls,
        voiceNote: voiceNoteUrl,
      };
  
      // Save to SuperAdmin
      superAdmin.pins.push(newPin);
      superAdmin.updatedAt = Date.now();
      await superAdmin.save();
  
      return res.status(201).json({
        message: "Hazard pin added successfully",
        pin: newPin,
      });
    } catch (error) {
      console.error("AddHazardPin Error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };


  export const getSafetyHazardPin = async (req, res) => {
    try {
      const { pinId } = req.params;
  
      // Validate MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(pinId)) {
        return res.status(400).json({ message: "Invalid hazard pin ID" });
      }
  
      // Find the SuperAdmin document that contains this pin
      const superAdmin = await SuperAdmin.findOne({ "pins._id": pinId });
  
      if (!superAdmin) {
        return res.status(404).json({ message: "Safety hazard pin not found" });
      }
  
      // Find the pin in the pins array
      const hazardPin = superAdmin.pins.id(pinId);
  
      // Extra check (should not be necessary, but safe)
      if (!hazardPin) {
        return res.status(404).json({ message: "Safety hazard pin not found in pins array" });
      }
  
      res.status(200).json({
        message: "Hazard pin retrieved successfully",
        hazardPin,
      });
    } catch (error) {
      console.error("Error fetching hazard pin:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };