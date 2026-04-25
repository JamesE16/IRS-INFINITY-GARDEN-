from django.db import models

class RoomType(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    capacity = models.IntegerField()

    def __str__(self):
        return self.name

class Facility(models.Model):
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)

    @property
    def availability_status(self):
        # Assume some complex logic here to determine availability
        return 'Available' if self.is_active else 'Not Available'

    def __str__(self):
        return self.name

class Guest(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Reservation(models.Model):
    guest = models.ForeignKey(Guest, on_delete=models.CASCADE)
    room_type = models.ForeignKey(RoomType, on_delete=models.CASCADE)
    check_in_date = models.DateField()
    check_out_date = models.DateField()

    def check_availability(self):
        # Logic to check availability in real-time
        pass

    def __str__(self):
        return f"Reservation for {self.guest} from {self.check_in_date} to {self.check_out_date}"