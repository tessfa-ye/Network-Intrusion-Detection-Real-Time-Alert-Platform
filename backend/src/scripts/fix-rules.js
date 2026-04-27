// Fix detection rules to match the simulator's actual event data
// Run with: mongosh "nidas-backend" src/scripts/fix-rules.js

db.detectionrules.updateOne(
  { name: 'Multiple Failed Login Attempts' },
  { $set: { conditions: [{ type: 'group', id: 'g1', operator: 'AND', conditions: [
    { type: 'condition', id: 'c1', field: 'event_type', operator: 'equals', value: 'login' },
    { type: 'condition', id: 'c2', field: 'severity', operator: 'equals', value: 'medium' }
  ]}]}}
);

db.detectionrules.updateOne(
  { name: 'Suspicious Outbound Traffic' },
  { $set: { conditions: [{ type: 'group', id: 'g2', operator: 'AND', conditions: [
    { type: 'condition', id: 'c3', field: 'event_type', operator: 'equals', value: 'network' },
    { type: 'condition', id: 'c4', field: 'severity', operator: 'equals', value: 'high' }
  ]}]}}
);

db.detectionrules.updateOne(
  { name: 'Unauthorized File Access' },
  { $set: { conditions: [{ type: 'group', id: 'g3', operator: 'AND', conditions: [
    { type: 'condition', id: 'c5', field: 'event_type', operator: 'equals', value: 'file_access' },
    { type: 'condition', id: 'c6', field: 'severity', operator: 'in', value: ['critical', 'high'] }
  ]}]}}
);

db.detectionrules.updateOne(
  { name: 'Admin Panel Access Attempt' },
  { $set: { conditions: [{ type: 'group', id: 'g4', operator: 'AND', conditions: [
    { type: 'condition', id: 'c7', field: 'event_type', operator: 'equals', value: 'api_access' },
    { type: 'condition', id: 'c8', field: 'severity', operator: 'equals', value: 'critical' }
  ]}]}}
);

db.detectionrules.updateOne(
  { name: 'Port Scan Detection' },
  { $set: { conditions: [{ type: 'group', id: 'g5', operator: 'AND', conditions: [
    { type: 'condition', id: 'c9', field: 'event_type', operator: 'equals', value: 'firewall' },
    { type: 'condition', id: 'c10', field: 'severity', operator: 'in', value: ['high', 'critical'] }
  ]}]}}
);

// Also reset all events to Pending so the engine reprocesses them
db.securityevents.updateMany({}, { $set: { status: 'Pending' } });

print('✅ Rules fixed and events reset to Pending — detection engine will process on next cron tick');
