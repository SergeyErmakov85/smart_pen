# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend application's code into the container at /app
COPY . .

# Command to run the application using Gunicorn
# Gunicorn is a production-ready WSGI server.
# We bind to 0.0.0.0 to allow traffic from outside the container.
# The server will run on port 8000.
# We specify the Uvicorn worker class for FastAPI compatibility.
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "server:app"]
