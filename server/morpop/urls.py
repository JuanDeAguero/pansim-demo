from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include
from django.urls import path
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

info = openapi.Info(title="Morpop API", default_version="v1", description="Test description",
    terms_of_service="https://www.google.com/policies/terms/",
    contact=openapi.Contact(email="contact@snippets.local"),
    license=openapi.License(name="BSD License"))

schema_view = get_schema_view(info, public=True, permission_classes=(permissions.AllowAny))

urlpatterns = [
    path("admin/", admin.site.urls),
    path("job-config/", include("job_configuration.urls", namespace="job_configuration")),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("required-file/", include("required_file.urls", namespace="required_file")),
    path("simulations/", include("simulation.urls", namespace="simulation")),
    path("swagger<format>/", schema_view.without_ui(cache_timeout=0), name="schema-json"),
    path("swagger/", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
    path("redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
    path("job/", include("job.urls", namespace="job")),
    path("users/", include("users.urls", namespace="users"))
]