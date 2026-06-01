FROM python:3.12-slim

WORKDIR /app
COPY pyproject.toml ./
RUN pip install --no-cache-dir fastapi "uvicorn[standard]" "pydantic>=2.7"
COPY fitness_core ./fitness_core
COPY tools ./tools
COPY api ./api

ENV PORT=8080
EXPOSE 8080
CMD ["sh", "-c", "uvicorn api.main:app --host 0.0.0.0 --port ${PORT}"]
