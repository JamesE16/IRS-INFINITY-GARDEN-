"""
WSGI config for resortapi project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resortapi.settings')

application = get_wsgi_application()
