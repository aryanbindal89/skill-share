from datetime import timedelta
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email
from django.db import transaction
from django.db.models import Count, Q
from django.http import JsonResponse
from django.utils import timezone
from django.utils.text import slugify
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.utils.decorators import method_decorator
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView
from .ai import generate_tasks
from .models import LearningActivity, LearningRequest, Profile, Roadmap, RoadmapTask, Skill, SkillCategory, UserSkill
from .serializers import LearningRequestSerializer, ProfileSerializer, RoadmapSerializer, SkillCategorySerializer, SkillSerializer, StudentSerializer

User = get_user_model()


@ensure_csrf_cookie
def csrf(request):
    return JsonResponse({"detail": "CSRF cookie set"})


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    @method_decorator(csrf_protect)
    def post(self, request):
        username = str(request.data.get("username", "")).strip()
        email = str(request.data.get("email", "")).strip().lower()
        password = request.data.get("password", "")
        if len(username) < 3 or len(username) > 30:
            return Response({"username": ["Use a username between 3 and 30 characters."]}, status=400)
        if not username.replace("_", "").replace("-", "").isalnum():
            return Response({"username": ["Use letters, numbers, underscores or hyphens only."]}, status=400)
        try:
            validate_email(email)
        except DjangoValidationError:
            return Response({"email": ["Enter a valid email address."]}, status=400)
        if User.objects.filter(username__iexact=username).exists():
            return Response({"username": ["That username is already taken."]}, status=400)
        if User.objects.filter(email__iexact=email).exists():
            return Response({"email": ["An account with this email already exists."]}, status=400)
        user = User(username=username, email=email)
        try:
            from django.contrib.auth.password_validation import validate_password
            validate_password(password, user)
        except Exception as exc:
            return Response({"password": list(getattr(exc, "messages", ["Choose a stronger password."]))}, status=400)
        user.set_password(password)
        user.save()
        Profile.objects.get_or_create(user=user)
        login(request, user)
        return Response({"id": user.id, "username": user.username, "email": user.email}, status=201)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    @method_decorator(csrf_protect)
    def post(self, request):
        identity = str(request.data.get("username", "")).strip()
        password = request.data.get("password", "")
        username = User.objects.filter(email__iexact=identity).values_list("username", flat=True).first() if "@" in identity else identity
        user = authenticate(request, username=username, password=password)
        if not user:
            return Response({"detail": "The username/email or password is incorrect."}, status=400)
        login(request, user)
        return Response({"id": user.id, "username": user.username, "email": user.email})


class LogoutView(APIView):
    @method_decorator(csrf_protect)
    def post(self, request):
        logout(request)
        return Response({"detail": "Signed out."})


class CurrentUserView(APIView):
    def get(self, request):
        return Response({"id": request.user.id, "username": request.user.username, "email": request.user.email})


