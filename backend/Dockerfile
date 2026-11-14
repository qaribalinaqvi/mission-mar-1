FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /code

# 1. Create the non-root user FIRST (before copying files)
RUN adduser --disabled-password --gecos "" appuser

# 2. Copy and install dependencies
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir -r /code/requirements.txt

# 3. Copy code with ownership assigned in a SINGLE layer (no chown -R duplication!)
COPY --chown=appuser:appuser . /code

USER appuser

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]