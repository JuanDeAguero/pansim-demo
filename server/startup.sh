if [ -d "venv" ] || [ -d ".venv" ]; then
    echo "Skip creating venv"
else
    # Create a virtual environment named ".venv"
    python3 -m venv .venv
    echo "Virtual environment created."
fi

# Activate the virtual environment
source .venv/bin/activate
python3 -m pip install -r requirements.txt
python3 ./manage.py makemigrations
python3 ./manage.py migrate
python3 ./manage.py collectstatic
