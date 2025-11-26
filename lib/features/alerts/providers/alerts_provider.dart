// lib/features/alerts/providers/alerts_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../../../services/api_service.dart';
import '../../../services/websocket_service.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/models.dart';

/// Provider for managing the list of alerts.
final alertsProvider = NotifierProvider<AlertsNotifier, List<Alert>>(
  AlertsNotifier.new,
);

class AlertsNotifier extends Notifier<List<Alert>> {
  late final ApiService _apiService;
  late final WebSocketService _webSocketService;
  static const String _alertsBoxName = 'alerts';

  @override
  List<Alert> build() {
    // Initialize services from the provider tree.
    _apiService = ref.read(apiServiceProvider);
    _webSocketService = ref.read(webSocketServiceProvider);
    
    // Listen for real-time alert updates
    _setupWebSocketListeners();
    
    // Load alerts from cache
    _loadFromCache();
    
    // Start with an empty list (will be filled by cache or fetch)
    return [];
  }

  /// Load alerts from Hive cache on startup
  Future<void> _loadFromCache() async {
    try {
      final box = await Hive.openBox<Alert>(_alertsBoxName);
      if (box.isNotEmpty) {
        state = box.values.toList();
        print('📦 Loaded ${state.length} alerts from cache');
      }
    } catch (e) {
      print('❗️ Failed to load from cache: $e');
    }
  }

  /// Save alerts to Hive cache
  Future<void> _saveToCache(List<Alert> alerts) async {
    try {
      final box = await Hive.openBox<Alert>(_alertsBoxName);
      await box.clear();
      for (var i = 0; i < alerts.length; i++) {
        await box.put(i, alerts[i]);
      }
      print('💾 Saved ${alerts.length} alerts to cache');
    } catch (e) {
      print('❗️ Failed to save to cache: $e');
    }
  }

  /// Set up WebSocket event listeners
  void _setupWebSocketListeners() {
    // Listen for new alerts
    _webSocketService.on('alert:new', (data) {
      print('🔔 New alert received: $data');
      try {
        final newAlert = Alert.fromJson(data as Map<String, dynamic>);
        // Add to the beginning of the list
        state = [newAlert, ...state];
      } catch (e) {
        print('❗️ Failed to parse new alert: $e');
      }
    });

    // Listen for alert updates
    _webSocketService.on('alert:updated', (data) {
      print('🔄 Alert updated: $data');
      try {
        final updatedAlert = Alert.fromJson(data as Map<String, dynamic>);
        state = [
          for (final alert in state)
            if (alert.id == updatedAlert.id) updatedAlert else alert,
        ];
      } catch (e) {
        print('❗️ Failed to parse updated alert: $e');
      }
    });
  }

  /// Fetch alerts from the backend with optional filters.
  Future<void> fetchAlerts({String? status, String? severity, int limit = 20}) async {
    try {
      final raw = await _apiService.getAlerts(
        status: status,
        severity: severity,
        limit: limit,
      );
      // Convert raw JSON to Alert objects.
      final alerts = raw.map((e) => Alert.fromJson(e as Map<String, dynamic>)).toList();
      state = alerts;
      
      // Save to cache for offline access
      await _saveToCache(alerts);
    } catch (e) {
      // In a real app you would surface this error to the UI.
      print('❗️ Failed to fetch alerts: $e');
      // If offline, user will still see cached data
    }
  }

  /// Update the status of a specific alert.
  Future<void> updateAlertStatus(String id, String newStatus, {String? userId}) async {
    try {
      await _apiService.updateAlertStatus(id, newStatus, userId: userId);
      // Optimistically update local state.
      state = [
        for (final alert in state)
          if (alert.id == id) alert.copyWith(status: newStatus) else alert,
      ];
    } catch (e) {
      print('❗️ Failed to update alert status: $e');
    }
  }

  /// Add an investigation note to an alert.
  Future<void> addNote(String id, String userId, String note) async {
    try {
      await _apiService.addAlertNote(id, userId, note);
      // Refresh the specific alert.
      final refreshed = await _apiService.getAlert(id);
      final updatedAlert = Alert.fromJson(refreshed);
      state = [
        for (final alert in state)
          if (alert.id == id) updatedAlert else alert,
      ];
    } catch (e) {
      print('❗️ Failed to add note: $e');
    }
  }
  
  /// Dispose WebSocket listeners
  void dispose() {
    _webSocketService.off('alert:new');
    _webSocketService.off('alert:updated');
  }
}
