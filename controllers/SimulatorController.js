// controllers/superAdminController.js
import SuperAdmin from "../models/superAdminSchema.js";
import mongoose from "mongoose";

// ✅ Get all Safety Nodes
export const getAllSafetyNodes = async (req, res) => {
    try {
      // Fetch all SuperAdmins but only select safetyNodes
      const superAdmins = await SuperAdmin.find().select("safetyNodes");
  
      // Flatten the nodes into a single array
      const allSafetyNodes = superAdmins.reduce((acc, sa) => {
        if (sa.safetyNodes && sa.safetyNodes.length > 0) {
          acc.push(...sa.safetyNodes);
        }
        return acc;
      }, []);
  
      res.status(200).json({
        message: "Safety nodes fetched successfully",
        safetyNodes: allSafetyNodes,
      });
    } catch (error) {
      console.error("Error fetching safety nodes:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

  
  export const addSimulatorEventToNode = async (req, res) => {
    try {
      const { nodeId } = req.params;
      const { type, value } = req.body; // Only type and value
  
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(nodeId)) {
        return res.status(400).json({ message: "Invalid Safety Node ID" });
      }
  
      // Validate type
      const validTypes = ["Methane", "WorkerDistress", "Temperature"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ message: "Invalid event type" });
      }
  
      // Find SuperAdmin document that contains this node
      const superAdmin = await SuperAdmin.findOne({ "safetyNodes._id": nodeId });
      if (!superAdmin) {
        return res.status(404).json({ message: "Safety Node not found" });
      }
  
      // Get the node
      const node = superAdmin.safetyNodes.id(nodeId);
      if (!node) {
        return res.status(404).json({ message: "Node not found in array" });
      }
  
      // Determine level (color) based on type and value
      let level;
      switch (type) {
        case "Methane":
          if (value >= 0.01 && value <= 0.75) level = "Yellow";
          else if (value > 0.75 && value <= 1.25) level = "Orange";
          else if (value > 1.25) level = "Red";
          else return res.status(400).json({ message: "Invalid methane value" });
          break;
  
        case "WorkerDistress":
          // value = number of presses (1 → Yellow, 2 → Orange, 3 → Red)
          if (value === 1) level = "Yellow";
          else if (value === 2) level = "Orange";
          else if (value >= 3) level = "Red";
          else return res.status(400).json({ message: "Invalid Worker Distress value" });
          break;
  
        case "Temperature":
          if (value >= 27.5 && value <= 32.5) level = "Orange";
          else if (value > 32.5) level = "Red";
          else level = "Yellow"; // Below 27.5 → Yellow
          break;
      }
  
      // Create event
      const newEvent = { type, value, level };
      node.simulatorEvents.push(newEvent);
  
      superAdmin.updatedAt = Date.now();
      await superAdmin.save();
  
      res.status(200).json({
        message: "Simulator event added successfully",
        node,
        event: newEvent, // Include the calculated color
      });
    } catch (error) {
      console.error("AddSimulatorEvent Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
  