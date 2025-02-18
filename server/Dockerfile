FROM --platform=linux/amd64 python:3.12-alpine

RUN apk update \
    && apk add --virtual build-deps gcc python3-dev musl-dev \
    && apk add gcc musl-dev mariadb-connector-c-dev \
    && apk add pkgconfig postgresql-dev libffi-dev openssl-dev libxml2-dev libxslt-dev \
    && apk add mariadb-dev curl

# Set up working directory
WORKDIR /morpop
COPY requirements.txt /morpop/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy the current directory contents into the container at /morpop
COPY . /morpop/
EXPOSE 80
CMD ["gunicorn", "-b", "0.0.0.0:80", "--timeout", "600", "-c", "morpop/gunicorn_config.py", "morpop.wsgi", "--reload"]