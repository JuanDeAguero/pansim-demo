from django.urls import path
from users.views import ChangePassword
from users.views import CreateUser
from users.views import ListUsers
from users.views import RetrieveOrUpdateOrDestroyUser
from users.views import UpdateUser
from users.views import ViewUser

app_name = "users"

urlpatterns = [
    path("register", CreateUser.as_view(), name="user-create"),
    path("profile", RetrieveOrUpdateOrDestroyUser.as_view(), name="user-profile"),
    path("<int:pk>", ViewUser.as_view(), name="user-detail"),
    path("profile/password/change", ChangePassword.as_view(), name="user-change-password"),
    path("list/", ListUsers.as_view(), name="user-list"),
    path("profile/update", UpdateUser.as_view(), name="user-update")
]