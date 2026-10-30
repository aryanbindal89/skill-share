from django.contrib import admin
from .models import LearningActivity, LearningRequest, Profile, Roadmap, RoadmapTask, Skill, SkillCategory, UserSkill

admin.site.register([Profile, SkillCategory, Skill, UserSkill, LearningRequest, Roadmap, RoadmapTask, LearningActivity])
