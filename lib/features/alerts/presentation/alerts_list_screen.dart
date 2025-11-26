// lib/features/alerts/presentation/alerts_list_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models.dart';
import '../providers/alerts_provider.dart';
import 'alert_detail_screen.dart';

/// Screen that displays a list of alerts fetched from the backend.
class AlertsListScreen extends ConsumerStatefulWidget {
  const AlertsListScreen({super.key});

  @override
  ConsumerState<AlertsListScreen> createState() => _AlertsListScreenState();
}

class _AlertsListScreenState extends ConsumerState<AlertsListScreen> {
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAlerts();
  }

  Future<void> _loadAlerts() async {
    setState(() => _isLoading = true);
    await ref.read(alertsProvider.notifier).fetchAlerts();
    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final alerts = ref.watch(alertsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Alerts'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : alerts.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.notifications_none,
                        size: 64,
                        color: Colors.grey[400],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No alerts yet',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              color: Colors.grey[600],
                            ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'New alerts will appear here',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.grey[500],
                            ),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadAlerts,
                  child: ListView.builder(
                    itemCount: alerts.length,
                    itemBuilder: (context, index) {
                      final alert = alerts[index];
                      return Card(
                        margin: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        child: ListTile(
                          leading: Icon(
                            Icons.notification_important,
                            color: _severityColor(alert.severity),
                            size: 32,
                          ),
                          title: Text(
                            alert.summary,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: _severityColor(alert.severity)
                                          .withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      alert.severity.toUpperCase(),
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: _severityColor(alert.severity),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Status: ${alert.status}',
                                    style: const TextStyle(fontSize: 12),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                alert.createdAt
                                    .toLocal()
                                    .toString()
                                    .split('.')
                                    .first,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) =>
                                    AlertDetailScreen(alertId: alert.id),
                              ),
                            );
                          },
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  Color _severityColor(String severity) {
    switch (severity) {
      case 'low':
        return Colors.blue;
      case 'medium':
        return Colors.orange;
      case 'high':
        return Colors.deepOrange;
      case 'critical':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}
