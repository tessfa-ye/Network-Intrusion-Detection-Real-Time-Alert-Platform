// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'models.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class AlertAdapter extends TypeAdapter<Alert> {
  @override
  final int typeId = 1;

  @override
  Alert read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Alert(
      id: fields[0] as String,
      eventIds: (fields[1] as List).cast<String>(),
      ruleId: fields[2] as String,
      ruleName: fields[3] as String,
      severity: fields[4] as String,
      status: fields[5] as String,
      createdAt: fields[6] as DateTime,
      updatedAt: fields[7] as DateTime,
      assignedTo: fields[8] as String?,
      notes: (fields[9] as List).cast<InvestigationNote>(),
      summary: fields[10] as String,
      affectedAssets: (fields[11] as List).cast<String>(),
    );
  }

  @override
  void write(BinaryWriter writer, Alert obj) {
    writer
      ..writeByte(12)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.eventIds)
      ..writeByte(2)
      ..write(obj.ruleId)
      ..writeByte(3)
      ..write(obj.ruleName)
      ..writeByte(4)
      ..write(obj.severity)
      ..writeByte(5)
      ..write(obj.status)
      ..writeByte(6)
      ..write(obj.createdAt)
      ..writeByte(7)
      ..write(obj.updatedAt)
      ..writeByte(8)
      ..write(obj.assignedTo)
      ..writeByte(9)
      ..write(obj.notes)
      ..writeByte(10)
      ..write(obj.summary)
      ..writeByte(11)
      ..write(obj.affectedAssets);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AlertAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class InvestigationNoteAdapter extends TypeAdapter<InvestigationNote> {
  @override
  final int typeId = 2;

  @override
  InvestigationNote read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return InvestigationNote(
      userId: fields[0] as String,
      timestamp: fields[1] as DateTime,
      note: fields[2] as String,
    );
  }

  @override
  void write(BinaryWriter writer, InvestigationNote obj) {
    writer
      ..writeByte(3)
      ..writeByte(0)
      ..write(obj.userId)
      ..writeByte(1)
      ..write(obj.timestamp)
      ..writeByte(2)
      ..write(obj.note);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is InvestigationNoteAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
