import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../features/auth/data/models.dart';
import '../core/constants/app_constants.dart';

class StorageService {
  late final SharedPreferences _prefs;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  // Token management
  Future<void> saveAccessToken(String token) async {
    await _prefs.setString(AppConstants.accessTokenKey, token);
  }

  Future<void> saveRefreshToken(String token) async {
    await _prefs.setString(AppConstants.refreshTokenKey, token);
  }

  String? getAccessToken() {
    return _prefs.getString(AppConstants.accessTokenKey);
  }

  String? getRefreshToken() {
    return _prefs.getString(AppConstants.refreshTokenKey);
  }

  Future<void> clearTokens() async {
    await _prefs.remove(AppConstants.accessTokenKey);
    await _prefs.remove(AppConstants.refreshTokenKey);
  }

  // User management
  Future<void> saveUser(User user) async {
    await _prefs.setString(AppConstants.userKey, jsonEncode(user.toJson()));
  }

  User? getUser() {
    final userJson = _prefs.getString(AppConstants.userKey);
    if (userJson == null) return null;
    return User.fromJson(jsonDecode(userJson) as Map<String, dynamic>);
  }

  Future<void> clearUser() async {
    await _prefs.remove(AppConstants.userKey);
  }

  // Clear all data
  Future<void> clearAll() async {
    await _prefs.clear();
  }

  bool get isLoggedIn {
    return getAccessToken() != null && getUser() != null;
  }
}
