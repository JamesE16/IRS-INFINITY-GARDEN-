from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'resortapi.core'

    def ready(self):
        import resortapi.core.signals  # noqa: F401
