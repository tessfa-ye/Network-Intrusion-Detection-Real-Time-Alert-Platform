class NotificationPreferences {
  final bool email;
  final bool push;
  final String minSeverity;

  NotificationPreferences({
    required this.email,
    required this.push,
    required this.minSeverity,
  });

  factory NotificationPreferences.fromJson(Map<String, dynamic> json) {
    return NotificationPreferences(
      email: json['email'] as bool? ?? true,
      push: json['push'] as bool? ?? true,
      minSeverity: json['minSeverity'] as String? ?? 'medium',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'push': push,
      'minSeverity': minSeverity,
    };
  }
}

class User {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String role;
  final NotificationPreferences notificationPreferences;

  User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    required this.notificationPreferences,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      role: json['role'] as String,
      notificationPreferences: json['notificationPreferences'] != null
          ? NotificationPreferences.fromJson(
              json['notificationPreferences'] as Map<String, dynamic>)
          : NotificationPreferences(
              email: true,
              push: true,
              minSeverity: 'medium',
            ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'firstName': firstName,
      'lastName': lastName,
      'role': role,
      'notificationPreferences': notificationPreferences.toJson(),
    };
  }
}

class LoginResponse {
  final String accessToken;
  final String refreshToken;
  final User user;

  LoginResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      user: User.fromJson(json['user'] as Map<String, dynamic>),
    );
  }
}
