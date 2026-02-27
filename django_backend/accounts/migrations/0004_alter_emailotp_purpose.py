from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0003_alter_user_password_hash_emailotp"),
    ]

    operations = [
        migrations.AlterField(
            model_name="emailotp",
            name="purpose",
            field=models.CharField(
                choices=[
                    ("SIGNUP", "Signup"),
                    ("LOGIN", "Login"),
                    ("PASSWORD_RESET", "Password Reset"),
                ],
                max_length=16,
            ),
        ),
    ]
