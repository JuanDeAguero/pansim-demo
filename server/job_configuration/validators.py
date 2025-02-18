from django.core.exceptions import ValidationError

def validate_file_extension(value):
    if not value.name.endswith(".txt"):
        raise ValidationError("File type not supported. Only .txt files are allowed.")