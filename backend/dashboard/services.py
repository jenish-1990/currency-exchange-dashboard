from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal

import requests

from dashboard.models import ExchangeRate


FRANKFURTER_BASE = 'https://api.frankfurter.dev/v1'


class FrankfurterError(Exception):
    pass


def fetch_exchange_rates(base, symbols, start_date, end_date):
    symbol_list = [s.strip() for s in symbols.split(',')]
    today = date.today()
    end = date.fromisoformat(end_date)

    cached = ExchangeRate.objects.filter(
        base_currency=base,
        target_currency__in=symbol_list,
        date__gte=start_date,
        date__lte=end_date,
    )

    cached_symbols = set(cached.values_list('target_currency', flat=True).distinct())
    has_cache = cached_symbols >= set(symbol_list) and cached.exists()

    if has_cache:
        max_cached = cached.order_by('-date').values_list('date', flat=True).first()

        if end < today or max_cached >= today:
            return _rows_to_response(cached)

        fetch_start = str(max_cached + timedelta(days=1))
    else:
        fetch_start = start_date

    try:
        resp = requests.get(
            f'{FRANKFURTER_BASE}/{fetch_start}..{end_date}',
            params={'base': base, 'symbols': symbols},
            timeout=10,
        )
        resp.raise_for_status()
    except requests.RequestException:
        if has_cache:
            return _rows_to_response(cached)
        raise FrankfurterError('Could not fetch rates from Frankfurter API')

    rates_by_date = resp.json().get('rates', {})

    rows_to_save = [
        ExchangeRate(
            date=date_str,
            base_currency=base,
            target_currency=currency,
            rate=Decimal(str(rate)),
        )
        for date_str, rates in rates_by_date.items()
        for currency, rate in rates.items()
    ]

    if rows_to_save:
        ExchangeRate.objects.bulk_create(
            rows_to_save,
            update_conflicts=True,
            unique_fields=['date', 'base_currency', 'target_currency'],
            update_fields=['rate'],
        )

    all_rows = ExchangeRate.objects.filter(
        base_currency=base,
        target_currency__in=symbol_list,
        date__gte=start_date,
        date__lte=end_date,
    ).order_by('date')

    return _rows_to_response(all_rows)


def _rows_to_response(rows):
    grouped = defaultdict(lambda: {'rates': {}})
    for row in rows:
        key = str(row.date)
        grouped[key]['date'] = key
        grouped[key]['base'] = row.base_currency
        grouped[key]['rates'][row.target_currency] = float(row.rate)

    return [grouped[k] for k in sorted(grouped)]
