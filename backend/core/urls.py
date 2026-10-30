from django.urls import path
from . import views

urlpatterns = [
    path("csrf/", views.csrf, name="csrf"),
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path("auth/login/", views.LoginView.as_view(), name="login"),
    path("auth/logout/", views.LogoutView.as_view(), name="logout"),
    path("auth/me/", views.CurrentUserView.as_view(), name="current-user"),
    path("profile/me/", views.MyProfileView.as_view(), name="my-profile"),
    path("skills/categories/", views.CategoryListView.as_view(), name="categories"),
    path("skills/", views.SkillListView.as_view(), name="skills"),
    path("students/", views.StudentListView.as_view(), name="students"),
    path("students/<int:user_id>/", views.StudentDetailView.as_view(), name="student-detail"),
    path("learning-requests/", views.LearningRequestListCreateView.as_view(), name="learning-requests"),
    path("learning-requests/<int:pk>/", views.LearningRequestDetailView.as_view(), name="learning-request-detail"),
    path("sessions/", views.SessionListView.as_view(), name="sessions"),
    path("roadmaps/", views.RoadmapListView.as_view(), name="roadmaps"),
    path("roadmaps/generate/", views.GenerateRoadmapView.as_view(), name="generate-roadmap"),
    path("roadmaps/<int:pk>/", views.RoadmapDetailView.as_view(), name="roadmap-detail"),
    path("roadmaps/<int:roadmap_id>/tasks/<int:task_id>/", views.RoadmapTaskDetailView.as_view(), name="roadmap-task-detail"),
    path("progress/", views.ProgressView.as_view(), name="progress"),
    path("progress/practice/", views.PracticeLogView.as_view(), name="progress-practice"),
]
