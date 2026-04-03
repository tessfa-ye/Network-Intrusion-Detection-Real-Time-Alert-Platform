import 'package:flutter/foundation.dart' show kIsWeb;

class AppConstants {
  // API Configuration – choose the right host for the current platform
  static final String baseUrl = _determineBaseUrl();

  static String _determineBaseUrl() {
    // Production URL
    return 'https://nidas-backend-production.up.railway.app/api';
  }

  // WebSocket URL – same logic (adjust if you use a different WS endpoint)
  static final String wsUrl = _determineWsUrl();

  static String _determineWsUrl() {
    // Production URL
    return 'https://nidas-backend-production.up.railway.app';
  }

  // Storage Keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userKey = 'user_data';

  // Timeouts
  static const Duration apiTimeout = Duration(seconds: 30);
  static const Duration wsReconnectDelay = Duration(seconds: 5);

  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;
}
