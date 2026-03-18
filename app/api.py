
from dotenv import load_dotenv
import os
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_community.document_loaders import WebBaseLoader
from dotenv import load_dotenv

import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from chains import Chain
from portfolio import Portfolio
from utils import clean_text

load_dotenv()

app = FastAPI(title="Cold Email Generator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

chain = Chain()
portfolio = Portfolio()


class EmailRequest(BaseModel):
    url: str


class InternshipEmailRequest(BaseModel):
    company_name: str
    company_url: str = ""
    role: str
    why_company: str = ""


@app.post("/generate-email")
def generate_email(request: EmailRequest):
    try:
        loader = WebBaseLoader([request.url])
        data = clean_text(loader.load().pop().page_content)
        portfolio.load_portfolio()
        jobs = chain.extract_jobs(data)
        if not jobs:
            raise HTTPException(status_code=422, detail="No jobs were extracted from the provided URL.")

        job = jobs[0]  # take only first job
        skills = job.get("skills", [])
        links = portfolio.query_links(skills)
        email = chain.write_mail(job, links)

        return {"email": email}
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": str(e)})


@app.post("/generate-internship-email")
def generate_internship_email(request: InternshipEmailRequest):
    company_context = ""
    if request.company_url:
        try:
            loader = WebBaseLoader([request.company_url])
            raw = clean_text(loader.load().pop().page_content)
            company_context = raw[:2000]
        except Exception:
            company_context = ""

    try:
        portfolio.load_portfolio()
        links = portfolio.query_links([request.role])
        email = chain.write_internship_mail(
            company_name=request.company_name,
            role=request.role,
            company_context=company_context,
            why_company=request.why_company,
            links=links,
        )
        return {"email": email}
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": str(e)})
