from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify
from core.models import Profile, Skill, SkillCategory, UserSkill

User = get_user_model()


class Command(BaseCommand):
    help = "Create explicitly labeled demo learner accounts. Run only for a demo environment."

    def add_arguments(self, parser):
        parser.add_argument("--password", required=True, help="Shared password for the demo accounts (at least 12 characters).")

    def handle(self, *args, **options):
        password = options["password"]
        if len(password) < 12:
            raise CommandError("The demo password must be at least 12 characters.")
        catalog = [
            ("Web development", "web-development", "Build responsive interfaces and useful web projects."),
            ("Programming", "programming", "Learn to think with code and create practical tools."),
            ("Design", "design", "Explore visual communication and user-centered design."),
            ("Data science", "data-science", "Find patterns, ask better questions, and tell stories with data."),
            ("Cybersecurity", "cybersecurity", "Learn to understand and improve the safety of digital systems."),
            ("Communication", "communication", "Practice expressing ideas clearly and listening well."),
            ("Problem solving", "problem-solving", "Build confidence in breaking down and exploring hard problems."),
        ]
        categories = {name: SkillCategory.objects.get_or_create(name=name, defaults={"slug": slug})[0] for name, slug, _ in catalog}
        skills = {}
        skill_data = [
            ("Web development", "Web development", "web-development"), ("Python", "Programming", "python"),
            ("Java", "Programming", "java"), ("UI / UX design", "Design", "ui-ux-design"),
            ("Data science", "Data science", "data-science"), ("Cybersecurity", "Cybersecurity", "cybersecurity"),
            ("Communication", "Communication", "communication"), ("Problem solving", "Problem solving", "problem-solving"),
        ]
        for name, category_name, _ in skill_data:
            skills[name] = Skill.objects.get_or_create(name=name, defaults={"slug": slugify(name), "category": categories[category_name]})[0]
        learners = [
            ("demo_mentor", "Demo learner · Alex Rivera", "Happy to work through Python and web projects together.", "Share Python and build a web app", "intermediate", [("Python", "teach"), ("Web development", "teach"), ("UI / UX design", "learn")]),
            ("demo_designer", "Demo learner · Jamie Chen", "Learning by sketching, prototyping, and asking better questions.", "Make interfaces easier to use", "intermediate", [("UI / UX design", "teach"), ("Communication", "both"), ("Web development", "learn")]),
            ("demo_builder", "Demo learner · Sam Patel", "I like breaking challenges into small experiments.", "Explore practical data projects", "beginner", [("Problem solving", "teach"), ("Data science", "learn"), ("Python", "learn")]),
            ("demo_learner", "Demo learner · Taylor Morgan", "Building confidence one small project at a time.", "Find a steady place to start with security", "beginner", [("Cybersecurity", "learn"), ("Communication", "teach")]),
        ]
        for username, display_name, bio, goal, level, entries in learners:
            user, created = User.objects.get_or_create(username=username, defaults={"email": f"{username}@example.invalid"})
            user.email = f"{username}@example.invalid"
            user.set_password(password)
            user.save()
            profile, _ = Profile.objects.get_or_create(user=user)
            profile.display_name, profile.bio, profile.learning_goal, profile.experience_level = display_name, bio, goal, level
            profile.interests = ["Building things", "Peer learning"]
            profile.preferred_formats = ["video", "async"]
            profile.is_public = True
            profile.save()
            for skill_name, direction in entries:
                UserSkill.objects.get_or_create(user=user, skill=skills[skill_name], direction=direction, defaults={"level": level})
        self.stdout.write(self.style.SUCCESS("Created or refreshed 4 clearly labeled demo learner accounts and the starter skill catalog."))
