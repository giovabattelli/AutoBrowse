#!/bin/bash
source .venv/bin/activate
uvicorn app.server:app --reload 