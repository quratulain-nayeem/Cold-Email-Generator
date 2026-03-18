import streamlit as st
from langchain_community.document_loaders import WebBaseLoader

from chains import Chain
from portfolio import Portfolio
from utils import clean_text
from dotenv import load_dotenv
import os

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")



def create_streamlit_app(llm, portfolio, clean_text):
    st.title("📧 Cold Mail Generator")

    mode = st.radio(
        "Select Mode",
        ["Job Posting URL Mode", "Internship Mode"],
        horizontal=True,
    )

    st.divider()

    if mode == "Job Posting URL Mode":
        url_input = st.text_input("Enter a URL:", value="https://job-boards.greenhouse.io/udacity/jobs/8215988002")
        submit_button = st.button("Submit")

        if submit_button:
            try:
                loader = WebBaseLoader([url_input])
                data = clean_text(loader.load().pop().page_content)
                portfolio.load_portfolio()
                jobs = llm.extract_jobs(data)
                for job in jobs:
                    skills = job.get('skills', [])
                    links = portfolio.query_links(skills)
                    email = llm.write_mail(job, links)
                    st.code(email, language='markdown')
            except Exception as e:
                st.error(f"An Error Occurred: {e}")

    else:  # Internship Mode
        company_name = st.text_input("Company Name")
        company_url = st.text_input("Company Website URL")
        role = st.text_input("Role you are applying for")
        why_company = st.text_area("Why this company? (optional)")
        generate_button = st.button("Generate Email")

        if generate_button:
            if not company_name or not role:
                st.warning("Please fill in at least the Company Name and Role.")
            else:
                company_context = ""
                if company_url:
                    try:
                        with st.spinner("Fetching company page..."):
                            loader = WebBaseLoader([company_url])
                            raw = clean_text(loader.load().pop().page_content)
                            company_context = raw[:2000]
                    except Exception:
                        company_context = ""

                try:
                    portfolio.load_portfolio()
                    links = portfolio.query_links([role])
                    email = llm.write_internship_mail(
                        company_name=company_name,
                        role=role,
                        company_context=company_context,
                        why_company=why_company,
                        links=links,
                    )
                    st.code(email, language='markdown')
                except Exception as e:
                    st.error(f"An Error Occurred: {e}")


if __name__ == "__main__":
    chain = Chain()
    portfolio = Portfolio()
    st.set_page_config(layout="wide", page_title="Cold Email Generator", page_icon="📧")
    create_streamlit_app(chain, portfolio, clean_text)

