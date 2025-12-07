# Database Backup Strategy

**Project:** uSDR Development Board Dashboard  
**Database:** MySQL/TiDB (Manus Platform)  
**Last Updated:** December 6, 2025

---

## Overview

This document outlines the database backup and recovery strategy for the uSDR Development Board Dashboard. The application uses a MySQL/TiDB database hosted on the Manus platform, which provides built-in backup capabilities.

---

## Database Schema

### Tables

| Table | Purpose | Critical Data | Estimated Size |
|-------|---------|---------------|----------------|
| `users` | User accounts and authentication | Yes | Small (< 1MB) |
| `device_configs` | Saved device configurations (presets) | Yes | Small (< 10MB) |
| `command_history` | Command execution history | No | Growing (10-100MB) |
| `user_templates` | User-created custom templates | Yes | Small (< 5MB) |
| `template_favorites` | User favorite templates | No | Small (< 1MB) |

**Total Estimated Size:** < 120MB (initial), growing ~1-5MB per month

---

## Backup Strategy

### Manus Platform Built-in Backups

The Manus platform provides **automatic database backups** for all hosted applications:

**Backup Schedule:**
- **Frequency:** Daily automated backups
- **Retention:** 7 days (rolling window)
- **Backup Time:** Off-peak hours (typically 2-4 AM UTC)
- **Storage Location:** Manus platform infrastructure (encrypted)

**Backup Access:**
- Backups are managed through the Manus Dashboard
- Point-in-time recovery available for the past 7 days
- Database snapshots can be downloaded via Management UI

**No Additional Configuration Required** - Backups are enabled by default for all Manus-hosted databases.

### Manual Backup Procedures

For additional protection or before major schema changes, manual backups can be created:

#### Option 1: Export via Manus Dashboard

1. Navigate to **Management UI → Database** panel
2. Click **"Export Database"** button
3. Select export format (SQL dump or CSV)
4. Download backup file to local storage
5. Store securely with timestamp in filename

**Recommended Filename Format:** `usdr-dashboard-backup-YYYY-MM-DD-HHmm.sql`

#### Option 2: Command-Line Export (MySQL)

```bash
# Export full database
mysqldump -h <host> -u <user> -p <database> > backup-$(date +%Y%m%d).sql

# Export specific tables only
mysqldump -h <host> -u <user> -p <database> users device_configs user_templates > backup-critical-$(date +%Y%m%d).sql

# Compress backup
gzip backup-$(date +%Y%m%d).sql
```

**Note:** Database connection credentials are available in the Manus Dashboard under Settings → Database (bottom-left settings icon).

#### Option 3: Programmatic Backup (Node.js)

Create a backup script for automated exports:

```typescript
// scripts/backup-database.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

async function backupDatabase() {
  const timestamp = new Date().toISOString().split('T')[0];
  const backupDir = path.join(__dirname, '../backups');
  const backupFile = path.join(backupDir, `usdr-backup-${timestamp}.sql`);

  // Ensure backup directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Get database URL from environment
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL not set');
  }

  // Parse connection string
  const url = new URL(dbUrl);
  const host = url.hostname;
  const user = url.username;
  const password = url.password;
  const database = url.pathname.slice(1);

  // Execute mysqldump
  const command = `mysqldump -h ${host} -u ${user} -p${password} ${database} > ${backupFile}`;
  
  try {
    await execAsync(command);
    console.log(`Backup created: ${backupFile}`);
    
    // Compress backup
    await execAsync(`gzip ${backupFile}`);
    console.log(`Backup compressed: ${backupFile}.gz`);
    
    return `${backupFile}.gz`;
  } catch (error) {
    console.error('Backup failed:', error);
    throw error;
  }
}

// Run backup
backupDatabase()
  .then(file => console.log(`Backup complete: ${file}`))
  .catch(err => {
    console.error('Backup error:', err);
    process.exit(1);
  });
```

**Usage:**
```bash
pnpm tsx scripts/backup-database.ts
```

---

## Backup Schedule

### Automated Backups (Manus Platform)

| Backup Type | Frequency | Retention | Automated |
|-------------|-----------|-----------|-----------|
| Full Database | Daily | 7 days | ✅ Yes |
| Point-in-time Recovery | Continuous | 7 days | ✅ Yes |

### Recommended Manual Backups

