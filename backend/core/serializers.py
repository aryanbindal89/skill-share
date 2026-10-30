from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import LearningRequest, Profile, Roadmap, RoadmapTask, Skill, SkillCategory, UserSkill

User = get_user_model()


class SkillCategorySerializer(serializers.ModelSerializer):
    skill_count = serializers.IntegerField(read_only=True)
    class Meta: model = SkillCategory; fields = ["id", "name", "slug", "skill_count"]


class SkillSerializer(serializers.ModelSerializer):
    category = SkillCategorySerializer(read_only=True)
    teachers_count = serializers.SerializerMethodField()
    learners_count = serializers.SerializerMethodField()
    class Meta: model = Skill; fields = ["id", "name", "slug", "category", "description", "teachers_count", "learners_count"]
    def get_teachers_count(self, obj):
        if hasattr(obj, "teachers_count"): return obj.teachers_count
        return obj.learners.filter(direction__in=["teach", "both"], user__profile__is_public=True).count()
    def get_learners_count(self, obj):
        if hasattr(obj, "learners_count"): return obj.learners_count
        return obj.learners.filter(direction__in=["learn", "both"], user__profile__is_public=True).count()


class UserSkillSerializer(serializers.ModelSerializer):
    skill = SkillSerializer(read_only=True)
    skill_id = serializers.PrimaryKeyRelatedField(queryset=Skill.objects.all(), source="skill", write_only=True, required=False)
    skill_name = serializers.CharField(write_only=True, required=False, allow_blank=False, max_length=80)
    category = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=60)
    class Meta: model = UserSkill; fields = ["id", "skill", "skill_id", "skill_name", "category", "direction", "level"]
    def validate(self, attrs):
        if not attrs.get("skill") and not attrs.get("skill_name"):
            raise serializers.ValidationError({"skill_name": "Choose a skill or enter a skill name."})
        return attrs


class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    skills = UserSkillSerializer(source="user.skills", many=True, read_only=True)
    class Meta:
        model = Profile
        fields = ["id", "username", "display_name", "bio", "experience_level", "learning_goal", "interests", "preferred_formats", "is_public", "skills", "created_at", "updated_at"]
    def validate_interests(self, value):
        if not isinstance(value, list) or len(value) > 30 or not all(isinstance(item, str) for item in value):
            raise serializers.ValidationError("Choose up to 30 text interests.")
        return [item.strip()[:80] for item in value if item.strip()]
    def validate_preferred_formats(self, value):
        allowed = {"in-person", "video", "async"}
        if not isinstance(value, list) or len(value) > 3 or not all(item in allowed for item in value):
            raise serializers.ValidationError("Choose from in person, video, or async learning formats.")
        return value


class StudentSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    skills = UserSkillSerializer(source="user.skills", many=True, read_only=True)
    class Meta:
        model = Profile
        fields = ["id", "user_id", "username", "display_name", "bio", "experience_level", "learning_goal", "interests", "preferred_formats", "skills"]


class RoadmapTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoadmapTask
        fields = ["id", "phase", "title", "description", "project", "prerequisites", "estimated_hours", "order", "completed_at"]
        read_only_fields = ["id", "phase", "title", "description", "project", "prerequisites", "estimated_hours", "order"]


class RoadmapSerializer(serializers.ModelSerializer):
    tasks = RoadmapTaskSerializer(many=True, read_only=True)
    progress = serializers.SerializerMethodField()
    completed_tasks = serializers.SerializerMethodField()
    total_tasks = serializers.SerializerMethodField()
    class Meta:
        model = Roadmap
        fields = ["id", "title", "target", "current_level", "hours_per_week", "learning_style", "target_weeks", "known_skills", "areas_of_interest", "generated_by", "created_at", "updated_at", "tasks", "progress", "completed_tasks", "total_tasks"]
        read_only_fields = ["id", "generated_by", "created_at", "updated_at", "tasks", "progress", "completed_tasks", "total_tasks"]
    def get_total_tasks(self, obj): return obj.tasks.count()
    def get_completed_tasks(self, obj): return obj.tasks.filter(completed_at__isnull=False).count()
    def get_progress(self, obj):
        total = obj.tasks.count()
        return round(obj.tasks.filter(completed_at__isnull=False).count() * 100 / total) if total else 0


class LearningRequestSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    recipient_name = serializers.SerializerMethodField()
    skill_name = serializers.CharField(source="skill.name", read_only=True)
    class Meta:
        model = LearningRequest
        fields = ["id", "sender", "sender_name", "recipient", "recipient_name", "skill", "skill_name", "topic", "message", "suggested_at", "status", "created_at", "updated_at"]
        read_only_fields = ["id", "sender", "sender_name", "recipient_name", "skill_name", "status", "created_at", "updated_at"]
    def get_sender_name(self, obj):
        profile = getattr(obj.sender, "profile", None)
        return (profile.display_name or obj.sender.username) if profile else obj.sender.username
    def get_recipient_name(self, obj):
        profile = getattr(obj.recipient, "profile", None)
        return (profile.display_name or obj.recipient.username) if profile else obj.recipient.username
