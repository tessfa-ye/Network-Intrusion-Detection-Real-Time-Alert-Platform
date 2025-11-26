import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../services/api_service.dart';
import '../../../services/storage_service.dart';
import '../data/models.dart';

import '../../../services/websocket_service.dart';

// Service providers
final apiServiceProvider = Provider<ApiService>((ref) => ApiService());
final storageServiceProvider = Provider<StorageService>(
  (ref) => StorageService(),
);
final webSocketServiceProvider = Provider<WebSocketService>((ref) => WebSocketService());

// Auth state
enum AuthStatus { initial, authenticated, unauthenticated }

class AuthState {
  final AuthStatus status;
  final User? user;
  final String? error;

  AuthState({required this.status, this.user, this.error});

  AuthState copyWith({AuthStatus? status, User? user, String? error}) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      error: error,
    );
  }
}

// Auth state notifier
class AuthNotifier extends Notifier<AuthState> {
  late final ApiService _apiService;
  late final StorageService _storageService;
  late final WebSocketService _webSocketService;

  @override
  AuthState build() {
    _apiService = ref.read(apiServiceProvider);
    _storageService = ref.read(storageServiceProvider);
    _webSocketService = ref.read(webSocketServiceProvider);
    _checkAuthStatus();
    return AuthState(status: AuthStatus.initial);
  }

  Future<void> _checkAuthStatus() async {
    await _storageService.init();

    if (_storageService.isLoggedIn) {
      final user = _storageService.getUser();
      final token = _storageService.getAccessToken();

      if (user != null && token != null) {
        _apiService.setAccessToken(token);
        // Connect WebSocket with the stored token
        _webSocketService.connect(token);
        _webSocketService.subscribeToAlerts();
        state = AuthState(status: AuthStatus.authenticated, user: user);
        return;
      }
    }

    state = AuthState(status: AuthStatus.unauthenticated);
  }

  Future<void> login(String email, String password) async {
    try {
      state = AuthState(status: AuthStatus.initial);

      final response = await _apiService.login(email, password);
      final loginResponse = LoginResponse.fromJson(response);

      await _storageService.saveAccessToken(loginResponse.accessToken);
      await _storageService.saveRefreshToken(loginResponse.refreshToken);
      await _storageService.saveUser(loginResponse.user);

      _apiService.setAccessToken(loginResponse.accessToken);
      
      // Connect WebSocket with the new token
      _webSocketService.connect(loginResponse.accessToken);
      _webSocketService.subscribeToAlerts();
      
      print(
        '🔐 Auth state → authenticated for user: ${loginResponse.user.email}',
      );
      state = AuthState(
        status: AuthStatus.authenticated,
        user: loginResponse.user,
      );
    } catch (e) {
      state = AuthState(
        status: AuthStatus.unauthenticated,
        error: e.toString(),
      );
    }
  }

  Future<void> logout() async {
    // Disconnect WebSocket before clearing auth
    _webSocketService.disconnect();
    
    await _storageService.clearAll();
    _apiService.clearAccessToken();
    state = AuthState(status: AuthStatus.unauthenticated);
  }
}

// Auth provider
final authProvider = NotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);
