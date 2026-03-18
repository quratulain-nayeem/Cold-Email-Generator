# Cold Email Generator

A cold email generation tool built with LLaMA 3.3, LangChain, ChromaDB, and Streamlit. Designed for both companies and students.

## Features

- **Job Posting URL Mode** — paste any job posting URL and get a tailored cold email instantly
- **Internship Mode** — enter a company name, role, and website — the tool scrapes the company site for context and generates a hyper-personalized internship outreach email
- **RAG-powered portfolio matching** — automatically pulls the most relevant projects from your portfolio using ChromaDB vector search

## Tech Stack

LLaMA 3.3 via Groq API, LangChain, ChromaDB, Streamlit, WebBaseLoader, Python

## Setup

1. Clone the repo
2. `pip install -r requirements.txt`
3. Add your `GROQ_API_KEY` to a `.env` file
4. `streamlit run app/main.py`

## Upcoming

- **Spam score checker** — flags words likely to hit spam filters before you send
- **Tone analyzer** — paste your existing email, get a rewrite with feedback
- **Multi-template mode** — choose tone (formal / casual / bold)

## Author

Quratulain Nayeem — quratulainnayeem@gmail.com

## License

CC BY-NC 4.0 — Copyright 2026 Quratulain Nayeem
