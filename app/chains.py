import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path="C:/Users/tehme/Downloads/Cold-Email-Generator-master/Cold-Email-Generator-master/.env")

print("KEY LOADED:", os.getenv("GROQ_API_KEY"))

from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.exceptions import OutputParserException
class Chain:
    def __init__(self):
        self.llm = ChatGroq(
        temperature=0,
        model_name="llama-3.3-70b-versatile"
)

    def extract_jobs(self, cleaned_text):
        prompt_extract = PromptTemplate.from_template(
            """
            ### SCRAPED TEXT FROM WEBSITE:
            {page_data}
            ### INSTRUCTION:
            The scraped text is from the career's page of a website.
            Your job is to extract the job postings and return them in JSON format containing the following keys: `role`, `experience`, `skills` and `description`.
            Only return the valid JSON.
            ### VALID JSON (NO PREAMBLE):
            """
        )
        chain_extract = prompt_extract | self.llm
        res = chain_extract.invoke(input={"page_data": cleaned_text})
        try:
            json_parser = JsonOutputParser()
            res = json_parser.parse(res.content)
        except OutputParserException:
            raise OutputParserException("Context too big. Unable to parse jobs.")
        return res if isinstance(res, list) else [res]

    def write_mail(self, job, links):
        prompt_email = PromptTemplate.from_template(
            """
            ### JOB DESCRIPTION:
            {job_description}

            ### INSTRUCTION:
            You are Quratulain Nayeem, a B.E. Computer Science (AI & ML) student at Muffakham Jah College of Engineering and Technology (MJCET), Hyderabad.
            You are writing a cold email to the hiring team of the company above, expressing your interest in an internship opportunity related to the role described.

            About you:
            - You have hands-on experience building AI/ML projects using LangChain, LLaMA 3.3, ChromaDB, BERTopic, Streamlit, FastAPI, and RAG pipelines.
            - You are confident, technically grounded, and genuinely interested in contributing to real-world problems.
            - Your email is quratulainnayeem@gmail.com.

            Writing guidelines:
            - Keep the email concise and professional — no more than 4 short paragraphs.
            - Sound confident, not desperate. You are reaching out because the role genuinely aligns with your work.
            - Naturally mention 1-2 of your most relevant projects or skills that match the job description — do not list everything.
            - If the following portfolio links are relevant to the role, include 1-2 of them naturally: {link_list}
            - End with a clear, low-pressure call to action (e.g., offering to share more details or schedule a brief call).
            - Do not include a subject line. Do not include any preamble or explanation outside the email body.

            ### EMAIL (NO PREAMBLE):

            """
        )
        chain_email = prompt_email | self.llm
        res = chain_email.invoke({"job_description": str(job), "link_list": links})
        return res.content


    def write_internship_mail(self, company_name, role, company_context, why_company, links):
        prompt_internship = PromptTemplate.from_template(
            """
            ### CONTEXT:
            Company: {company_name}
            Role applied for: {role}
            About the company (scraped from their site): {company_context}
            Why this company (from applicant, optional): {why_company}
            Relevant portfolio links: {link_list}

            ### INSTRUCTION:
            You are Quratulain Nayeem, a B.E. Computer Science (AI & ML) student at Muffakham Jah College of Engineering and Technology (MJCET), Hyderabad.
            Write a cold internship outreach email to the hiring team at {company_name} for the {role} role.

            About you:
            - Built projects using LangChain, LLaMA 3.3, ChromaDB, BERTopic, Streamlit, FastAPI, and RAG pipelines.
            - Technically grounded, outcome-focused, genuinely interested — not just applying everywhere.

            Hard rules:
            - Maximum 150 words. Count carefully. Do not exceed this.
            - Address the hiring team at {company_name} by name in the opening line.
            - If company_context is available, reference what {company_name} actually does in 1 sentence — make it specific, not generic.
            - If why_company is provided and non-trivial, weave it in naturally — do not paste it verbatim.
            - Mention exactly 1 or 2 portfolio projects/skills most relevant to this role. Pick from the links provided if relevant; otherwise reference the skill by name.
            - Tone: confident, direct, zero desperation. No phrases like "I would love the opportunity", "I am a quick learner", or "I believe I would be a great fit".
            - Close with exactly this line (no variation): Happy to share more — quratulainnayeem@gmail.com
            - No subject line. No preamble. No sign-off label (no "Best regards" or "Sincerely"). Just the email body ending with the CTA line above.

            ### EMAIL (NO PREAMBLE):

            """
        )
        chain_internship = prompt_internship | self.llm
        res = chain_internship.invoke({
            "company_name": company_name,
            "role": role,
            "company_context": company_context if company_context else "Not provided.",
            "why_company": why_company if why_company else "Not provided.",
            "link_list": links if links else "No links provided.",
        })
        return res.content


if __name__ == "__main__":
    print(os.getenv("GROQ_API_KEY"))