// lib/features/alerts/presentation/alert_detail_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models.dart';
import '../providers/alerts_provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../services/api_service.dart';

/// Screen that shows detailed information for a single alert.
class AlertDetailScreen extends ConsumerStatefulWidget {
  final String alertId;
  const AlertDetailScreen({required this.alertId, super.key});

  @override
  ConsumerState<AlertDetailScreen> createState() => _AlertDetailScreenState();
}

class _AlertDetailScreenState extends ConsumerState<AlertDetailScreen> {
  late Future<Alert> _alertFuture;
  final TextEditingController _noteController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Load the alert details when the screen is created.
    _alertFuture = _loadAlert();
  }

  Future<Alert> _loadAlert() async {
    final api = ref.read(apiServiceProvider);
    final data = await api.getAlert(widget.alertId);
    return Alert.fromJson(data);
  }

  Future<void> _refresh() async {
    setState(() {
      _alertFuture = _loadAlert();
    });
  }

  Future<void> _updateStatus(String newStatus) async {
    await ref.read(alertsProvider.notifier).updateAlertStatus(widget.alertId, newStatus);
    await _refresh();
  }

  Future<void> _addNote() async {
    final note = _noteController.text.trim();
    if (note.isEmpty) return;
    // Assuming the user ID is stored in storage service; we fetch it.
    final storage = ref.read(storageServiceProvider);
    final user = storage.getUser();
    final userId = user?.id ?? '';
    await ref.read(alertsProvider.notifier).addNote(widget.alertId, userId, note);
    _noteController.clear();
    await _refresh();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Alert Detail'),
      ),
      body: FutureBuilder<Alert>(
        future: _alertFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }
          final alert = snapshot.data!;
          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(alert.summary, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 8),
                _infoRow('Severity', alert.severity),
                _infoRow('Status', alert.status),
                _infoRow('Created', alert.createdAt.toLocal().toString()),
                _infoRow('Updated', alert.updatedAt.toLocal().toString()),
                const Divider(height: 32),
                Text('Investigation Notes', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                if (alert.notes.isEmpty)
                  const Text('No notes yet.')
                else
                  ...alert.notes.map((note) => ListTile(
                        leading: const Icon(Icons.note),
                        title: Text(note.note),
                        subtitle: Text('by ${note.userId} @ ${note.timestamp.toLocal()}'),
                      )),
                const SizedBox(height: 16),
                TextField(
                  controller: _noteController,
                  decoration: const InputDecoration(
                    labelText: 'Add Note',
                    border: OutlineInputBorder(),
                  ),
                  minLines: 1,
                  maxLines: 3,
                ),
                const SizedBox(height: 8),
                ElevatedButton.icon(
                  onPressed: _addNote,
                  icon: const Icon(Icons.send),
                  label: const Text('Submit Note'),
                ),
                const Divider(height: 32),
                Text('Actions', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 12,
                  children: [
                    ElevatedButton(
                      onPressed: () => _updateStatus('investigating'),
                      child: const Text('Investigate'),
                    ),
                    ElevatedButton(
                      onPressed: () => _updateStatus('escalated'),
                      child: const Text('Escalate'),
                    ),
                    ElevatedButton(
                      onPressed: () => _updateStatus('false_positive'),
                      child: const Text('False Positive'),
                    ),
                    ElevatedButton(
                      onPressed: () => _updateStatus('resolved'),
                      child: const Text('Resolve'),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text('$label: ', style: const TextStyle(fontWeight: FontWeight.bold)),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
