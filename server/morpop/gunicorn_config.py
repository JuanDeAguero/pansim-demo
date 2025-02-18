import os

bind = os.environ.get("GUNICORN_BIND", "0.0.0.0:8000")
workers = os.environ.get("GUNICORN_WORKER_COUNT", 3)