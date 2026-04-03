import 'package:dio/dio.dart';
import '../core/constants/app_constants.dart';

class ApiService {
  late final Dio _dio;
  String? _accessToken;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConstants.baseUrl,
      connectTimeout: AppConstants.apiTimeout,
      receiveTimeout: AppConstants.apiTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    // Add interceptor for auth token
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          if (_accessToken != null) {
            options.headers['Authorization'] = 'Bearer $_accessToken';
          }
          return handler.next(options);
        },
        onError: (error, handler) {
          // Handle 401 Unauthorized - refresh token logic can go here
          return handler.next(error);
        },
      ),
    );
  }

  void setAccessToken(String token) {
    _accessToken = token;
  }

  void clearAccessToken() {
    _accessToken = null;
  }

  // Auth endpoints
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getMe() async {
    final response = await _dio.get('/auth/me');
    return response.data as Map<String, dynamic>;
  }

  // Alerts endpoints
  Future<List<dynamic>> getAlerts({
    String? status,
    String? severity,
    int limit = 20,
  }) async {
    final queryParams = <String, dynamic>{
      'limit': limit,
      if (status != null) 'status': status,
      if (severity != null) 'severity': severity,
    };

    final response = await _dio.get('/alerts', queryParameters: queryParams);
    return response.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> getAlert(String id) async {
    final response = await _dio.get('/alerts/$id');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateAlertStatus(
    String id,
    String status, {
    String? userId,
  }) async {
    final response = await _dio.patch('/alerts/$id', data: {
      'status': status,
      if (userId != null) 'userId': userId,
    });
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> addAlertNote(
    String id,
    String userId,
    String note,
  ) async {
    final response = await _dio.post('/alerts/$id/notes', data: {
      'userId': userId,
      'note': note,
    });
    return response.data as Map<String, dynamic>;
  }

  // Events endpoints
  Future<List<dynamic>> getEvents({int limit = 20}) async {
    final response = await _dio.get('/events', queryParameters: {
      'limit': limit,
    });
    return response.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> getEventStats() async {
    final response = await _dio.get('/events/stats');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getAlertStats() async {
    final response = await _dio.get('/alerts/stats');
    return response.data as Map<String, dynamic>;
  }
}
