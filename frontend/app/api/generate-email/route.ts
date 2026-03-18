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
  return cleanText(html).slice(0, 6000);
}

async function extractJobs(pageText: string): Promise<object[]> {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    messages: [
      {
        role: "user",
        content: `### SCRAPED TEXT FROM WEBSITE:\n${pageText}\n\n### INSTRUCTION:\nThe scraped text is from the career's page of a website.\nYour job is to extract the job postings and return them in JSON format containing the following keys: \`role\`, \`experience\`, \`skills\` and \`description\`.\nOnly return the valid JSON.\n### VALID JSON (NO PREAMBLE):`,
      },
    ],
  });

  const raw = completion.choices[0].message.content ?? "[]";
  const jsonMatch = raw.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (!jsonMatch) throw new Error("Could not parse job JSON from LLM response.");
  const parsed = JSON.parse(jsonMatch[0]);
  return Array.isArray(parsed) ? parsed : [parsed];
}

async function writeMail(
  job: object,
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
        content: `### JOB DESCRIPTION:\n${JSON.stringify(job)}\n\n### INSTRUCTION:\nYou are ${yourName}, a freelancer/contractor reaching out to a company that posted a job.\nWrite a professional B2B outreach email to the hiring team for the role described.\nThe goal is to offer to fulfill their needs as a service/contractor (solution-focused), not to apply for a job.\n\nAbout you:\n- Your core skills: ${skillsLine}.\n- You can deliver the work by scoping requirements, building the solution, and handing it off cleanly.\n- Your contact email is ${yourEmail}.\n\nWriting guidelines:\n- Keep it concise and professional: max 4 short paragraphs.\n- Be specific about how your skills map to the job responsibilities described.\n- Mention exactly 1-2 relevant capabilities/projects (draw from the provided skills) to build credibility.\n- Close with a practical CTA: ask for a brief 10–15 minute call to align on scope, timeline, and next steps.\n- No subject line. No preamble or extra text outside the email body.\n\n### EMAIL (NO PREAMBLE):`,
      },
    ],
  });
  return completion.choices[0].message.content ?? "";
}

export async function POST(req: NextRequest) {
  try {
    const { url, your_name, your_email, skills } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
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

    const pageText = await scrapeUrl(url);
    const jobs = await extractJobs(pageText);

    if (!jobs.length) {
      return NextResponse.json({ error: "No jobs were extracted from the provided URL." }, { status: 422 });
    }

    const job = jobs[0];
    const email = await writeMail(job, your_name, your_email, skillsArray);

    return NextResponse.json({ email });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
