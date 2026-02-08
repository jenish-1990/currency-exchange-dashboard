from rest_framework import serializers

from dashboard.models import ExchangeRate


class ExchangeRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExchangeRate
        fields = ['date', 'base_currency', 'target_currency', 'rate']
