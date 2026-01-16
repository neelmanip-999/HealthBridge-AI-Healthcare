const Groq = require("groq-sdk");
const Chat = require('../models/Chat');

// --- DEBUG LOGGING ---
const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
    console.error("❌ CRITICAL: GROQ_API_KEY is missing in your .env file!");
} else {
    console.log("✅ AI Controller loaded. Groq API Key is present.");
}

// Initialize Groq
const groq = new Groq({ apiKey: apiKey });

// --- 1. GENERAL HEALTH ASSISTANT ---
exports.askAI = async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ success: false, message: "Prompt is required" });

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a helpful and empathetic AI health assistant named 'HealthBridge AI'. Answer health questions concisely. If the query is serious, advise seeing a doctor."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            // UPDATED MODEL HERE
            model: "llama-3.1-8b-instant", 
        });
        
        const response = completion.choices[0]?.message?.content || "I couldn't generate a response.";
        res.json({ success: true, response });

    } catch (error) {
        console.error("❌ AI Assistant Error:", error.message);
        res.status(500).json({ success: false, message: "AI Service Unavailable." });
    }
};

// --- 2. CONSULTATION SUMMARIZER ---
exports.summarizeConsultation = async (req, res) => {
    console.log("🔄 Generating Summary with Groq...");
    try {
        const { patientId, doctorId } = req.body;

        if (!patientId || !doctorId) {
            return res.status(400).json({ success: false, message: "Missing Patient or Doctor ID" });
        }

        const chats = await Chat.find({
            $or: [
                { senderId: patientId, receiverId: doctorId },
                { senderId: doctorId, receiverId: patientId }
            ]
        }).sort({ timestamp: 1 });

        if (chats.length === 0) {
            return res.json({ success: false, message: "No conversation found to analyze." });
        }

        const transcript = chats.map(c => 
            `${c.senderRole === 'doctor' ? 'Doctor' : 'Patient'}: ${c.message || '[Attachment]'}`
        ).join('\n');

        const aiPrompt = `
            Analyze this medical consultation transcript.
            Provide a summary in this EXACT structure:
            
            **Diagnosis:** (If mentioned, otherwise "Not stated")
            **Key Symptoms:** (List them)
            **Medications/Advice:** (List them)
            **Next Steps:** (Follow-up advice)

            Transcript:
            ${transcript}
        `;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "user", content: aiPrompt }
            ],
            // UPDATED MODEL HERE
            model: "llama-3.1-8b-instant",
        });

        const summary = completion.choices[0]?.message?.content || "Could not generate summary.";
        console.log("✅ Summary Generated!");
        res.json({ success: true, summary });

    } catch (error) {
        console.error("❌ Summary Generation Failed:", error.message);
        res.status(500).json({ success: false, message: "Failed to generate summary." });
    }
};

// --- 3. GENERIC AI QUERY HANDLER (Powering Search & Reports) ---
exports.customQuery = async (req, res) => {
    try {
        const { prompt, context } = req.body;
        
        let systemInstruction = "You are a helpful medical assistant.";
        
        if (context === 'report_analysis') {
            systemInstruction = "You are an expert doctor. Analyze the following medical report text. Explain any abnormal values in simple terms, list potential causes, and suggest lifestyle changes. Keep it structured and reassuring.";
        } 
        else if (context === 'symptom_checker') {
            const specialists = [
                "Cardiologist", "Dermatologist", "Neurologist", 
                "General Physician", "Pediatrician", "Orthopedic", 
                "Psychiatrist", "Dentist", "ENT Specialist", 
                "Gynecologist", "Oncologist"
            ];
            
            systemInstruction = `You are a medical receptionist. The user will describe symptoms. 
            You must ONLY output the most appropriate Specialist Category from this list: [${specialists.join(", ")}]. 
            Output ONLY the category name, nothing else. If the input is a doctor's name or unclear, output 'General Physician'.`;
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: prompt }
            ],
            // UPDATED MODEL HERE
            model: "llama-3.1-8b-instant",
        });

        res.json({ success: true, response: chatCompletion.choices[0]?.message?.content || "No response." });
    } catch (error) {
        console.error("AI Query Error:", error);
        res.status(500).json({ success: false, message: "AI Service Error" });
    }
};