from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from rest_framework import serializers
from users.models import User

class ChangePasswordSerializer(serializers.Serializer):

    password = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    password2 = serializers.CharField(required=True, write_only=True)

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError("Passwords must match")
        return data

    def update(self, instance, validated_data):
        instance.set_password(validated_data["password"])
        instance.save()
        return instance

class UserCreationSerializer(serializers.ModelSerializer):

    password2 = serializers.CharField(write_only=True, label="Confirm Password")

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "password",
            "password2",
            "email"
        ]
        extra_kwargs = {
            "email": {"required": True},
            "password": {"write_only": True},
            "password2": {"write_only": True}
        }

    def validate(self, data):
        validated_data = super().validate(data)
        if validated_data["password"] != validated_data["password2"]:
            raise serializers.ValidationError("Passwords must match")
        return validated_data

    def validate_username(self, username):
        if username.strip() == "":
            raise serializers.ValidationError("Username cannot be empty")
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError("Username already exists")
        return username

    def validate_email(self, email):
        if email.strip() == "":
            raise serializers.ValidationError("Email cannot be empty")
        try:
            validate_email(email)
        except ValidationError:
            raise serializers.ValidationError("Invalid email format")
        return email

    def create(self, validated_data):
        validated_data.pop("password2", None)
        user = User.objects.create_user(**validated_data)
        return user

    def validate_password(self, password):
        validate_password(password=password)
        return password

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "color_id"
        ]
        read_only_fields = ["id"]

class UpdateUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "email", "color_id"]