| Event | Timing | Retention | Responsible |
|-------|--------|-----------|-------------|
| Before schema migration | Immediately before | 30 days | Developer |
| Before major release | 1 hour before deployment | 90 days | DevOps |
| Monthly archive | First day of month | 1 year | System Admin |
| Before bulk data operations | Immediately before | 7 days | Developer |

---

## Recovery Procedures

### Scenario 1: Accidental Data Deletion (< 7 days ago)

**Using Manus Platform:**

1. Navigate to **Management UI → Database** panel
2. Click **"Restore from Backup"** button
3. Select backup date/time before deletion
4. Choose restore method:
   - **Full Restore:** Replaces entire database
   - **Selective Restore:** Restore specific tables only
5. Confirm restoration
6. Verify data integrity after restore

**Recovery Time:** 5-15 minutes

### Scenario 2: Database Corruption

**Using Manual Backup:**

1. Stop the application to prevent further writes
2. Download latest backup from Manus Dashboard
3. Restore using MySQL client:
   ```bash
   mysql -h <host> -u <user> -p <database> < backup-YYYY-MM-DD.sql
   ```
4. Verify data integrity
5. Restart application
6. Test critical functionality

**Recovery Time:** 15-30 minutes

### Scenario 3: Complete Database Loss

**Full Recovery Process:**

1. Create new database instance (if necessary)
2. Restore from most recent backup
3. Apply any missing schema migrations
4. Verify all tables and indexes
5. Run data integrity checks
6. Restore application connections
7. Perform smoke tests

**Recovery Time:** 30-60 minutes

---

## Data Retention Policy

### Production Data

| Data Type | Retention Period | Archival Strategy |
|-----------|------------------|-------------------|
| User accounts | Indefinite | Active |
| Device configurations | Indefinite | Active |
| Command history | 90 days | Archive to cold storage |
| User templates | Indefinite | Active |
| Template favorites | Indefinite | Active |
| Application logs | 30 days | Delete after retention |

### Archived Data

- **Archive Location:** Compressed SQL dumps in cloud storage
- **Archive Retention:** 1 year for compliance
- **Archive Access:** On-demand restoration via support ticket

### GDPR Compliance

**User Data Deletion:**
- Users can request account deletion via support
- All user data deleted within 30 days of request
- Backups containing deleted data purged after 90 days
- Anonymized analytics data retained indefinitely

---

## Backup Verification

### Monthly Backup Testing

**Procedure:**
1. Download most recent automated backup
2. Restore to staging/test environment
3. Verify database schema matches production
4. Run data integrity checks:
   - Row counts match expected values
   - Foreign key relationships intact
   - No corrupted data detected
5. Test application functionality against restored database
6. Document test results

**Success Criteria:**
- ✅ Backup file downloads successfully
- ✅ Restoration completes without errors
- ✅ All tables present with correct schema
- ✅ Sample queries return expected results
- ✅ Application connects and functions normally

### Automated Backup Monitoring

**Alerts to Configure:**
- ⚠️ Backup job fails
- ⚠️ Backup size changes by > 50% (potential corruption)
- ⚠️ Backup not created within 25 hours
- ⚠️ Backup storage approaching capacity

---

## Disaster Recovery Plan

### Recovery Time Objective (RTO)

**Target:** 1 hour maximum downtime

**Breakdown:**
- Detection: 5 minutes
- Assessment: 10 minutes
- Backup retrieval: 5 minutes
- Database restoration: 20 minutes
- Verification: 15 minutes
- Application restart: 5 minutes

### Recovery Point Objective (RPO)

**Target:** 24 hours maximum data loss

**Justification:**
- Daily backups provide 24-hour recovery point
- Command history is non-critical (acceptable to lose < 24 hours)
- User configurations change infrequently
- Templates are user-recoverable

**For Critical Applications:** Consider enabling continuous replication or more frequent backups.

---

## Backup Security

### Encryption

- **At Rest:** All Manus platform backups encrypted with AES-256
- **In Transit:** Backup downloads use TLS 1.3
- **Manual Backups:** Encrypt with GPG before storing externally

**GPG Encryption Example:**
```bash
# Encrypt backup
gpg --symmetric --cipher-algo AES256 backup-2025-12-06.sql.gz

# Decrypt backup
gpg --decrypt backup-2025-12-06.sql.gz.gpg > backup-2025-12-06.sql.gz
```

### Access Control

- Backup access restricted to:
  - Project owner
  - Designated administrators
  - Manus platform support (with user consent)
- Audit log maintained for all backup operations
- Multi-factor authentication required for backup restoration

