import OpenAI from "npm:openai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const prompt = [
  "You are extracting pet medical records from an uploaded veterinary document or image.",
  "Extract only information visible in the file.",
  "Do not diagnose.",
  "Do not invent missing details.",
  "Return JSON only.",
].join(" ");

const extractionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    vaccines: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          vaccineName: { type: "string" },
          dateGiven: { type: "string" },
          nextDueDate: { type: "string" },
          providerClinic: { type: "string" },
          vaccineNotes: { type: "string" },
        },
        required: ["vaccineName", "dateGiven", "nextDueDate", "providerClinic", "vaccineNotes"],
      },
    },
    medications: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          medicationName: { type: "string" },
          dosage: { type: "string" },
          frequency: { type: "string" },
          startDate: { type: "string" },
          endDate: { type: "string" },
          prescribingVet: { type: "string" },
          medicationNotes: { type: "string" },
          nextDoseDate: { type: "string" },
        },
        required: ["medicationName", "dosage", "frequency", "startDate", "endDate", "prescribingVet", "medicationNotes", "nextDoseDate"],
      },
    },
    visits: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          visitReason: { type: "string" },
          appointmentDate: { type: "string" },
          clinicVet: { type: "string" },
          diagnosisFindings: { type: "string" },
          followUpDate: { type: "string" },
          appointmentNotes: { type: "string" },
        },
        required: ["visitReason", "appointmentDate", "clinicVet", "diagnosisFindings", "followUpDate", "appointmentNotes"],
      },
    },
    weights: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          weightValue: { type: "string" },
          weightDate: { type: "string" },
          weightNotes: { type: "string" },
        },
        required: ["weightValue", "weightDate", "weightNotes"],
      },
    },
    diagnoses: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          diagnosisName: { type: "string" },
          diagnosedDate: { type: "string" },
          diagnosisVet: { type: "string" },
          treatmentPlan: { type: "string" },
          diagnosisNotes: { type: "string" },
        },
        required: ["diagnosisName", "diagnosedDate", "diagnosisVet", "treatmentPlan", "diagnosisNotes"],
      },
    },
    labResults: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          testName: { type: "string" },
          testDate: { type: "string" },
          resultSummary: { type: "string" },
          labVet: { type: "string" },
          labNotes: { type: "string" },
        },
        required: ["testName", "testDate", "resultSummary", "labVet", "labNotes"],
      },
    },
    symptoms: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          symptomName: { type: "string" },
          severity: { type: "string" },
          symptomDate: { type: "string" },
          symptomFollowUpDate: { type: "string" },
          symptomNotes: { type: "string" },
        },
        required: ["symptomName", "severity", "symptomDate", "symptomFollowUpDate", "symptomNotes"],
      },
    },
    allergies: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          allergyName: { type: "string" },
          reaction: { type: "string" },
          severity: { type: "string" },
          allergyNotes: { type: "string" },
        },
        required: ["allergyName", "reaction", "severity", "allergyNotes"],
      },
    },
    procedures: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          procedureName: { type: "string" },
          surgeryDate: { type: "string" },
          clinicVet: { type: "string" },
          recoveryNotes: { type: "string" },
          surgeryFollowUpDate: { type: "string" },
        },
        required: ["procedureName", "surgeryDate", "clinicVet", "recoveryNotes", "surgeryFollowUpDate"],
      },
    },
    summary: { type: "string" },
    warnings: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "vaccines",
    "medications",
    "visits",
    "weights",
    "diagnoses",
    "labResults",
    "symptoms",
    "allergies",
    "procedures",
    "summary",
    "warnings",
  ],
} as const;

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function normalizeText(value: unknown) {
  return String(value || "").trim();
}

function buildInputContent(fileUrl: string, fileName: string, mimeType: string) {
  const filePart = mimeType.startsWith("image/")
    ? { type: "input_image", image_url: fileUrl }
    : { type: "input_file", file_url: fileUrl };

  return [
    {
      type: "input_text",
      text: [
        prompt,
        "",
        `File name: ${fileName || "Unknown"}`,
        `MIME type: ${mimeType || "Unknown"}`,
        "If unclear, leave fields blank instead of guessing.",
      ].join("\n"),
    },
    filePart,
  ];
}

function parseModelJson(outputText: string) {
  const raw = normalizeText(outputText);
  if (!raw) {
    throw new Error("OpenAI returned an empty response.");
  }
  return JSON.parse(raw);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const fileUrl = normalizeText(body?.fileUrl);
    const fileName = normalizeText(body?.fileName);
    const mimeType = normalizeText(body?.mimeType).toLowerCase();

    if (!fileUrl) {
      return jsonResponse({ error: "fileUrl is required" }, 400);
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return jsonResponse({ error: "OPENAI_API_KEY is not configured" }, 500);
    }

    const client = new OpenAI({ apiKey });
    const response = await client.responses.create({
      model: "gpt-5.5",
      input: [
        {
          role: "user",
          content: buildInputContent(fileUrl, fileName, mimeType),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "pet_health_record_extraction",
          strict: true,
          schema: extractionSchema,
        },
      },
    });

    const parsed = parseModelJson(response.output_text || "");
    return jsonResponse(parsed);
  } catch (error) {
    console.error("analyze-health-record error:", error);
    return jsonResponse(
      {
        error: "Unable to analyze record",
        details: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});
