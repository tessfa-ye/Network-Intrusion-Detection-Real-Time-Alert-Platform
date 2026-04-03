import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../core/constants/app_constants.dart';

class WebSocketService {
  IO.Socket? _socket;

  // Initialize and connect to the WebSocket server
  void connect(String token) {
    if (_socket != null && _socket!.connected) return;

    _socket = IO.io(AppConstants.wsUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
      'auth': {'token': token}, // Send token in auth object
    });

    _socket?.connect();

    _socket?.onConnect((_) {
      print('✅ WebSocket Connected');
      // Authenticate explicitly if needed, though 'auth' option usually handles it
      _socket?.emit('authenticate', token);
    });

    _socket?.onDisconnect((_) {
      print('❌ WebSocket Disconnected');
    });

    _socket?.onConnectError((data) {
      print('⚠️ WebSocket Connection Error: $data');
    });
  }

  // Disconnect from the server
  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }

  // Subscribe to a specific event
  void on(String event, Function(dynamic) callback) {
    _socket?.on(event, callback);
  }

  // Unsubscribe from an event
  void off(String event) {
    _socket?.off(event);
  }

  // Emit an event
  void emit(String event, dynamic data) {
    _socket?.emit(event, data);
  }
  
  // Subscribe to alerts channel
  void subscribeToAlerts() {
    _socket?.emit('subscribe:alerts');
  }
}
