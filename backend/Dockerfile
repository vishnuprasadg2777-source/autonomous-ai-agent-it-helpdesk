FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .

# Install CPU-only PyTorch first to avoid NVIDIA/CUDA packages.
RUN pip install --no-cache-dir \
    --index-url https://download.pytorch.org/whl/cpu \
    torch==2.6.0+cpu

# Install the remaining application dependencies.
RUN pip install --no-cache-dir -r requirements.txt

# Preserve the backend package structure expected by the application imports.
COPY app ./backend/app

RUN mkdir -p /app/backend/.data/chroma

EXPOSE 8000

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]