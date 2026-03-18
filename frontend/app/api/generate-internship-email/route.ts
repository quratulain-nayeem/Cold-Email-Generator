import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function cleanText(html: string): string {
  return html
    .replace(/<[^>]*?>/g, " ")
    .replace(/https?:\/\/[^\s)>"]+/g, "")
    .replace(/[^a-zA-Z0-9 .,!?:;\-]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function scrapeUrl(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; cold-email-bot/1.0)" },
    signal: AbortSignal.timeout(10000),
  });
  const html = await res.text();
  return cleanText(html).slice(0, 2000);
}

async function writeInternshipMail(
  companyName: string,
  role: string,
  companyContext: string,
  whyCompany: string,
  yourName: string,
  yourEmail: string,
  skills: string[]
): Promise<string> {
  const skillsLine = skills.length ? skills.join(", ") : "Not provided";
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    messages: [
      {
        role: "user",
        content: `### CONTEXT:
Company: ${companyName}
Role applied for: ${role}
About the company (scraped from their site): ${companyContext || "Not provided."}
Why this company (from applicant, optional): ${whyCompany || "Not provided."}

### INSTRUCTION:
You are ${yourName}.
Write a cold internship outreach email to the hiring team at ${companyName} for the ${role} role.

About you:
- You are a student who built projects aligned with: ${skillsLine}.
- Technically grounded, outcome-focused, genuinely interested — not just applying everywhere.

Hard rules:
- Maximum 150 words. Count carefully. Do not exceed this.
- Address the hiring team at ${companyName} by name in the opening line.
- If company_context is available, reference what ${companyName} actually does in 1 sentence — make it specific, not generic.
- If why_company is provided and non-trivial, weave it in naturally — do not paste it verbatim.
- Mention exactly 1 or 2 student projects/skills most relevant to this role based on the provided skills.
- Tone: confident, direct, zero desperation. No phrases like "I would love the opportunity", "I am a quick learner", or "I believe I would be a great fit".
- Close with exactly this line (no variation): Happy to share more — ${yourEmail}
- No subject line. No preamble. No sign-off label (no "Best regards" or "Sincerely"). Just the email body ending with the CTA line above.

### EMAIL (NO PREAMBLE):`,
      },
    ],
  });
  return completion.choices[0].message.content ?? "";
}

export async function POST(req: NextRequest) {
  try {
    const { company_name, company_url, role, why_company, your_name, your_email, skills } = await req.json();

    if (!company_name || !role) {
      return NextResponse.json(
        { error: "company_name and role are required" },
        { status: 400 }
      );
    }
    if (!your_name || !your_email) {
      return NextResponse.json(
        { error: "your_name and your_email are required" },
        { status: 400 }
      );
    }

    const skillsArray =
      typeof skills === "string"
        ? skills
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [];

    let companyContext = "";
    if (company_url) {
      try {
        companyContext = await scrapeUrl(company_url);
      } catch {
        companyContext = "";
      }
    }

    const email = await writeInternshipMail(
      company_name,
      role,
      companyContext,
      why_company ?? "",
      your_name,
      your_email,
      skillsArray
    );

    return NextResponse.json({ email });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
