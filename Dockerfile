# Use official Python image
FROM python:3.12-slim

# Prevent Python from writing pyc files
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory inside container
WORKDIR /app

# Copy requirements first (for Docker layer caching later)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Run the app with Uvicorn
CMD ["uvicorn", "SelfyAPI.main:app", "--host", "0.0.0.0", "--port", "8000"]