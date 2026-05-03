# Use a minimal Python image to serve static files
FROM python:3.12-slim

WORKDIR /app

# Copy landing page files into the container
COPY . /app

# Expose port 80 for the static site
EXPOSE 80

# Serve the site using Python's built-in HTTP server
CMD ["python", "-m", "http.server", "80"]
