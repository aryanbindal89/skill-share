from django.db import migrations
from django.utils.text import slugify


CATALOG = {
    "Web development": ("web-development", "Build responsive interfaces and useful web projects."),
    "Programming": ("programming", "Learn to think with code and create practical tools."),
    "Design": ("design", "Explore visual communication and user-centered design."),
    "Data science": ("data-science", "Find patterns, ask better questions, and tell stories with data."),
    "Cybersecurity": ("cybersecurity", "Understand and improve the safety of digital systems."),
    "Communication": ("communication", "Practice expressing ideas clearly and listening well."),
    "Problem solving": ("problem-solving", "Build confidence breaking down and exploring challenges."),
}
SKILLS = [
    ("Web development", "Web development", "Practice creating modern websites."),
    ("HTML & CSS", "Web development", "Structure pages and style responsive interfaces."),
    ("JavaScript", "Web development", "Add useful behavior and interactivity to websites."),
    ("React", "Web development", "Compose interactive interfaces from reusable components."),
    ("Python", "Programming", "Learn a versatile language through practical projects."),
    ("Java", "Programming", "Explore object-oriented programming and application design."),
    ("TypeScript", "Programming", "Make JavaScript projects easier to understand and maintain."),
    ("UI / UX design", "Design", "Understand people and design clearer digital experiences."),
    ("Figma", "Design", "Explore collaborative interface design and prototyping."),
    ("Visual design", "Design", "Practice layout, type, color, and visual communication."),
    ("Data science", "Data science", "Explore data, form questions, and interpret patterns."),
    ("Data analysis", "Data science", "Clean and summarize data to answer practical questions."),
    ("Machine learning", "Data science", "Learn how models find patterns and where they can fail."),
    ("Cybersecurity", "Cybersecurity", "Understand safe practices and digital security basics."),
    ("Communication", "Communication", "Practice clear explanations and active listening."),
    ("Public speaking", "Communication", "Build confidence sharing ideas with a group."),
    ("Technical writing", "Communication", "Make technical ideas clear and useful to others."),
    ("Problem solving", "Problem solving", "Break problems down and test possible approaches."),
]


def seed_catalog(apps, schema_editor):
    Category = apps.get_model("core", "SkillCategory")
    Skill = apps.get_model("core", "Skill")
    categories = {}
    for name, (slug, _) in CATALOG.items():
        category, _ = Category.objects.get_or_create(name=name, defaults={"slug": slug})
        categories[name] = category
    for name, category_name, description in SKILLS:
        Skill.objects.get_or_create(name=name, defaults={
            "slug": slugify(name)[:50], "category_id": categories[category_name].id,
            "description": description,
        })


class Migration(migrations.Migration):
    dependencies = [("core", "0001_initial")]
    operations = [migrations.RunPython(seed_catalog, migrations.RunPython.noop)]
