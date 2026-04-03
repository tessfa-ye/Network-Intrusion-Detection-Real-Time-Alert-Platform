import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
      ),
      body: user == null
          ? const Center(child: Text('User not logged in'))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // User Info Card
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 40,
                          backgroundColor: Theme.of(context).colorScheme.primary,
                          child: Text(
                            user.email.substring(0, 2).toUpperCase(),
                            style: const TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          '${user.firstName} ${user.lastName}',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          user.email,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: Colors.grey[600],
                              ),
                        ),
                        const SizedBox(height: 8),
                        Chip(
                          label: Text(user.role.toUpperCase()),
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Notification Settings Section
                Text(
                  'Notification Settings',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 12),
                Card(
                  child: Column(
                    children: [
                      SwitchListTile(
                        title: const Text('Email Notifications'),
                        subtitle: const Text('Receive alerts via email'),
                        value: user.notificationPreferences.email,
                        onChanged: (value) {
                          // TODO: Update notification preferences
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Feature coming soon!'),
                            ),
                          );
                        },
                      ),
                      const Divider(height: 1),
                      SwitchListTile(
                        title: const Text('Push Notifications'),
                        subtitle: const Text('Receive alerts on this device'),
                        value: user.notificationPreferences.push,
                        onChanged: (value) {
                          // TODO: Update notification preferences
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Feature coming soon!'),
                            ),
                          );
                        },
                      ),
                      const Divider(height: 1),
                      ListTile(
                        title: const Text('Minimum Severity'),
                        subtitle: Text(
                          'Only notify for ${user.notificationPreferences.minSeverity} and above',
                        ),
                        trailing: DropdownButton<String>(
                          value: user.notificationPreferences.minSeverity,
                          items: ['low', 'medium', 'high', 'critical']
                              .map((severity) => DropdownMenuItem(
                                    value: severity,
                                    child: Text(severity.toUpperCase()),
                                  ))
                              .toList(),
                          onChanged: (value) {
                            // TODO: Update minimum severity
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Feature coming soon!'),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Actions Section
                Text(
                  'Actions',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 12),
                Card(
                  child: Column(
                    children: [
                      ListTile(
                        leading: const Icon(Icons.info_outline),
                        title: const Text('About'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () {
                          showAboutDialog(
                            context: context,
                            applicationName: 'NIDAS',
                            applicationVersion: '1.0.0',
                            applicationLegalese: 'Network Intrusion Detection & Alert System',
                            children: [
                              const SizedBox(height: 16),
                              const Text(
                                'A real-time security monitoring platform for SMEs.',
                              ),
                            ],
                          );
                        },
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: Icon(
                          Icons.logout,
                          color: Theme.of(context).colorScheme.error,
                        ),
                        title: Text(
                          'Logout',
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.error,
                          ),
                        ),
                        onTap: () async {
                          final confirm = await showDialog<bool>(
                            context: context,
                            builder: (context) => AlertDialog(
                              title: const Text('Logout'),
                              content: const Text('Are you sure you want to logout?'),
                              actions: [
                                TextButton(
                                  onPressed: () => Navigator.of(context).pop(false),
                                  child: const Text('Cancel'),
                                ),
                                TextButton(
                                  onPressed: () => Navigator.of(context).pop(true),
                                  child: const Text('Logout'),
                                ),
                              ],
                            ),
                          );

                          if (confirm == true && context.mounted) {
                            await ref.read(authProvider.notifier).logout();
                          }
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
