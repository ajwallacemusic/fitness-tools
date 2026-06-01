set shell := ["bash", "-cu"]

# install deps
install:
    uv sync

# run the API locally
run:
    uv run uvicorn api.main:app --reload --port 8000

# run tests
test:
    uv run pytest

# build container
build:
    docker build -t fitness-tools-api .

# deploy to Cloud Run (requires gcloud auth + project set)
deploy project region="us-central1":
    gcloud run deploy fitness-tools-api \
      --source . --project {{project}} --region {{region}} \
      --allow-unauthenticated --min-instances 0
