from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal

import requests
from django.db.models import Max, Min

from dashboard.models import ExchangeRate


FRANKFURTER_BASE = 'https://api.frankfurter.dev/v1'


class FrankfurterError(Exception):
    pass


def fetch_exchange_rates(base, symbols, start_date, end_date):
    symbol_list = [s.strip() for s in symbols.split(',')]

    cached = ExchangeRate.objects.filter(
        base_currency=base,
        target_currency__in=symbol_list,
        date__gte=start_date,
        date__lte=end_date,
    )

    cached_symbols = set(cached.values_list('target_currency', flat=True).distinct())

    if cached_symbols >= set(symbol_list):
        bounds = cached.aggregate(earliest=Min('date'), latest=Max('date'))
        start = date.fromisoformat(start_date)
        end = date.fromisoformat(end_date)
        today = date.today()

        covers_start = bounds['earliest'] <= start + timedelta(days=3)
        up_to_date = end < today or bounds['latest'] >= today

        if covers_start and up_to_date:
            return _rows_to_response(cached)

    try:
        resp = requests.get(
            f'{FRANKFURTER_BASE}/{start_date}..{end_date}',
            params={'base': base, 'symbols': symbols},
            timeout=10,
        )
        resp.raise_for_status()
    except requests.RequestException:
        if cached.exists():
            return _rows_to_response(cached)
        raise FrankfurterError('Could not fetch rates from Frankfurter API')

    rates_by_date = resp.json().get('rates', {})
    rows = [
        ExchangeRate(
            date=date_str, base_currency=base,
            target_currency=currency, rate=Decimal(str(rate)),
        )
        for date_str, rates in rates_by_date.items()
        for currency, rate in rates.items()
    ]
    if rows:
        ExchangeRate.objects.bulk_create(
            rows, update_conflicts=True,
            unique_fields=['date', 'base_currency', 'target_currency'],
            update_fields=['rate'],
        )

    return _rows_to_response(
        ExchangeRate.objects.filter(
            base_currency=base, target_currency__in=symbol_list,
            date__gte=start_date, date__lte=end_date,
        ).order_by('date')
    )


def _rows_to_response(rows):
    grouped = defaultdict(lambda: {'rates': {}})
    for row in rows:
        key = str(row.date)
        grouped[key]['date'] = key
        grouped[key]['base'] = row.base_currency
        grouped[key]['rates'][row.target_currency] = float(row.rate)

    return [grouped[k] for k in sorted(grouped)]
