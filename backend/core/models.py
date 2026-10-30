from django.conf import settings
from django.db import models


class Profile(models.Model):
    LEVELS = [("beginner", "Beginner"), ("intermediate", "Intermediate"), ("advanced", "Advanced")]
    FORMATS = [("in-person", "In person"), ("video", "Video call"), ("async", "Async")]
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    display_name = models.CharField(max_length=80, blank=True)
    bio = models.CharField(max_length=280, blank=True)
    experience_level = models.CharField(max_length=20, choices=LEVELS, default="beginner")
    learning_goal = models.CharField(max_length=180, blank=True)
    interests = models.JSONField(default=list, blank=True)
    preferred_formats = models.JSONField(default=list, blank=True)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.display_name or self.user.username


class SkillCategory(models.Model):
    name = models.CharField(max_length=60, unique=True)
    slug = models.SlugField(unique=True)
    def __str__(self): return self.name


class Skill(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(unique=True)
    category = models.ForeignKey(SkillCategory, on_delete=models.PROTECT, related_name="skills")
    description = models.CharField(max_length=240, blank=True)
    def __str__(self): return self.name


class UserSkill(models.Model):
    DIRECTIONS = [("teach", "Can teach"), ("learn", "Wants to learn"), ("both", "Both")]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="skills")
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE, related_name="learners")
    direction = models.CharField(max_length=10, choices=DIRECTIONS)
    level = models.CharField(max_length=20, choices=Profile.LEVELS, default="beginner")
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "skill", "direction"], name="unique_user_skill_direction")]


class LearningRequest(models.Model):
    STATUSES = [("pending", "Pending"), ("accepted", "Accepted"), ("completed", "Completed"), ("declined", "Declined"), ("cancelled", "Cancelled")]
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_learning_requests")
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="received_learning_requests")
    skill = models.ForeignKey(Skill, on_delete=models.PROTECT, related_name="learning_requests")
    topic = models.CharField(max_length=120)
    message = models.CharField(max_length=500, blank=True)
    suggested_at = models.DateTimeField()
    status = models.CharField(max_length=12, choices=STATUSES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ["suggested_at", "-created_at"]


class Roadmap(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="roadmaps")
    title = models.CharField(max_length=140)
    target = models.CharField(max_length=140)
    current_level = models.CharField(max_length=20, choices=Profile.LEVELS, default="beginner")
    hours_per_week = models.PositiveSmallIntegerField(default=4)
    learning_style = models.CharField(max_length=40, blank=True)
    target_weeks = models.PositiveSmallIntegerField(default=8)
    known_skills = models.JSONField(default=list, blank=True)
    areas_of_interest = models.JSONField(default=list, blank=True)
    generated_by = models.CharField(max_length=20, default="fallback")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ["-updated_at"]


class RoadmapTask(models.Model):
    roadmap = models.ForeignKey(Roadmap, on_delete=models.CASCADE, related_name="tasks")
    phase = models.CharField(max_length=80)
    title = models.CharField(max_length=160)
    description = models.CharField(max_length=500, blank=True)
    project = models.CharField(max_length=160, blank=True)
    prerequisites = models.JSONField(default=list, blank=True)
    estimated_hours = models.PositiveSmallIntegerField(default=2)
    order = models.PositiveSmallIntegerField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True)
    class Meta:
        ordering = ["order", "id"]


class LearningActivity(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="learning_activities")
    task = models.ForeignKey(RoadmapTask, on_delete=models.CASCADE, null=True, blank=True, related_name="activities")
    skill = models.ForeignKey(Skill, on_delete=models.SET_NULL, null=True, blank=True, related_name="learning_activities")
    kind = models.CharField(max_length=40, default="task_completed")
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ["-created_at"]
