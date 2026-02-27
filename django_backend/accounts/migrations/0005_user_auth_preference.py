from django.db import migrations, models


def set_auth_preference_from_password_hash(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    User.objects.filter(password_hash="").update(auth_preference="OTP")
    User.objects.exclude(password_hash="").update(auth_preference="PASSWORD")


def reverse_auth_preference_to_password(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    User.objects.all().update(auth_preference="PASSWORD")


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0004_alter_emailotp_purpose"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="auth_preference",
            field=models.CharField(
                choices=[("PASSWORD", "Password"), ("OTP", "OTP")],
                default="PASSWORD",
                max_length=16,
            ),
        ),
        migrations.RunPython(
            set_auth_preference_from_password_hash,
            reverse_auth_preference_to_password,
        ),
    ]
