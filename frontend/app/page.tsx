"use client";

import { useState } from "react";

// Use the built-in Next.js API routes (same origin).

type Mode = "job" | "internship";

interface JobForm {
  url: string;
}

interface InternshipForm {
  company_name: string;
  company_url: string;
  role: string;
  why_company: string;
}

function LoadingDots() {
  return (
    <div className="flex flex-col items-center gap-4 py-10">
      <div className="flex items-center gap-2">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
      <p className="text-sm tracking-widest uppercase" style={{ color: "#D1BC54" }}>
        Crafting your email...
      </p>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
      style={{
        background: copied ? "#123E11" : "#1a1a1a",
        color: copied ? "#D1BC54" : "#999",
        border: `1px solid ${copied ? "#D1BC54" : "#2a2a2a"}`,
      }}
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="#D1BC54" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="4" y="4" width="7" height="7" rx="1" stroke="#999" strokeWidth="1.2" />
            <path d="M3 8H2a1 1 0 01-1-1V2a1 1 0 011-1h5a1 1 0 011 1v1" stroke="#999" strokeWidth="1.2" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("job");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [yourName, setYourName] = useState("");
  const [yourEmail, setYourEmail] = useState("");
  const [skillsCsv, setSkillsCsv] = useState("");

  const [jobForm, setJobForm] = useState<JobForm>({ url: "" });
  const [internshipForm, setInternshipForm] = useState<InternshipForm>({
    company_name: "",
    company_url: "",
    role: "",
    why_company: "",
  });

  const handleGenerate = async () => {
    setEmail("");
    setError("");
    setLoading(true);

    try {
      let res: Response;

      if (mode === "job") {
        res = await fetch(`/api/generate-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: jobForm.url,
            your_name: yourName,
            your_email: yourEmail,
            skills: skillsCsv,
          }),
        });
      } else {
        res = await fetch(`/api/generate-internship-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...internshipForm,
            your_name: yourName,
            your_email: yourEmail,
            skills: skillsCsv,
          }),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data?.detail?.error ?? data?.detail ?? "Something went wrong.");
      } else {
        setEmail(data.email);
      }
    } catch {
      setError("Could not reach the API. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const isDisabled =
    loading ||
    !yourName.trim() ||
    !yourEmail.trim() ||
    !skillsCsv.trim() ||
    (mode === "job" && !jobForm.url.trim()) ||
    (mode === "internship" && (!internshipForm.company_name.trim() || !internshipForm.role.trim()));

  return (
    <>
      {/* Animated background */}
      <div className="mesh-bg" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="pt-14 pb-6 text-center px-4">
          <h1
            className="text-4xl sm:text-5xl font-bold tracking-tight"
            style={{ color: "#D1BC54" }}
          >
            Cold Email Generator
          </h1>
          <p className="mt-2 text-sm sm:text-base text-neutral-400 tracking-wide">
            Hyper-personalized outreach powered by LLaMA 3.3
          </p>
        </header>

        {/* Main card */}
        <main className="flex-1 flex flex-col items-center px-4 pb-16">
          <div
            className="w-full max-w-2xl rounded-2xl p-6 sm:p-8"
            style={{
              background: "rgba(15,15,15,0.85)",
              border: "1px solid #1f1f1f",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Mode toggle */}
            <div
              className="flex gap-1 p-1 rounded-full mb-8 w-fit mx-auto"
              style={{ background: "#111", border: "1px solid #222" }}
            >
              {(["job", "internship"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setEmail(""); setError(""); }}
                  className="px-5 py-2 rounded-full text-sm font-medium transition-all duration-200"
                  style={{
                    background: mode === m ? "#D1BC54" : "transparent",
                    color: mode === m ? "#0a0a0a" : "#888",
                  }}
                >
                  {m === "job" ? "Job Posting" : "Internship Outreach"}
                </button>
              ))}
            </div>

            {/* Job Posting Form */}
            {mode === "job" && (
              <div className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                    Job Posting URL
                  </span>
                  <input
                    type="url"
                    placeholder="https://jobs.company.com/role/12345"
                    value={jobForm.url}
                    onChange={(e) => setJobForm({ url: e.target.value })}
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all"
                    style={{
                      background: "#111",
                      border: "1px solid #2a2a2a",
                      color: "#e5e5e5",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#D1BC54")}
                    onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
                  />
                </label>
              </div>
            )}

            {/* Internship Form */}
            {mode === "internship" && (
              <div className="flex flex-col gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                      Company Name <span style={{ color: "#D1BC54" }}>*</span>
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Google DeepMind"
                      value={internshipForm.company_name}
                      onChange={(e) => setInternshipForm((f) => ({ ...f, company_name: e.target.value }))}
                      className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all"
                      style={{ background: "#111", border: "1px solid #2a2a2a", color: "#e5e5e5" }}
                      onFocus={(e) => (e.target.style.borderColor = "#D1BC54")}
                      onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                      Role <span style={{ color: "#D1BC54" }}>*</span>
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. ML Engineering Intern"
                      value={internshipForm.role}
                      onChange={(e) => setInternshipForm((f) => ({ ...f, role: e.target.value }))}
                      className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all"
                      style={{ background: "#111", border: "1px solid #2a2a2a", color: "#e5e5e5" }}
                      onFocus={(e) => (e.target.style.borderColor = "#D1BC54")}
                      onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                    Company Website URL
                  </span>
                  <input
                    type="url"
                    placeholder="https://deepmind.google"
                    value={internshipForm.company_url}
                    onChange={(e) => setInternshipForm((f) => ({ ...f, company_url: e.target.value }))}
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all"
                    style={{ background: "#111", border: "1px solid #2a2a2a", color: "#e5e5e5" }}
                    onFocus={(e) => (e.target.style.borderColor = "#D1BC54")}
                    onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                    Why this company?{" "}
                    <span className="normal-case text-neutral-600">(optional)</span>
                  </span>
                  <textarea
                    rows={3}
                    placeholder="What genuinely excites you about this company or role..."
                    value={internshipForm.why_company}
                    onChange={(e) => setInternshipForm((f) => ({ ...f, why_company: e.target.value }))}
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none resize-none transition-all"
                    style={{ background: "#111", border: "1px solid #2a2a2a", color: "#e5e5e5" }}
                    onFocus={(e) => (e.target.style.borderColor = "#D1BC54")}
                    onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
                  />
                </label>
              </div>
            )}

            {/* Applicant details (shared) */}
            <div className="flex flex-col gap-4 mt-2">
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                    Your Name <span style={{ color: "#D1BC54" }}>*</span>
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Alex Johnson"
                    value={yourName}
                    onChange={(e) => setYourName(e.target.value)}
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all"
                    style={{ background: "#111", border: "1px solid #2a2a2a", color: "#e5e5e5" }}
                    onFocus={(e) => (e.target.style.borderColor = "#D1BC54")}
                    onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                    Your Email <span style={{ color: "#D1BC54" }}>*</span>
                  </span>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={yourEmail}
                    onChange={(e) => setYourEmail(e.target.value)}
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all"
                    style={{ background: "#111", border: "1px solid #2a2a2a", color: "#e5e5e5" }}
                    onFocus={(e) => (e.target.style.borderColor = "#D1BC54")}
                    onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                  Your Skills <span style={{ color: "#D1BC54" }}>*</span>
                </span>
                <input
                  type="text"
                  placeholder="e.g. LangChain, LLaMA, Python, RAG"
                  value={skillsCsv}
                  onChange={(e) => setSkillsCsv(e.target.value)}
                  className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all"
                  style={{ background: "#111", border: "1px solid #2a2a2a", color: "#e5e5e5" }}
                  onFocus={(e) => (e.target.style.borderColor = "#D1BC54")}
                  onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
                />
              </label>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={isDisabled}
              className="mt-6 w-full py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200"
              style={{
                background: isDisabled ? "#1a1a1a" : "#D1BC54",
                color: isDisabled ? "#444" : "#0a0a0a",
                cursor: isDisabled ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Generating..." : "Generate Email"}
            </button>

            {/* Loading */}
            {loading && <LoadingDots />}

            {/* Error */}
            {error && !loading && (
              <div
                className="mt-6 rounded-xl px-4 py-3 text-sm"
                style={{ background: "#1a0000", border: "1px solid #3a1010", color: "#f87171" }}
              >
                {error}
              </div>
            )}

            {/* Output */}
            {email && !loading && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: "#D1BC54" }}
                  >
                    Generated Email
                  </span>
                  <CopyButton text={email} />
                </div>
                <pre
                  className="rounded-xl px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap overflow-auto"
                  style={{
                    background: "#0d0d0d",
                    border: "1px solid #1f1f1f",
                    color: "#d4d4d4",
                    fontFamily: "'Space Grotesk', sans-serif",
                    maxHeight: "480px",
                  }}
                >
                  {email}
                </pre>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center pb-8 text-xs text-neutral-600">
          <div className="flex flex-col items-center gap-2">
            <div>
              Built by{" "}
              <a
                href="https://github.com/quratulain-nayeem"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors duration-200 hover:text-neutral-300"
                style={{ color: "#D1BC54" }}
              >
                Quratulain Nayeem
              </a>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="https://www.linkedin.com/in/quratulain-nayeem/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="inline-flex items-center justify-center rounded-md p-2 transition-all duration-200"
                style={{
                  background: "#111",
                  border: "1px solid #222",
                  color: "#D1BC54",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M6.5 9.5V18.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M6.5 6.5C6.5 7.32843 5.82843 8 5 8C4.17157 8 3.5 7.32843 3.5 6.5C3.5 5.67157 4.17157 5 5 5C5.82843 5 6.5 5.67157 6.5 6.5Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M10.5 18.5V12.8C10.5 10.903 11.403 9.8 13 9.8C14.597 9.8 15.5 10.903 15.5 12.8V18.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18.5 18.5V12.5C18.5 10.5 17.3 9.5 15.6 9.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>

              <a
                href="https://github.com/quratulain-nayeem"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="inline-flex items-center justify-center rounded-md p-2 transition-all duration-200"
                style={{
                  background: "#111",
                  border: "1px solid #222",
                  color: "#D1BC54",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.02C2 16.465 4.865 20.234 8.839 21.436C9.339 21.526 9.523 21.221 9.523 20.962C9.523 20.709 9.514 20.162 9.511 19.399C6.792 20.01 6.229 17.779 6.229 17.779C5.793 16.68 5.201 16.403 5.201 16.403C4.34 15.818 5.265 15.828 5.265 15.828C6.2 15.91 6.651 16.83 6.651 16.83C7.487 18.308 8.863 17.858 9.407 17.623C9.492 17.036 9.738 16.615 10.031 16.356C7.847 16.106 5.56 15.253 5.56 11.11C5.56 9.935 5.985 8.984 6.68 8.243C6.568 7.987 6.209 6.84 6.785 5.297C6.785 5.297 7.643 5.027 9.499 6.244C10.286 5.999 11.133 5.877 12 5.873C12.867 5.877 13.714 5.999 14.501 6.244C16.356 5.027 17.215 5.297 17.215 5.297C17.79 6.84 17.432 7.987 17.319 8.243C18.015 8.984 18.44 9.935 18.44 11.11C18.44 15.265 16.145 16.104 13.954 16.351C14.318 16.67 14.64 17.264 14.64 18.162C14.64 19.467 14.63 20.555 14.63 20.962C14.63 21.223 14.812 21.53 15.317 21.435C19.289 20.231 22.152 16.464 22.152 12.02C22.152 6.484 17.672 2 12 2Z"
                  />
                </svg>
              </a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
