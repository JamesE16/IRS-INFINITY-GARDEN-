from django.core.management.base import BaseCommand
from resortapi.core.models import Facility, RoomType


def build_catalog():
    catalog = [
        {
            "external_id": "r1",
            "type": "Room",
            "name": "Barkada Room",
            "description": "Budget-friendly accommodation designed for groups of friends",
            "capacity": 10,
            "price": 4400,
            "amenities": ["Free WiFi", "Air Conditioning", "Smart TV", "Complimentary Breakfast"],
            "image_url": "https://i.pinimg.com/1200x/84/31/61/843161a9b42ceab4db5a3a4998d4793e.jpg",
        },
        {
            "external_id": "r2",
            "type": "Room",
            "name": "Family Room",
            "description": "Spacious accommodation designed for families.",
            "capacity": 6,
            "price": 3100,
            "amenities": ["Free WiFi", "Air Conditioning", "Smart TV", "Complimentary Breakfast"],
            "image_url": "https://i.pinimg.com/1200x/5c/69/e8/5c69e81a6cd615c5cf8a0bf17596abec.jpg",
        },
        {
            "external_id": "r3",
            "type": "Room",
            "name": "Couple Room",
            "description": "Perfect for couples seeking a romantic retreat.",
            "capacity": 2,
            "price": 2000,
            "amenities": ["Free WiFi", "Air Conditioning", "Complimentary Breakfast"],
            "image_url": "https://i.pinimg.com/736x/79/ba/46/79ba463c09cae3f2543c6b237a11f8d8.jpg",
        },
        {
            "external_id": "r4",
            "type": "Room",
            "name": "Family Deluxe",
            "description": "Ideal for extended stays and families.",
            "capacity": 11,
            "price": 600,
            "amenities": ["Free WiFi", "Air Conditioning"],
            "image_url": "https://www.everestboutiquehotel.com/public/uploads/super-deluxe-twin-view.jpg",
        },
    ]

    for i in range(25):
        catalog.append(
            {
                "external_id": f"c{i + 1}",
                "type": "Cottage",
                "name": "Garden Cottage" if i < 15 else "Poolside Cottage",
                "description": "Comfortable cottage perfect for relaxation.",
                "capacity": 4,
                "price": 600 if i < 15 else 500,
                "amenities": ["Free WiFi"],
                "image_url": (
                    "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1a/ed/cd/b1/outdoor-private-seating.jpg"
                    if i < 15
                    else "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0e/75/5e/5a/treebo-grand-emerald.jpg"
                ),
            }
        )

    catalog.extend(
        [
            {
                "external_id": "g1",
                "type": "Gazebo",
                "name": "Gazebo 1",
                "description": "An open-air architectural retreat designed for relaxation and refined social gatherings.",
                "capacity": 30,
                "price": 1500,
                "amenities": ["Free WiFi"],
                "image_url": "https://media-cdn.tripadvisor.com/media/photo-s/0c/00/de/5c/restaurante.jpg",
            },
            {
                "external_id": "g2",
                "type": "Gazebo",
                "name": "Gazebo 2",
                "description": "A sophisticated outdoor gazebo for celebrations and ceremonies",
                "capacity": 50,
                "price": 1800,
                "amenities": ["Free WiFi"],
                "image_url": "https://th.bing.com/th/id/OIP.wNnDOnoN_L-pYuZXW_XNegHaEL?o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3",
            },
            {
                "external_id": "p1",
                "type": "Pavilion",
                "name": "Pavilion Villa",
                "description": "Experience ultimate privacy and serenity.",
                "capacity": 10,
                "price": 10000,
                "amenities": [
                    "Free WiFi",
                    "Air Conditioning",
                    "Mini Bar",
                    "Coffee Maker",
                    "Safe",
                    "Smart TV",
                    "Outdoor Shower",
                ],
                "image_url": "https://pix10.agoda.net/property/70084816/0/180e22cb12091bc581fa82f6da32c2c2.jpeg?ce=2&s=1024x768",
            },
            {
                "external_id": "p2",
                "type": "Pavilion",
                "name": "Event",
                "description": "A versatile and elegant venue designed to host a variety of occasions",
                "capacity": 50,
                "price": 12000,
                "amenities": ["Free WiFi", "Air Conditioning"],
                "image_url": "https://thevendry.com/cdn-cgi/image/height=1920,width=1920,fit=contain,metadata=none/https://s3.us-east-1.amazonaws.com/uploads.thevendry.co/36211/1733407787744_74119393_XL.jpg",
            },
        ]
    )

    return catalog


class Command(BaseCommand):
    help = "Create or update backend facilities so they match the frontend room catalog."

    def handle(self, *args, **options):
        created = 0
        updated = 0

        for entry in build_catalog():
            room_type, _ = RoomType.objects.get_or_create(name=entry["type"])
            facility, was_created = Facility.objects.update_or_create(
                external_id=entry["external_id"],
                defaults={
                    "name": entry["name"],
                    "room_type": room_type,
                    "capacity": entry["capacity"],
                    "price": entry["price"],
                    "description": entry["description"],
                    "amenities": entry["amenities"],
                    "image_url": entry["image_url"],
                    "is_active": True,
                },
            )

            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Catalog sync complete. Created {created} facilities, updated {updated} facilities."
            )
        )
