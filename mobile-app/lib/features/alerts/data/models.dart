// lib/features/alerts/data/models.dart

import 'package:hive/hive.dart';

part 'models.g.dart';

@HiveType(typeId: 1)
class Alert {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final List<String> eventIds;

  @HiveField(2)
  final String ruleId;

  @HiveField(3)
  final String ruleName;

  @HiveField(4)
  final String severity; // low, medium, high, critical

  @HiveField(5)
  final String status; // pending, investigating, resolved, escalated, false_positive

  @HiveField(6)
  final DateTime createdAt;

  @HiveField(7)
  final DateTime updatedAt;

  @HiveField(8)
  final String? assignedTo;

  @HiveField(9)
  final List<InvestigationNote> notes;

  @HiveField(10)
  final String summary;

  @HiveField(11)
  final List<String> affectedAssets;

  Alert({
    required this.id,
    required this.eventIds,
    required this.ruleId,
    required this.ruleName,
    required this.severity,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.assignedTo,
    required this.notes,
    required this.summary,
    required this.affectedAssets,
  });

  factory Alert.fromJson(Map<String, dynamic> json) {
    // Handle MongoDB _id field which can be either string or object
    String getId(dynamic idField) {
      if (idField is String) {
        return idField;
      } else if (idField is Map) {
        // MongoDB returns _id as {$oid: "..."}
        return idField['\$oid']?.toString() ?? idField.toString();
      }
      return idField.toString();
    }

    // Safe string conversion
    String safeString(dynamic value, [String fallback = '']) {
      if (value == null) return fallback;
      if (value is String) return value;
      return value.toString();
    }

    // Safe string list conversion
    List<String> safeStringList(dynamic value) {
      if (value == null) return [];
      if (value is List) {
        return value.map((e) {
          if (e is String) return e;
          if (e is Map && e.containsKey('\$oid')) return e['\$oid'].toString();
          return e.toString();
        }).toList();
      }
      return [];
    }

    try {
      return Alert(
        id: getId(json['_id']),
        eventIds: safeStringList(json['eventIds']),
        ruleId: safeString(json['ruleId'], 'unknown-rule'),
        ruleName: safeString(json['ruleName'], 'Unknown Rule'),
        severity: safeString(json['severity'], 'medium'),
        status: safeString(json['status'], 'pending'),
        createdAt: json['createdAt'] != null 
            ? DateTime.parse(json['createdAt'] as String) 
            : DateTime.now(),
        updatedAt: json['updatedAt'] != null 
            ? DateTime.parse(json['updatedAt'] as String) 
            : DateTime.now(),
        assignedTo: json['assignedTo'] as String?,
        notes: (json['investigationNotes'] as List<dynamic>? ?? [])
            .map((e) {
              try {
                return InvestigationNote.fromJson(e as Map<String, dynamic>);
              } catch (e) {
                print('⚠️ Failed to parse note: $e');
                return null;
              }
            })
            .whereType<InvestigationNote>()
            .toList(),
        summary: safeString(json['summary'], 'No summary'),
        affectedAssets: safeStringList(json['affectedAssets']),
      );
    } catch (e) {
      print('❌ Error parsing alert: $e');
      print('📄 Raw JSON: $json');
      rethrow;
    }
  }

  Alert copyWith({
    String? id,
    List<String>? eventIds,
    String? ruleId,
    String? ruleName,
    String? severity,
    String? status,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? assignedTo,
    List<InvestigationNote>? notes,
    String? summary,
    List<String>? affectedAssets,
  }) {
    return Alert(
      id: id ?? this.id,
      eventIds: eventIds ?? this.eventIds,
      ruleId: ruleId ?? this.ruleId,
      ruleName: ruleName ?? this.ruleName,
      severity: severity ?? this.severity,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      assignedTo: assignedTo ?? this.assignedTo,
      notes: notes ?? this.notes,
      summary: summary ?? this.summary,
      affectedAssets: affectedAssets ?? this.affectedAssets,
    );
  }
}

@HiveType(typeId: 2)
class InvestigationNote {
  @HiveField(0)
  final String userId;

  @HiveField(1)
  final DateTime timestamp;

  @HiveField(2)
  final String note;

  InvestigationNote({required this.userId, required this.timestamp, required this.note});

  factory InvestigationNote.fromJson(Map<String, dynamic> json) => InvestigationNote(
        userId: json['userId'] as String,
        timestamp: DateTime.parse(json['timestamp'] as String),
        note: json['note'] as String,
      );
}
