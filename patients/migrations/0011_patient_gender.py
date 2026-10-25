from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("patients", "0010_patientmonthlytracker_cash_sessions_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="patient",
            name="gender",
            field=models.CharField(
                max_length=20,
                blank=True,
                default="",
            ),
        ),
    ]