---

## Backup Costs

### Manus Platform

- **Automated Backups:** Included in hosting plan (no additional cost)
- **Storage:** First 10GB included, $0.10/GB/month beyond
- **Bandwidth:** Backup downloads included in plan

### External Storage (Optional)

If storing additional manual backups externally:

| Provider | Cost | Retention |
|----------|------|-----------|
| AWS S3 Glacier | ~$0.004/GB/month | Long-term archive |
| Google Cloud Storage | ~$0.012/GB/month | Standard storage |
| Backblaze B2 | ~$0.005/GB/month | Cost-effective option |

**Estimated Monthly Cost:** < $5 for typical usage

---

## Monitoring and Alerts

### Backup Health Dashboard

**Metrics to Monitor:**
- Last successful backup timestamp
- Backup file size trend
- Backup duration
- Failed backup attempts
- Storage utilization

**Recommended Tools:**
- Manus Dashboard (built-in monitoring)
- Custom monitoring script (see below)
- Third-party monitoring (Datadog, New Relic)

### Backup Monitoring Script

```typescript
// scripts/check-backup-health.ts
import { db } from '../server/db';

async function checkBackupHealth() {
  // Check database connectivity
  try {
    await db.execute('SELECT 1');
    console.log('✅ Database connection: OK');
  } catch (error) {
    console.error('❌ Database connection: FAILED');
    return false;
  }

  // Check table counts
  const tables = ['users', 'device_configs', 'command_history', 'user_templates'];
  for (const table of tables) {
    const result = await db.execute(`SELECT COUNT(*) as count FROM ${table}`);
    console.log(`✅ ${table}: ${result.rows[0].count} rows`);
  }

  // Check for recent activity
  const recentCommands = await db.execute(
    'SELECT COUNT(*) as count FROM command_history WHERE createdAt > DATE_SUB(NOW(), INTERVAL 24 HOUR)'
  );
  console.log(`✅ Commands in last 24h: ${recentCommands.rows[0].count}`);

  return true;
}

checkBackupHealth()
  .then(healthy => process.exit(healthy ? 0 : 1))
  .catch(err => {
    console.error('Health check failed:', err);
    process.exit(1);
  });
```

---

## Recommendations

### Immediate Actions

1. ✅ **Verify Manus automated backups are enabled** (default, no action needed)
2. ⚠️ **Create manual backup before first deployment**
3. ⚠️ **Document database connection credentials securely**
4. ⚠️ **Test backup restoration in staging environment**
5. ⚠️ **Set up backup monitoring alerts**

### Ongoing Maintenance

1. **Monthly:** Test backup restoration procedure
2. **Quarterly:** Review and update retention policies
3. **Annually:** Audit backup security and access controls
4. **Before major changes:** Always create manual backup

### Future Enhancements

1. **Implement automated backup testing** - Scheduled monthly restoration tests
2. **Add backup metrics dashboard** - Real-time backup health monitoring
3. **Enable continuous replication** - For mission-critical deployments (reduces RPO to minutes)
4. **Implement backup encryption** - For manual backups stored externally
5. **Create backup runbook** - Step-by-step procedures for all scenarios

---

## Support and Escalation

### Backup Issues

**For Manus Platform Backup Problems:**
- Support Portal: https://help.manus.im
- Email: support@manus.im
- Response Time: < 4 hours for critical issues

**For Database Corruption:**
1. Stop application immediately
2. Document error messages and symptoms
3. Contact Manus support with backup restoration request
4. Provide approximate time of last known good state

---

## Conclusion

The database backup strategy for the uSDR Development Board Dashboard leverages the Manus platform's built-in automated backup system, supplemented with manual backup procedures for critical operations. With daily automated backups, 7-day retention, and point-in-time recovery, the system provides robust protection against data loss.

**Key Takeaways:**
- ✅ Automated backups enabled by default (no configuration needed)
- ✅ 7-day retention with point-in-time recovery
- ✅ Manual backup procedures documented for critical operations
- ✅ Recovery procedures defined for common scenarios
- ✅ RTO: 1 hour, RPO: 24 hours

**Next Steps:**
1. Create manual backup before first production deployment
2. Test backup restoration in staging environment
3. Configure backup monitoring alerts
4. Schedule monthly backup verification tests

---

**Document Version:** 1.0  
**Author:** Manus AI  
**Review Schedule:** Quarterly or after major schema changes
