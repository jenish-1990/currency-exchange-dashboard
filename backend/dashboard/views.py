from datetime import datetime, timedelta

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from dashboard.services import fetch_exchange_rates, FrankfurterError


SUPPORTED_CURRENCIES = {
    'EUR': 'Euro',
    'USD': 'US Dollar',
    'CAD': 'Canadian Dollar',
}


@api_view(['GET'])
def rates(request):
    base = request.query_params.get('base', 'EUR')
    symbols = request.query_params.get('symbols', 'USD,CAD')
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')

    if not start_date or not end_date:
        return Response(
            {'error': 'start_date and end_date are required'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        start = datetime.strptime(start_date, '%Y-%m-%d').date()
        end = datetime.strptime(end_date, '%Y-%m-%d').date()
    except ValueError:
        return Response(
            {'error': 'Invalid date format. Use YYYY-MM-DD'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if end - start > timedelta(days=730):
        return Response(
            {'error': 'Date range cannot exceed 2 years'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        data = fetch_exchange_rates(base, symbols, start_date, end_date)
    except FrankfurterError as e:
        return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)

    return Response(data)


@api_view(['GET'])
def currencies(request):
    return Response(SUPPORTED_CURRENCIES)
