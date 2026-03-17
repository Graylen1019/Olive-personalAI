FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# 1. Install system libs for Postgres
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 2. THE SECRET SAUCE: Install CPU-only Torch first
# This bypasses the 2GB+ NVIDIA/CUDA download
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# 3. Now install the rest of your list
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["watchfiles", "python main.py"]