class MyProfileView(APIView):
    def get(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        return Response(ProfileSerializer(profile).data)

    @transaction.atomic
    def patch(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        allowed = {key: request.data[key] for key in ["display_name", "bio", "experience_level", "learning_goal", "interests", "preferred_formats", "is_public"] if key in request.data}
        serializer = ProfileSerializer(profile, data=allowed, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        if "skills" in request.data:
            skills = request.data["skills"]
            if not isinstance(skills, list) or len(skills) > 40:
                raise ValidationError({"skills": "Provide a list with at most 40 skills."})
            UserSkill.objects.filter(user=request.user).delete()
            for item in skills:
                if not isinstance(item, dict): continue
                name = str(item.get("skill_name", item.get("name", ""))).strip()[:80]
                if not name: continue
                category_name = str(item.get("category", "Other")).strip()[:60] or "Other"
                category, _ = SkillCategory.objects.get_or_create(name=category_name, defaults={"slug": slugify(category_name)[:60]})
                skill, _ = Skill.objects.get_or_create(name=name, defaults={"slug": slugify(name)[:70], "category": category})
                direction = item.get("direction", "teach")
                level = item.get("level", "beginner")
                if direction in {"teach", "learn", "both"} and level in {"beginner", "intermediate", "advanced"}:
                    UserSkill.objects.get_or_create(user=request.user, skill=skill, direction=direction, defaults={"level": level})
        return Response(ProfileSerializer(profile).data)


class CategoryListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = SkillCategory.objects.annotate(skill_count=Count("skills")).order_by("name")
    serializer_class = SkillCategorySerializer
    pagination_class = None


class SkillListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = SkillSerializer
    pagination_class = None
    def get_queryset(self):
        qs = Skill.objects.select_related("category").annotate(
            teachers_count=Count("learners", filter=Q(learners__direction__in=["teach", "both"], learners__user__profile__is_public=True), distinct=True),
            learners_count=Count("learners", filter=Q(learners__direction__in=["learn", "both"], learners__user__profile__is_public=True), distinct=True),
        ).order_by("category__name", "name")
        query = self.request.query_params.get("q", "").strip()
        category = self.request.query_params.get("category", "").strip()
        if query: qs = qs.filter(Q(name__icontains=query) | Q(description__icontains=query) | Q(category__name__icontains=query))
        if category: qs = qs.filter(Q(category__slug__iexact=category) | Q(category__name__iexact=category))
        return qs


class StudentListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = StudentSerializer
    def get_queryset(self):
        qs = Profile.objects.filter(is_public=True).exclude(user=self.request.user if self.request.user.is_authenticated else None).select_related("user").prefetch_related("user__skills__skill__category").order_by("display_name", "user__username")
        q = self.request.query_params.get("q", "").strip()
        skill = self.request.query_params.get("skill", "").strip()
        category = self.request.query_params.get("category", "").strip()
        level = self.request.query_params.get("level", "").strip()
        direction = self.request.query_params.get("direction", "teach").strip()
        if q: qs = qs.filter(Q(display_name__icontains=q) | Q(bio__icontains=q) | Q(learning_goal__icontains=q) | Q(user__skills__skill__name__icontains=q)).distinct()
        if skill: qs = qs.filter(user__skills__skill__slug__iexact=skill)
        if category: qs = qs.filter(user__skills__skill__category__slug__iexact=category)
        if level: qs = qs.filter(user__skills__level=level)
        if direction in ["teach", "learn"]: qs = qs.filter(user__skills__direction__in=[direction, "both"])
        return qs.distinct()


class StudentDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = StudentSerializer
    lookup_field = "user_id"
    def get_queryset(self): return Profile.objects.filter(is_public=True).select_related("user").prefetch_related("user__skills__skill__category")


class LearningRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = LearningRequestSerializer
    def get_queryset(self):
        return LearningRequest.objects.filter(Q(sender=self.request.user) | Q(recipient=self.request.user)).select_related("sender__profile", "recipient__profile", "skill")
    def perform_create(self, serializer):
        recipient_id = self.request.data.get("recipient")
        recipient = User.objects.filter(id=recipient_id).first()
        skill = serializer.validated_data["skill"]
        suggested_at = serializer.validated_data["suggested_at"]
        if recipient is None or recipient == self.request.user: raise ValidationError({"recipient": "Choose another student."})
        if not Profile.objects.filter(user=recipient, is_public=True).exists(): raise ValidationError({"recipient": "This student is unavailable."})
        if suggested_at <= timezone.now(): raise ValidationError({"suggested_at": "Choose a future date and time."})
        if not UserSkill.objects.filter(user=recipient, skill=skill, direction__in=["teach", "both"]).exists():
            raise ValidationError({"skill": "This student is not currently offering that skill."})
        serializer.save(sender=self.request.user, recipient=recipient)


class LearningRequestDetailView(APIView):
    def patch(self, request, pk):
        item = LearningRequest.objects.filter(pk=pk).first()
        if not item: return Response({"detail": "Request not found."}, status=404)
        next_status = request.data.get("status")
        if next_status == "completed":
            if item.status != "accepted": raise ValidationError({"status": "Only an accepted session can be marked attended."})
            if request.user.id not in [item.sender_id, item.recipient_id]: raise PermissionDenied("Only session participants can mark attendance.")
            if item.suggested_at > timezone.now(): raise ValidationError({"status": "This session is still in the future."})
            item.status = "completed"
            item.save(update_fields=["status", "updated_at"])
            for participant in [item.sender, item.recipient]:
                LearningActivity.objects.create(user=participant, kind="session_completed", skill=item.skill)
            return Response(LearningRequestSerializer(item).data)
        if item.status != "pending": raise ValidationError({"status": "Only pending requests can be updated."})
        if next_status in ["accepted", "declined"]:
            if item.recipient_id != request.user.id: raise PermissionDenied("Only the recipient can respond to this request.")
            if next_status == "accepted" and item.suggested_at <= timezone.now(): raise ValidationError({"suggested_at": "This suggested time has passed. Ask for a new time."})
        elif next_status == "cancelled":
            if item.sender_id != request.user.id: raise PermissionDenied("Only the sender can cancel this request.")
        else: raise ValidationError({"status": "Choose accepted, declined, or cancelled."})
        item.status = next_status
        item.save(update_fields=["status", "updated_at"])
        return Response(LearningRequestSerializer(item).data)


class SessionListView(generics.ListAPIView):
    serializer_class = LearningRequestSerializer
    def get_queryset(self):
        return LearningRequest.objects.filter(status__in=["accepted", "completed"]).filter(Q(sender=self.request.user) | Q(recipient=self.request.user)).select_related("sender__profile", "recipient__profile", "skill").order_by("suggested_at")


class RoadmapListView(generics.ListAPIView):
    serializer_class = RoadmapSerializer
    def get_queryset(self): return Roadmap.objects.filter(user=self.request.user).prefetch_related("tasks")


class RoadmapDetailView(APIView):
    def get_object(self, request, pk): return Roadmap.objects.filter(pk=pk, user=request.user).prefetch_related("tasks").first()
    def get(self, request, pk):
        roadmap = self.get_object(request, pk)
        if not roadmap: return Response({"detail": "Roadmap not found."}, status=404)
        return Response(RoadmapSerializer(roadmap).data)
    def patch(self, request, pk):
        roadmap = self.get_object(request, pk)
        if not roadmap: return Response({"detail": "Roadmap not found."}, status=404)
        allowed = {key: request.data[key] for key in ["title", "target", "current_level", "hours_per_week", "learning_style", "target_weeks"] if key in request.data}
        serializer = RoadmapSerializer(roadmap, data=allowed, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(RoadmapSerializer(roadmap).data)
    def delete(self, request, pk):
        roadmap = self.get_object(request, pk)
        if not roadmap: return Response({"detail": "Roadmap not found."}, status=404)
        roadmap.delete()
        return Response(status=204)


class GenerateRoadmapView(APIView):
    @transaction.atomic
    def post(self, request):
        data = request.data
        target = str(data.get("target", "")).strip()
        if len(target) < 2 or len(target) > 140: raise ValidationError({"target": "Enter a goal between 2 and 140 characters."})
        level = data.get("current_level", "beginner")
        if level not in ["beginner", "intermediate", "advanced"]: raise ValidationError({"current_level": "Choose a valid experience level."})
        try: hours = int(data.get("hours_per_week", 4)); weeks = int(data.get("target_weeks", 8))
        except (TypeError, ValueError): raise ValidationError({"detail": "Hours and target weeks must be whole numbers."})
        if not 1 <= hours <= 40: raise ValidationError({"hours_per_week": "Choose between 1 and 40 hours per week."})
        if not 1 <= weeks <= 52: raise ValidationError({"target_weeks": "Choose a target between 1 and 52 weeks."})
        known = data.get("known_skills", [])
        interests = data.get("areas_of_interest", [])
        if not isinstance(known, list) or not isinstance(interests, list): raise ValidationError({"detail": "Known skills and interests must be lists."})
        clean = {"target": target, "current_level": level, "hours_per_week": hours, "target_weeks": weeks,
                 "learning_style": str(data.get("learning_style", "")).strip()[:40],
                 "known_skills": [str(x)[:80] for x in known[:20]], "areas_of_interest": [str(x)[:80] for x in interests[:20]]}
        tasks, provider = generate_tasks(clean)
        roadmap = Roadmap.objects.create(user=request.user, title=f"{target} roadmap", target=target, current_level=level,
            hours_per_week=hours, target_weeks=weeks, learning_style=clean["learning_style"], known_skills=clean["known_skills"],
            areas_of_interest=clean["areas_of_interest"], generated_by=provider)
        phases_seen = {}
        for index, task in enumerate(tasks, start=1):
            phase = task["phase"]
            phases_seen[phase] = phases_seen.get(phase, 0) + 1
            RoadmapTask.objects.create(roadmap=roadmap, order=index, **task)
        return Response(RoadmapSerializer(roadmap).data, status=201)


class RoadmapTaskDetailView(APIView):
    def patch(self, request, roadmap_id, task_id):
        task = RoadmapTask.objects.filter(id=task_id, roadmap_id=roadmap_id, roadmap__user=request.user).first()
        if not task: return Response({"detail": "Task not found."}, status=404)
        completed = request.data.get("completed")
        if not isinstance(completed, bool): raise ValidationError({"completed": "Send true or false."})
        was_complete = bool(task.completed_at)
        task.completed_at = timezone.now() if completed else None
        task.save(update_fields=["completed_at"])
        if completed and not was_complete: LearningActivity.objects.create(user=request.user, task=task, kind="task_completed")
        return Response(RoadmapTaskDetailResponse(task))


def RoadmapTaskDetailResponse(task):
    from .serializers import RoadmapTaskSerializer
    return RoadmapTaskSerializer(task).data


class ProgressView(APIView):
    def get(self, request):
        tasks = RoadmapTask.objects.filter(roadmap__user=request.user)
        completed = tasks.filter(completed_at__isnull=False).count()
        total = tasks.count()
        sessions = LearningRequest.objects.filter(Q(sender=request.user) | Q(recipient=request.user), status="completed").count()
        timestamps = LearningActivity.objects.filter(user=request.user).order_by("-created_at").values_list("created_at", flat=True)[:1000]
        dates = sorted({timezone.localtime(moment).date() for moment in timestamps}, reverse=True)
        streak, day = 0, timezone.localdate()
        if dates and dates[0] == day - timedelta(days=1): day -= timedelta(days=1)
        while day in dates:
            streak += 1
            day -= timedelta(days=1)
        skill_ids = LearningActivity.objects.filter(user=request.user, kind__in=["skill_practiced", "session_completed"], skill__isnull=False).values_list("skill_id", flat=True).distinct()
        skills_practiced = list(Skill.objects.filter(id__in=skill_ids).values_list("name", flat=True)[:12])
        return Response({"completed_tasks": completed, "total_tasks": total, "remaining_tasks": max(0, total-completed),
            "progress": round(completed * 100 / total) if total else 0, "sessions_attended": sessions, "current_streak": streak,
            "skills_practiced": skills_practiced, "recent_activity": list(LearningActivity.objects.filter(user=request.user).select_related("task", "skill")[:8].values("id", "kind", "created_at", "task__title", "skill__name"))})


class PracticeLogView(APIView):
    def post(self, request):
        name = str(request.data.get("skill", "")).strip()[:80]
        if not name: raise ValidationError({"skill": "Add a skill or topic to record what you practiced."})
        skill = Skill.objects.filter(name__iexact=name).first()
        if not skill:
            category, _ = SkillCategory.objects.get_or_create(name="Other", defaults={"slug": "other"})
            skill, _ = Skill.objects.get_or_create(name=name, defaults={"slug": slugify(name)[:70], "category": category})
        LearningActivity.objects.create(user=request.user, kind="skill_practiced", skill=skill)
        return Response({"detail": "Practice recorded.", "skill": skill.name}, status=201)
