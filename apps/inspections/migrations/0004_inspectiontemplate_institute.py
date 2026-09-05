# New migration — adds InspectionTemplate.institute (Part: template-per-institute).
#
# Nullable/blank so existing templates (created before this field existed)
# don't break — they'll show as "general" until assigned an institute.

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inspections', '0003_historicalinspectionreport_distance_from_site_meters_and_more'),
        ('registry', '0002_flatten_scheme_hierarchy'),
    ]

    operations = [
        migrations.AddField(
            model_name='inspectiontemplate',
            name='institute',
            field=models.ForeignKey(
                blank=True,
                null=True,
                help_text='The institute/NGO this checklist was built for. Leave blank only for a shared/general template.',
                on_delete=django.db.models.deletion.CASCADE,
                related_name='inspection_templates',
                to='registry.institute',
            ),
        ),
    ]
