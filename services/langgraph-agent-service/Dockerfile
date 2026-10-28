# LOCAL-DEV ONLY (B1-6): runs as root with no non-root user. Do not carry
# to a real deploy unchanged — production uses a non-root user, real
# credentials from env, and no host-exposed Postgres (see README).
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
