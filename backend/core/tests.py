from datetime import timedelta
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from .models import LearningActivity, LearningRequest, Profile, Roadmap, RoadmapTask, Skill, SkillCategory, UserSkill

User = get_user_model()


class SkillShareApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.alex = User.objects.create_user(username="alex_test", email="alex@example.test", password="a-long-test-password-42")
        self.jules = User.objects.create_user(username="jules_test", email="jules@example.test", password="another-long-test-password-42")
        self.alex_profile = Profile.objects.create(user=self.alex, display_name="Alex Test", is_public=True)
        self.jules_profile = Profile.objects.create(user=self.jules, display_name="Jules Test", is_public=True)
        category, _ = SkillCategory.objects.get_or_create(name="Programming", defaults={"slug": "programming"})
        self.python, _ = Skill.objects.get_or_create(name="Python", defaults={"slug": "python", "category": category})
        UserSkill.objects.create(user=self.alex, skill=self.python, direction="teach", level="intermediate")
        UserSkill.objects.create(user=self.jules, skill=self.python, direction="teach", level="advanced")

    def test_registration_requires_csrf_and_creates_hashed_user_and_profile(self):
        client = APIClient(enforce_csrf_checks=True)
        response = client.post("/api/auth/register/", {"username": "new_learner", "email": "learner@example.test", "password": "Difficult-local-password-2026!"}, format="json")
        self.assertEqual(response.status_code, 403)
        client.get("/api/csrf/")
        token = client.cookies["csrftoken"].value
        response = client.post("/api/auth/register/", {"username": "new_learner", "email": "learner@example.test", "password": "Difficult-local-password-2026!"}, format="json", HTTP_X_CSRFTOKEN=token)
        self.assertEqual(response.status_code, 201)
        user = User.objects.get(username="new_learner")
        self.assertNotEqual(user.password, "Difficult-local-password-2026!")
        self.assertTrue(user.check_password("Difficult-local-password-2026!"))
        self.assertTrue(Profile.objects.filter(user=user).exists())
        self.assertIn("sessionid", client.cookies)

    def test_private_profiles_do_not_appear_until_owner_opts_in(self):
        hidden = User.objects.create_user(username="private_test", password="a-long-test-password-42")
        Profile.objects.create(user=hidden, display_name="Private learner", is_public=False)
        result = self.client.get("/api/students/?direction=learn")
        self.assertEqual(result.status_code, 200)
        self.assertNotIn("private_test", {row["username"] for row in result.data["results"]})
        self.client.force_authenticate(hidden)
        profile = self.client.patch("/api/profile/me/", {"display_name": "Private learner", "is_public": True, "skills": [{"skill_name": "Python", "category": "Programming", "direction": "learn", "level": "beginner"}]}, format="json")
        self.assertEqual(profile.status_code, 200)
        self.assertTrue(profile.data["is_public"])
        self.assertEqual(len(profile.data["skills"]), 1)
        self.client.force_authenticate(None)
        result = self.client.get("/api/students/?direction=learn")
        self.assertIn("private_test", {row["username"] for row in result.data["results"]})

    @patch.dict("os.environ", {"AI_API_KEY": ""})
    def test_roadmap_generation_fallback_persistence_progress_and_ownership(self):
        self.client.force_authenticate(self.alex)
        response = self.client.post("/api/roadmaps/generate/", {"target": "Build a small web app", "current_level": "beginner", "hours_per_week": 4, "target_weeks": 8, "known_skills": ["HTML"]}, format="json")
        self.assertEqual(response.status_code, 201)
        roadmap = Roadmap.objects.get(id=response.data["id"], user=self.alex)
        self.assertEqual(roadmap.generated_by, "fallback")
        self.assertGreaterEqual(roadmap.tasks.count(), 3)
        task = roadmap.tasks.first()
        response = self.client.patch(f"/api/roadmaps/{roadmap.id}/tasks/{task.id}/", {"completed": True}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(LearningActivity.objects.filter(user=self.alex, task=task).count(), 1)
        progress = self.client.get("/api/progress/")
        self.assertEqual(progress.data["completed_tasks"], 1)
        self.client.force_authenticate(self.jules)
        hidden = self.client.get(f"/api/roadmaps/{roadmap.id}/")
        self.assertEqual(hidden.status_code, 404)
        other_task = self.client.patch(f"/api/roadmaps/{roadmap.id}/tasks/{task.id}/", {"completed": False}, format="json")
        self.assertEqual(other_task.status_code, 404)

    def test_request_permissions_acceptance_attendance_and_progress(self):
        self.client.force_authenticate(self.alex)
        suggested = timezone.now() + timedelta(days=3)
        created = self.client.post("/api/learning-requests/", {"recipient": self.jules.id, "skill": self.python.id, "topic": "Python basics", "message": "Could we explore lists?", "suggested_at": suggested.isoformat()}, format="json")
        self.assertEqual(created.status_code, 201)
        request_id = created.data["id"]
        denied = self.client.patch(f"/api/learning-requests/{request_id}/", {"status": "accepted"}, format="json")
        self.assertEqual(denied.status_code, 403)
        self.client.force_authenticate(self.jules)
        accepted = self.client.patch(f"/api/learning-requests/{request_id}/", {"status": "accepted"}, format="json")
        self.assertEqual(accepted.status_code, 200)
        self.assertEqual(accepted.data["status"], "accepted")
        LearningRequest.objects.filter(id=request_id).update(suggested_at=timezone.now() - timedelta(minutes=2))
        self.client.force_authenticate(self.alex)
        completed = self.client.patch(f"/api/learning-requests/{request_id}/", {"status": "completed"}, format="json")
        self.assertEqual(completed.status_code, 200)
        self.assertEqual(completed.data["status"], "completed")
        progress = self.client.get("/api/progress/")
        self.assertEqual(progress.data["sessions_attended"], 1)
        self.assertEqual(progress.data["skills_practiced"], ["Python"])

    def test_practice_log_only_counts_user_recorded_practice(self):
        self.client.force_authenticate(self.alex)
        before = self.client.get("/api/progress/")
        self.assertEqual(before.data["skills_practiced"], [])
        response = self.client.post("/api/progress/practice/", {"skill": "Public speaking"}, format="json")
        self.assertEqual(response.status_code, 201)
        after = self.client.get("/api/progress/")
        self.assertEqual(after.data["skills_practiced"], ["Public speaking"])
        self.assertEqual(after.data["current_streak"], 1)
